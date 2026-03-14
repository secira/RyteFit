import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { WorkflowStates, WorkflowEventTypes, WorkflowState } from "./event-types";
import { eventEmitter } from "./event-bus";
import { db } from "../db";
import { workflowRuns, applications } from "@shared/schema";
import { eq } from "drizzle-orm";

// Define state annotation for LangGraph
export const ApplicationWorkflowStateAnnotation = Annotation.Root({
  applicationId: Annotation<string>(),
  workflowRunId: Annotation<string>(),
  currentState: Annotation<WorkflowState>(),
  metadata: Annotation<{
    screeningScore?: number;
    evaluationScore?: number;
    rank?: number;
    rejectionReason?: string;
    [key: string]: any;
  }>({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({}),
  }),
});

// Type for state
export type ApplicationWorkflowState = typeof ApplicationWorkflowStateAnnotation.State;

// Node functions for each workflow step

/**
 * Submitted Node - Entry point
 */
async function submittedNode(state: ApplicationWorkflowState) {
  console.log(`[Workflow] Application ${state.applicationId} submitted, starting screening...`);
  
  // Emit screening started event
  await eventEmitter.emit({
    workflowRunId: state.workflowRunId,
    applicationId: state.applicationId,
    eventType: WorkflowEventTypes.SCREENING_STARTED,
    fromState: WorkflowStates.SUBMITTED,
    toState: WorkflowStates.SCREENING,
    data: {
      triggeredBy: 'system',
    },
    timestamp: new Date(),
  });

  return {
    currentState: WorkflowStates.SCREENING,
  };
}

/**
 * Screening Node - AI Resume Screening
 */
async function screeningNode(state: ApplicationWorkflowState) {
  console.log(`[Workflow] Screening application ${state.applicationId}...`);
  
  // This node waits for the ResumeScreenerAgent to complete
  // The agent will update the workflow state based on screening results
  
  // For now, return current state (agent will transition later)
  return {};
}

/**
 * Screen Passed Node - Candidate qualified
 */
async function screenPassedNode(state: ApplicationWorkflowState) {
  console.log(`[Workflow] Application ${state.applicationId} passed screening, scheduling interview...`);
  
  // Emit interview scheduling event
  await eventEmitter.emit({
    workflowRunId: state.workflowRunId,
    applicationId: state.applicationId,
    eventType: WorkflowEventTypes.INTERVIEW_SCHEDULED,
    fromState: WorkflowStates.SCREEN_PASSED,
    toState: WorkflowStates.INTERVIEW_SCHEDULED,
    data: {
      triggeredBy: 'system',
      scores: { screeningScore: state.metadata?.screeningScore || 0 },
    },
    timestamp: new Date(),
  });

  return {
    currentState: WorkflowStates.INTERVIEW_SCHEDULED,
  };
}

/**
 * Screen Failed Node - Candidate rejected
 */
async function screenFailedNode(state: ApplicationWorkflowState) {
  console.log(`[Workflow] Application ${state.applicationId} failed screening, sending rejection email...`);
  
  // Emit rejection email event
  await eventEmitter.emit({
    workflowRunId: state.workflowRunId,
    applicationId: state.applicationId,
    eventType: WorkflowEventTypes.EMAIL_SENT,
    fromState: WorkflowStates.SCREEN_FAILED,
    toState: WorkflowStates.REJECTED,
    data: {
      triggeredBy: 'system',
      agentType: 'notification_sender',
      metadata: { emailType: 'screening_rejection' },
    },
    timestamp: new Date(),
  });

  return {
    currentState: WorkflowStates.REJECTED,
  };
}

/**
 * Interview Scheduled Node
 */
async function interviewScheduledNode(state: ApplicationWorkflowState) {
  console.log(`[Workflow] Interview scheduled for application ${state.applicationId}`);
  
  // Wait for candidate to start interview
  return {};
}

/**
 * Interviewing Node
 */
async function interviewingNode(state: ApplicationWorkflowState) {
  console.log(`[Workflow] Application ${state.applicationId} interview in progress...`);
  
  // Wait for interview completion event
  return {};
}

/**
 * Evaluated Node - Interview Evaluation Complete
 */
async function evaluatedNode(state: ApplicationWorkflowState) {
  console.log(`[Workflow] Application ${state.applicationId} evaluated, updating rankings...`);
  
  // Emit ranking update event
  await eventEmitter.emit({
    workflowRunId: state.workflowRunId,
    applicationId: state.applicationId,
    eventType: WorkflowEventTypes.RANKING_STARTED,
    fromState: WorkflowStates.EVALUATED,
    toState: WorkflowStates.RANKED,
    data: {
      triggeredBy: 'system',
      agentType: 'ranker',
      scores: {
        screeningScore: state.metadata?.screeningScore || 0,
        evaluationScore: state.metadata?.evaluationScore || 0,
      },
    },
    timestamp: new Date(),
  });

  return {
    currentState: WorkflowStates.RANKED,
  };
}

