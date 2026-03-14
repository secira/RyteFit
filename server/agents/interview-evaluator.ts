import { ChatOpenAI } from "@langchain/openai";
import { db } from "../db";
import { interviewSessions, interviewMessages, interviewEvaluations, applications, jobs, agentTasks } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { eventEmitter } from "../workflow/event-bus";
import { WorkflowEventTypes, WorkflowStates, AgentTypes } from "../workflow/event-types";
import { workflowManager } from "../workflow/state-machine";

/**
 * Interview Evaluator Agent
 * Analyzes interview transcripts and generates comprehensive candidate evaluations
 */

interface InterviewEvaluationInput {
  applicationId: string;
  interviewSessionId: string;
  jobDescription: string;
  requiredSkills: string[];
  transcript: Array<{
    role: 'ai' | 'user';
    content: string;
    timestamp: Date;
  }>;
}

interface InterviewEvaluationOutput {
  technicalScore: number; // 0-100
  communicationScore: number; // 0-100
  problemSolvingScore: number; // 0-100
  culturalFitScore: number; // 0-100
  overallScore: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  redFlags: string[];
  recommendation: 'strong_hire' | 'hire' | 'maybe' | 'no_hire';
  detailedFeedback: string;
  skillAssessments: Array<{
    skill: string;
    level: 'expert' | 'proficient' | 'basic' | 'none';
    evidence: string;
  }>;
}

