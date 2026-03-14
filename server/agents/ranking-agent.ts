import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { 
  applications, 
  jobs, 
  agentTasks,
  users,
} from '@shared/schema';
import { WorkflowEventEmitter } from '../workflow/event-bus';
import { WorkflowManager } from '../workflow/state-machine';
import { WorkflowStates, WorkflowEventTypes } from '../workflow/event-types';

export class RankingAgent {
  private eventEmitter: WorkflowEventEmitter;
  private workflowManager: WorkflowManager;

  constructor(eventEmitter: WorkflowEventEmitter, workflowManager: WorkflowManager) {
    this.eventEmitter = eventEmitter;
    this.workflowManager = workflowManager;
  }

  /**
   * Rank all evaluated candidates for a specific job
   */
  async rankCandidatesForJob(params: {
    jobId: string;
  }): Promise<{
    jobId: string;
    totalCandidates: number;
    rankedCandidates: Array<{
      applicationId: string;
      rank: number;
      score: number;
      candidateName: string;
    }>;
  }> {
    const { jobId } = params;

    console.log(`[RankingAgent] Starting ranking for job ${jobId}`);

    // Get all evaluated applications for this job with candidate names
    const evaluatedApplications = await db
      .select({
        id: applications.id,
        candidateId: applications.candidateId,
        screeningScore: applications.screeningScore,
        evaluationScore: applications.evaluationScore,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(applications)
      .innerJoin(users, eq(applications.candidateId, users.id))
      .where(
        and(
          eq(applications.jobId, jobId),
          eq(applications.status, WorkflowStates.EVALUATED)
        )
      );

    if (evaluatedApplications.length === 0) {
      console.log(`[RankingAgent] No evaluated applications found for job ${jobId}`);
      return {
        jobId,
        totalCandidates: 0,
        rankedCandidates: [],
      };
    }

    // Calculate composite scores for ranking
    const candidatesWithScores = evaluatedApplications.map(app => {
      // Composite score: 40% screening + 60% interview evaluation
      const screeningScore = app.screeningScore || 0;
      const evaluationScore = app.evaluationScore || 0;
      const compositeScore = (screeningScore * 0.4) + (evaluationScore * 0.6);

      return {
        applicationId: app.id,
        candidateName: `${app.firstName || ''} ${app.lastName || ''}`.trim() || 'Unknown',
        screeningScore,
        evaluationScore,
        compositeScore,
      };
    });

    // Sort by composite score descending
    candidatesWithScores.sort((a, b) => b.compositeScore - a.compositeScore);

    // Assign ranks and update applications
    const rankedCandidates = [];
    for (let i = 0; i < candidatesWithScores.length; i++) {
      const candidate = candidatesWithScores[i];
      const rank = i + 1;

      // Update application with final rank and ranking score
      await db.update(applications)
        .set({
          finalRank: rank,
          rankingScore: candidate.compositeScore,
          status: WorkflowStates.RANKED,
        })
        .where(eq(applications.id, candidate.applicationId));

      rankedCandidates.push({
        applicationId: candidate.applicationId,
        rank,
        score: candidate.compositeScore,
        candidateName: candidate.candidateName,
      });

      console.log(`[RankingAgent] Ranked ${candidate.candidateName}: #${rank} (score: ${candidate.compositeScore.toFixed(2)})`);
    }

    // Emit ranking completed event for each candidate
    for (const candidate of rankedCandidates) {
      await this.eventEmitter.emit({
        workflowRunId: jobId,
        applicationId: candidate.applicationId,
        eventType: WorkflowEventTypes.RANKING_COMPLETED,
        toState: WorkflowStates.RANKED,
        data: {
          metadata: {
            jobId,
            rank: candidate.rank,
            score: candidate.score,
            totalCandidates: rankedCandidates.length,
          },
        },
        timestamp: new Date(),
      });
    }

    return {
      jobId,
      totalCandidates: rankedCandidates.length,
      rankedCandidates,
    };
  }

  /**
   * Execute ranking task from agent task queue
   */
  async executeTask(taskId: string): Promise<void> {
    console.log(`[RankingAgent] Executing task ${taskId}`);

    try {
      // Get task
      const [task] = await db
        .select()
        .from(agentTasks)
        .where(eq(agentTasks.id, taskId));

      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      if (task.status === 'completed') {
        console.log(`[RankingAgent] Task ${taskId} already completed`);
        return;
      }

      // Mark task as in progress
      await db.update(agentTasks)
        .set({ status: 'in_progress' })
        .where(eq(agentTasks.id, taskId));

      // Extract job ID from task data
      const jobId = task.taskData?.jobId as string;

      if (!jobId) {
        throw new Error('Job ID not found in task data');
      }

      // Perform ranking
      const rankingResult = await this.rankCandidatesForJob({ jobId });

      // Workflow transitions are handled by the state machine
      // Applications are already updated with status = RANKED in rankCandidatesForJob

      // Mark task as completed
      await db.update(agentTasks)
        .set({
          status: 'completed',
          completedAt: new Date(),
          result: {
            success: true,
            data: rankingResult as any,
          },
        })
        .where(eq(agentTasks.id, taskId));

      console.log(`[RankingAgent] Completed task ${taskId} - ranked ${rankingResult.totalCandidates} candidates`);

    } catch (error: any) {
      console.error(`[RankingAgent] Error executing task ${taskId}:`, error);

      // Update task with error
      await db.update(agentTasks)
        .set({
          status: 'failed',
          lastError: error.message,
        })
        .where(eq(agentTasks.id, taskId));

      throw error;
    }
  }

  /**
   * Trigger ranking for all jobs that have evaluated candidates
   */
  async triggerRankingForAllJobs(): Promise<void> {
    console.log('[RankingAgent] Triggering ranking for all jobs with evaluated candidates');

    // Get all jobs with evaluated applications
    const jobsWithEvaluatedApps = await db
      .select({ jobId: applications.jobId })
      .from(applications)
      .where(eq(applications.status, WorkflowStates.EVALUATED));

    // Get unique job IDs
    const uniqueJobIds = Array.from(new Set(jobsWithEvaluatedApps.map(a => a.jobId).filter(Boolean)));

    for (const jobId of uniqueJobIds) {
      if (!jobId) continue;

      // Create ranking task
      await db.insert(agentTasks).values({
        taskType: 'rank_candidates',
        agentType: 'ranker',
        workflowRunId: jobId, // Using jobId as proxy
        applicationId: jobId, // Using jobId as placeholder
        status: 'queued',
        taskData: { jobId },
        priority: 5, // Medium priority
      });

      console.log(`[RankingAgent] Created ranking task for job ${jobId}`);
    }
  }
}