/**
 * Ranked Node - Ready for recruiter decision
 */
async function rankedNode(state: ApplicationWorkflowState) {
  console.log(`[Workflow] Application ${state.applicationId} ranked, waiting for recruiter decision...`);
  
  // Wait for manual recruiter decision
  return {};
}

/**
 * Selected Node - Candidate hired
 */
async function selectedNode(state: ApplicationWorkflowState) {
  console.log(`[Workflow] Application ${state.applicationId} selected, sending offer...`);
  
  // Emit offer email event
  await eventEmitter.emit({
    workflowRunId: state.workflowRunId,
    applicationId: state.applicationId,
    eventType: WorkflowEventTypes.OFFER_SENT,
    fromState: WorkflowStates.SELECTED,
    toState: WorkflowStates.OFFER_SENT,
    data: {
      triggeredBy: 'recruiter',
      agentType: 'notification_sender',
      metadata: { emailType: 'offer_letter' },
    },
    timestamp: new Date(),
  });

  return {
    currentState: WorkflowStates.OFFER_SENT,
  };
}

/**
 * Rejected Node - Candidate not selected
 */
async function rejectedNode(state: ApplicationWorkflowState) {
  console.log(`[Workflow] Application ${state.applicationId} rejected, sending notification...`);
  
  // Emit rejection email event
  await eventEmitter.emit({
    workflowRunId: state.workflowRunId,
    applicationId: state.applicationId,
    eventType: WorkflowEventTypes.EMAIL_SENT,
    data: {
      triggeredBy: 'recruiter',
      agentType: 'notification_sender',
      metadata: { 
        emailType: 'final_rejection',
        reason: state.metadata?.rejectionReason,
      },
    },
    timestamp: new Date(),
  });

  return {};
}

// Conditional edge functions

/**
 * Route after screening based on score
 */
function routeAfterScreening(state: ApplicationWorkflowState): string {
  const screeningScore = state.metadata?.screeningScore || 0;
  const threshold = 75; // Minimum score to pass screening

  if (screeningScore >= threshold) {
    return "screen_passed";
  } else {
    return "screen_failed";
  }
}

// Build the LangGraph state machine
export function buildWorkflowGraph() {
  const workflow = new StateGraph(ApplicationWorkflowStateAnnotation);

  // Add all nodes
  workflow
    .addNode("submitted", submittedNode)
    .addNode("screening", screeningNode)
    .addNode("screen_passed", screenPassedNode)
    .addNode("screen_failed", screenFailedNode)
    .addNode("interview_scheduled", interviewScheduledNode)
    .addNode("interviewing", interviewingNode)
    .addNode("evaluated", evaluatedNode)
    .addNode("ranked", rankedNode)
    .addNode("selected", selectedNode)
    .addNode("rejected", rejectedNode);

  // Set entry point and edges
  workflow.addEdge(START, "submitted");
  workflow.addEdge("submitted", "screening");
  
  // Conditional routing after screening
  workflow.addConditionalEdges("screening", routeAfterScreening, {
    "screen_passed": "screen_passed",
    "screen_failed": "screen_failed",
  });

  // Define the flow
  workflow.addEdge("screen_passed", "interview_scheduled");
  workflow.addEdge("screen_failed", "rejected");
  workflow.addEdge("interview_scheduled", "interviewing");
  workflow.addEdge("interviewing", "evaluated");
  workflow.addEdge("evaluated", "ranked");
  
  // Ranked candidates can be selected or rejected (manual transition by recruiter)
  workflow.addEdge("ranked", "selected");
  
  // End states
  workflow.addEdge("selected", END);
  workflow.addEdge("rejected", END);

  return workflow.compile();
}

// Workflow manager - handles workflow execution
export class WorkflowManager {
  private graph = buildWorkflowGraph();

  /**
   * Start a new workflow for an application
   */
  async startWorkflow(applicationId: string): Promise<string> {
    // Create workflow run record
    const [workflowRun] = await db.insert(workflowRuns).values({
      applicationId,
      currentState: WorkflowStates.SUBMITTED,
      status: 'active',
    }).returning();

    console.log(`[WorkflowManager] Started workflow ${workflowRun.id} for application ${applicationId}`);

    // Emit application submitted event
    await eventEmitter.emit({
      workflowRunId: workflowRun.id,
      applicationId,
      eventType: WorkflowEventTypes.APPLICATION_SUBMITTED,
      toState: WorkflowStates.SUBMITTED,
      data: {
        triggeredBy: 'candidate',
      },
      timestamp: new Date(),
    });

    // Execute first transition (submitted → screening)
    await this.executeTransition(workflowRun.id, applicationId);

    return workflowRun.id;
  }