export class InterviewEvaluatorAgent {
  private llm: ChatOpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required for InterviewEvaluatorAgent");
    }

    this.llm = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0.3,
    });
  }

  /**
   * Evaluate interview transcript
   */
  async evaluateInterview(input: InterviewEvaluationInput): Promise<InterviewEvaluationOutput> {
    // Format transcript for analysis
    const transcriptText = input.transcript
      .map(msg => `[${msg.role.toUpperCase()}]: ${msg.content}`)
      .join('\n\n');

    const systemPrompt = `You are an expert technical recruiter and interview evaluator with 15+ years of experience.

Your task is to analyze interview transcripts and provide comprehensive candidate evaluations.

Evaluation Criteria:
1. Technical Skills (0-100): Depth of technical knowledge, problem-solving ability, coding skills
2. Communication (0-100): Clarity of explanations, articulation of ideas, active listening
3. Problem Solving (0-100): Analytical thinking, approach to challenges, creativity
4. Cultural Fit (0-100): Alignment with company values, teamwork, growth mindset

For each required skill, assess the candidate's proficiency level:
- Expert: Deep understanding, can teach others, demonstrates mastery
- Proficient: Solid working knowledge, can work independently
- Basic: Fundamental understanding, needs guidance
- None: No evidence of this skill

Recommendation levels:
- Strong Hire: Exceptional candidate, hire immediately
- Hire: Good candidate, meets requirements well
- Maybe: Mixed signals, additional assessment needed
- No Hire: Does not meet requirements

Return your evaluation in the following JSON format:
{
  "technicalScore": <0-100>,
  "communicationScore": <0-100>,
  "problemSolvingScore": <0-100>,
  "culturalFitScore": <0-100>,
  "overallScore": <weighted average>,
  "strengths": [<3-5 key strengths>],
  "weaknesses": [<2-3 areas for improvement>],
  "redFlags": [<any concerning behaviors or responses>],
  "recommendation": "<strong_hire|hire|maybe|no_hire>",
  "detailedFeedback": "<2-3 paragraph comprehensive assessment>",
  "skillAssessments": [
    {
      "skill": "<skill name>",
      "level": "<expert|proficient|basic|none>",
      "evidence": "<specific example from transcript>"
    }
  ]
}`;

    const userPrompt = `Job Description:
${input.jobDescription}

Required Skills: ${input.requiredSkills.join(", ")}

Interview Transcript:
${transcriptText}

Provide a comprehensive evaluation of this candidate's interview performance in JSON format.`;

    try {
      const response = await this.llm.invoke([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ]);

      const content = response.content as string;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error("Failed to parse LLM response as JSON");
      }

      const result: InterviewEvaluationOutput = JSON.parse(jsonMatch[0]);
      
      console.log(`[InterviewEvaluator] Evaluated interview ${input.interviewSessionId}: Score ${result.overallScore}`);
      
      return result;

    } catch (error: any) {
      console.error("[InterviewEvaluator] Error during interview evaluation:", error);
      throw error;
    }
  }

  /**
   * Process an evaluation task from the agent task queue
   */
  async processTask(taskId: string): Promise<void> {
    const [task] = await db
      .select()
      .from(agentTasks)
      .where(eq(agentTasks.id, taskId));

    if (!task) {
      throw new Error(`Agent task ${taskId} not found`);
    }

    if (task.agentType !== AgentTypes.INTERVIEW_EVALUATOR) {
      throw new Error(`Task ${taskId} is not an interview evaluation task`);
    }

    const { interviewSessionId, applicationId } = task.taskData as { 
      interviewSessionId: string;
      applicationId: string;
    };

    try {
      // Update task status
      await db.update(agentTasks)
        .set({
          status: 'running',
          startedAt: new Date(),
        })
        .where(eq(agentTasks.id, taskId));

      // Get interview session
      const [session] = await db
        .select()
        .from(interviewSessions)
        .where(eq(interviewSessions.id, interviewSessionId));

      if (!session) {
        throw new Error(`Interview session ${interviewSessionId} not found`);
      }

      // Get interview messages (transcript)
      const messages = await db
        .select()
        .from(interviewMessages)
        .where(eq(interviewMessages.sessionId, interviewSessionId))
        .orderBy(interviewMessages.createdAt);

      // Get application and job
      const [application] = await db
        .select()
        .from(applications)
        .where(eq(applications.id, applicationId));

      if (!application) {
        throw new Error(`Application ${applicationId} not found`);
      }

      const [job] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, application.jobId));

      if (!job) {
        throw new Error(`Job ${application.jobId} not found`);
      }

      // Format transcript
      const transcript = messages.map(msg => ({
        role: msg.role as 'ai' | 'user',
        content: msg.content,
        timestamp: msg.createdAt || new Date(),
      }));

      // Perform evaluation
      const evaluationResult = await this.evaluateInterview({
        applicationId,
        interviewSessionId,
        jobDescription: job.description || '',
        requiredSkills: job.extractedSkills || [],
        transcript,
      });

      // Save evaluation to database
      await db.insert(interviewEvaluations).values({
        sessionId: interviewSessionId,
        overallScore: evaluationResult.overallScore,
        recommendation: evaluationResult.recommendation,
        technicalScore: evaluationResult.technicalScore,
        communicationScore: evaluationResult.communicationScore,
        problemSolvingScore: evaluationResult.problemSolvingScore,
        culturalFitScore: evaluationResult.culturalFitScore,
        strengths: evaluationResult.strengths,
        weaknesses: evaluationResult.weaknesses,
        keyInsights: evaluationResult.detailedFeedback,
        // Map skill assessments to question scores format
        questionScores: evaluationResult.skillAssessments.map((skill, idx) => ({
          questionId: `skill-${idx}`,
          question: `Assess ${skill.skill}`,
          answer: skill.evidence,
          score: skill.level === 'expert' ? 100 : skill.level === 'proficient' ? 75 : skill.level === 'basic' ? 50 : 0,
          feedback: `Proficiency: ${skill.level}`,
        })),
      });

      // Update application
      await db.update(applications)
        .set({
          evaluationScore: evaluationResult.overallScore,
          evaluatedAt: new Date(),
        })
        .where(eq(applications.id, applicationId));

      // Update workflow with evaluation score
      await workflowManager.updateWorkflowState(task.workflowRunId, {
        evaluationScore: evaluationResult.overallScore,
      });

      // Emit evaluation completed event
      await eventEmitter.emit({
        workflowRunId: task.workflowRunId,
        applicationId,
        eventType: WorkflowEventTypes.EVALUATION_COMPLETED,
        fromState: WorkflowStates.INTERVIEWING,
        toState: WorkflowStates.EVALUATED,
        data: {
          triggeredBy: 'system',
          agentType: AgentTypes.INTERVIEW_EVALUATOR,
          scores: {
            overallScore: evaluationResult.overallScore,
            technicalScore: evaluationResult.technicalScore,
            communicationScore: evaluationResult.communicationScore,
          },
          metadata: evaluationResult,
        },
        timestamp: new Date(),
      });

      // Transition workflow
      await workflowManager.transitionToState(task.workflowRunId, WorkflowStates.EVALUATED);

      // Mark task as completed
      await db.update(agentTasks)
        .set({
          status: 'completed',
          completedAt: new Date(),
          result: {
            success: true,
            data: evaluationResult as any,
          },
        })
        .where(eq(agentTasks.id, taskId));

      console.log(`[InterviewEvaluator] Completed task ${taskId} for interview ${interviewSessionId}`);

    } catch (error: any) {
      console.error(`[InterviewEvaluator] Task ${taskId} failed:`, error);

      await db.update(agentTasks)
        .set({
          status: 'failed',
          lastError: error.message,
          completedAt: new Date(),
          retryCount: (task.retryCount || 0) + 1,
        })
        .where(eq(agentTasks.id, taskId));

      throw error;
    }
  }
}

// Singleton instance
export const interviewEvaluatorAgent = new InterviewEvaluatorAgent();
