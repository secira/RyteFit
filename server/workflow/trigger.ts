import { db } from "../db";
import { workflowRuns, agentTasks, applications, jobs } from "@shared/schema";
import { WorkflowStates, WorkflowEventTypes, TaskTypes, AgentTypes } from "./event-types";
import { eq } from "drizzle-orm";
import { WorkflowEventEmitter } from "./event-bus";

/**
 * Workflow Trigger Service
 * Initiates agentic AI workflow when applications are submitted
 */
export class WorkflowTrigger {
  private eventEmitter: WorkflowEventEmitter;

  constructor() {
    this.eventEmitter = new WorkflowEventEmitter();
  }

  /**
   * Start workflow for a new application submission
   * Creates workflow run and triggers resume screening agent
   */
  async startApplicationWorkflow(applicationId: string): Promise<string> {
    try {
      console.log(`[WorkflowTrigger] Starting workflow for application ${applicationId}`);

      // Get application details
      const [application] = await db
        .select()
        .from(applications)
        .where(eq(applications.id, applicationId));

      if (!application) {
        throw new Error(`Application ${applicationId} not found`);
      }

      // Get job details including jobPostingId
      const [job] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, application.jobId));

      if (!job) {
        throw new Error(`Job ${application.jobId} not found`);
      }

      // Create workflow run with jobId for job-centric workflow
      const [workflowRun] = await db
        .insert(workflowRuns)
        .values({
          applicationId,
          jobId: application.jobId,
          currentState: WorkflowStates.SUBMITTED,
        })
        .returning();

      console.log(`[WorkflowTrigger] Created workflow run ${workflowRun.id} for job ${job.jobPostingId}`);

      // Emit APPLICATION_SUBMITTED event with jobPostingId
      await this.eventEmitter.emit({
        workflowRunId: workflowRun.id,
        applicationId,
        jobId: application.jobId,
        eventType: WorkflowEventTypes.APPLICATION_SUBMITTED,
        data: {
          metadata: {
            jobId: application.jobId,
            jobPostingId: job.jobPostingId,
            jobTitle: job.title,
            candidateId: application.candidateId,
            resumeUrl: application.resumeUrl,
          },
        },
        timestamp: new Date(),
      });

      // Create agent task for resume screening with jobPostingId
      const [resumeScreeningTask] = await db
        .insert(agentTasks)
        .values({
          workflowRunId: workflowRun.id,
          applicationId,
          jobId: application.jobId,
          taskType: TaskTypes.SCREEN_RESUME,
          agentType: AgentTypes.RESUME_SCREENER,
          status: 'pending',
          taskData: {
            resumeUrl: application.resumeUrl || undefined,
            jobId: application.jobId,
            jobPostingId: job.jobPostingId,
            jobTitle: job.title,
            candidateId: application.candidateId,
          },
        })
        .returning();

      console.log(`[WorkflowTrigger] Created resume screening task ${resumeScreeningTask.id} for job ${job.jobPostingId}`);

      // Emit TASK_CREATED event with jobPostingId
      await this.eventEmitter.emit({
        workflowRunId: workflowRun.id,
        applicationId,
        jobId: application.jobId,
        eventType: WorkflowEventTypes.TASK_CREATED,
        data: {
          metadata: {
            taskId: resumeScreeningTask.id,
            agentType: 'resume_screener',
            jobPostingId: job.jobPostingId,
            jobTitle: job.title,
          },
        },
        timestamp: new Date(),
      });

      console.log(`[WorkflowTrigger] Workflow started successfully for application ${applicationId}`);
      return workflowRun.id;

    } catch (error: any) {
      console.error(`[WorkflowTrigger] Error starting workflow:`, error);
      throw error;
    }
  }

  /**
   * Transition workflow to next state
   * Called by agents after completing their tasks
   */
  async transitionWorkflow(params: {
    workflowRunId: string;
    newState: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const { workflowRunId, newState, metadata } = params;

    try {
      console.log(`[WorkflowTrigger] Transitioning workflow ${workflowRunId} to state ${newState}`);

      // Update workflow run state
      await db
        .update(workflowRuns)
        .set({
          currentState: newState,
          completedAt: newState === WorkflowStates.OFFER_ACCEPTED || newState === WorkflowStates.REJECTED
            ? new Date()
            : undefined,
        })
        .where(eq(workflowRuns.id, workflowRunId));

      // Get application ID
      const [workflowRun] = await db
        .select()
        .from(workflowRuns)
        .where(eq(workflowRuns.id, workflowRunId));

      if (!workflowRun) {
        throw new Error(`Workflow run ${workflowRunId} not found`);
      }

      // Emit state transition event
      await this.eventEmitter.emit({
        workflowRunId,
        applicationId: workflowRun.applicationId,
        eventType: WorkflowEventTypes.STATE_TRANSITION,
        data: {
          metadata: {
            newState,
            ...metadata,
          },
        },
        timestamp: new Date(),
      });

      console.log(`[WorkflowTrigger] Workflow transitioned to ${newState}`);

    } catch (error: any) {
      console.error(`[WorkflowTrigger] Error transitioning workflow:`, error);
      throw error;
    }
  }

  /**
   * Create follow-up agent task
   * Used to chain agent executions in the workflow
   */
  async createAgentTask(params: {
    workflowRunId: string;
    applicationId: string;
    taskType: string; // TaskTypes enum value
    agentType: string; // AgentTypes enum value
    taskData: Record<string, any>;
  }): Promise<string> {
    const { workflowRunId, applicationId, taskType, agentType, taskData } = params;

    try {
      console.log(`[WorkflowTrigger] Creating agent task: ${agentType}`);

      const [task] = await db
        .insert(agentTasks)
        .values({
          workflowRunId,
          applicationId,
          taskType, // Use correct TaskTypes enum value
          agentType, // Use correct AgentTypes enum value
          status: 'pending',
          taskData,
        })
        .returning();

      // Emit task created event
      await this.eventEmitter.emit({
        workflowRunId,
        applicationId,
        eventType: WorkflowEventTypes.TASK_CREATED,
        data: {
          metadata: {
            taskId: task.id,
            agentType,
          },
        },
        timestamp: new Date(),
      });

      console.log(`[WorkflowTrigger] Created ${agentType} task ${task.id}`);
      return task.id;

    } catch (error: any) {
      console.error(`[WorkflowTrigger] Error creating agent task:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const workflowTrigger = new WorkflowTrigger();