  /**
   * Update workflow state with metadata (e.g., screening score from AI agent)
   */
  async updateWorkflowState(
    workflowRunId: string,
    metadata: Record<string, any>
  ): Promise<void> {
    const [workflowRun] = await db
      .select()
      .from(workflowRuns)
      .where(eq(workflowRuns.id, workflowRunId));

    if (!workflowRun) {
      throw new Error(`Workflow run ${workflowRunId} not found`);
    }

    // Merge new metadata
    const currentMetadata = (workflowRun.checkpointData as any)?.metadata || {};
    const updatedMetadata = { ...currentMetadata, ...metadata };

    await db.update(workflowRuns)
      .set({
        checkpointData: { metadata: updatedMetadata },
        updatedAt: new Date(),
      })
      .where(eq(workflowRuns.id, workflowRunId));

    console.log(`[WorkflowManager] Updated workflow ${workflowRunId} metadata:`, metadata);
  }

  /**
   * Transition workflow to a new state
   */
  async transitionToState(
    workflowRunId: string,
    newState: WorkflowState
  ): Promise<void> {
    const [workflowRun] = await db
      .select()
      .from(workflowRuns)
      .where(eq(workflowRuns.id, workflowRunId));

    if (!workflowRun) {
      throw new Error(`Workflow run ${workflowRunId} not found`);
    }

    await db.update(workflowRuns)
      .set({
        previousState: workflowRun.currentState,
        currentState: newState,
        updatedAt: new Date(),
      })
      .where(eq(workflowRuns.id, workflowRunId));

    console.log(`[WorkflowManager] Transitioned ${workflowRunId}: ${workflowRun.currentState} → ${newState}`);

    // Execute next transition if workflow is active
    if (!workflowRun.isPaused) {
      await this.executeTransition(workflowRunId, workflowRun.applicationId);
    }
  }

  /**
   * Execute next state transition for a workflow
   */
  async executeTransition(workflowRunId: string, applicationId: string): Promise<void> {
    // Get current workflow state
    const [workflowRun] = await db
      .select()
      .from(workflowRuns)
      .where(eq(workflowRuns.id, workflowRunId));

    if (!workflowRun) {
      throw new Error(`Workflow run ${workflowRunId} not found`);
    }

    if (workflowRun.isPaused) {
      console.log(`[WorkflowManager] Workflow ${workflowRunId} is paused`);
      return;
    }

    const state: ApplicationWorkflowState = {
      applicationId,
      workflowRunId,
      currentState: workflowRun.currentState as WorkflowState,
      metadata: (workflowRun.checkpointData as any)?.metadata || {},
    };

    // Execute graph (invoke runs the state machine)
    try {
      const result = await this.graph.invoke(state);
      
      // Update workflow run with new state
      if (result.currentState && result.currentState !== workflowRun.currentState) {
        await db.update(workflowRuns)
          .set({
            previousState: workflowRun.currentState,
            currentState: result.currentState,
            checkpointData: { metadata: result.metadata || {} },
            updatedAt: new Date(),
          })
          .where(eq(workflowRuns.id, workflowRunId));

        console.log(`[WorkflowManager] Transitioned ${workflowRunId}: ${workflowRun.currentState} → ${result.currentState}`);
      }

    } catch (error: any) {
      console.error(`[WorkflowManager] Workflow execution error:`, error);
      
      // Update workflow with error
      await db.update(workflowRuns)
        .set({
          status: 'failed',
          lastError: error.message,
          lastErrorAt: new Date(),
          retryCount: workflowRun.retryCount + 1,
        })
        .where(eq(workflowRuns.id, workflowRunId));

      throw error;
    }
  }

  /**
   * Pause a workflow (manual recruiter control)
   */
  async pauseWorkflow(workflowRunId: string, userId: string, reason: string): Promise<void> {
    await db.update(workflowRuns)
      .set({
        isPaused: true,
        pausedBy: userId,
        pausedAt: new Date(),
        pauseReason: reason,
        status: 'paused',
      })
      .where(eq(workflowRuns.id, workflowRunId));

    console.log(`[WorkflowManager] Paused workflow ${workflowRunId}: ${reason}`);
  }

  /**
   * Resume a paused workflow
   */
  async resumeWorkflow(workflowRunId: string): Promise<void> {
    await db.update(workflowRuns)
      .set({
        isPaused: false,
        status: 'active',
      })
      .where(eq(workflowRuns.id, workflowRunId));

    console.log(`[WorkflowManager] Resumed workflow ${workflowRunId}`);

    // Continue execution
    const [workflowRun] = await db
      .select()
      .from(workflowRuns)
      .where(eq(workflowRuns.id, workflowRunId));

    if (workflowRun) {
      await this.executeTransition(workflowRunId, workflowRun.applicationId);
    }
  }
}

// Singleton instance
export const workflowManager = new WorkflowManager();
