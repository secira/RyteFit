import { ChatOpenAI } from "@langchain/openai";
import { db } from "../db";
import { resumes, jobs, applications, agentTasks, workflowEvents, scoringConfigs } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { eventEmitter } from "../workflow/event-bus";
import { WorkflowEventTypes, WorkflowStates, AgentTypes } from "../workflow/event-types";
import { workflowManager } from "../workflow/state-machine";
import * as pdfParse from "pdf-parse";
import fs from "fs";

/**
 * Resume Screener Agent
 * Analyzes candidate resumes against job requirements and generates screening scores
 * Uses weighted scoring formula: Final Score = Σ(Parameter Score × Parameter Weight)
 */

interface ResumeScreeningInput {
  applicationId: string;
  resumeText: string;
  jobDescription: string;
  requiredSkills: string[];
  companyId?: string;
}

interface ParameterScores {
  skillsMatch: number; // 0-100
  experienceLevel: number; // 0-100
  education: number; // 0-100
  workHistoryRelevance: number; // 0-100
  keywords: number; // 0-100
  culturalFit: number; // 0-100
}

interface ResumeScreeningOutput {
  score: number; // 0-100 - final weighted score
  status: 'excellent' | 'strong' | 'good' | 'moderate' | 'weak'; // Based on scoring bands
  parameterScores: ParameterScores;
  matchedSkills: string[];
  missingSkills: string[];
  experienceMatch: boolean;
  reasoning: string;
  strengths: string[];
  concerns: string[];
}

export class ResumeScreenerAgent {
  private llm: ChatOpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required for ResumeScreenerAgent");
    }

    this.llm = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0.3,
      modelKwargs: {
        response_format: { type: "json_object" }
      },
    });
  }

  /**
   * Fetch company-specific scoring weights or return defaults
   */
  private async getScoringWeights(companyId?: string) {
    const defaults = {
      skillsMatch: 0.35,
      experienceLevel: 0.25,
      education: 0.15,
      workHistoryRelevance: 0.20,
      keywords: 0.05,
      culturalFit: 0.05,
    };

    if (!companyId) {
      return defaults;
    }

    try {
      const [config] = await db
        .select()
        .from(scoringConfigs)
        .where(eq(scoringConfigs.companyId, companyId));

      if (config) {
        return {
          skillsMatch: (config.skillsMatch ?? 35) / 100,
          experienceLevel: (config.experienceLevel ?? 28) / 100,
          education: (config.education ?? 12) / 100,
          workHistoryRelevance: (config.workHistoryRelevance ?? 22) / 100,
          keywords: (config.keywords ?? 7) / 100,
          culturalFit: (config.culturalFit ?? 8) / 100,
        };
      }
    } catch (error) {
      console.warn("[ResumeScreener] Failed to fetch scoring config, using defaults:", error);
    }

    return defaults;
  }

  /**
   * Map numeric score to scoring band
   */
  private getScoreBand(score: number): 'excellent' | 'strong' | 'good' | 'moderate' | 'weak' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'strong';
    if (score >= 60) return 'good';
    if (score >= 50) return 'moderate';
    return 'weak';
  }

  /**
   * Main screening function - analyzes resume against job using 7-step process
   * Step 1: Parse Resume → Extract structured data (skills, experience, education)
   * Step 2: Parse JD → Extract requirements and qualifications
   * Step 3: Semantic Analysis → Use NLP to understand context
   * Step 4: Calculate Scores → Apply weighted scoring per parameter
   * Step 5: Generate Match Score → Output 0-100% compatibility
   * Step 6-7: Ranking & Human Review (done at application level)
   */
  async screenResume(input: ResumeScreeningInput): Promise<ResumeScreeningOutput> {
    const systemPrompt = `You are an expert HR AI agent specializing in resume screening and candidate evaluation using semantic analysis.

SCORING FRAMEWORK - Analyze each dimension independently (0-100 scale):
1. Skills Match: % of required skills the candidate demonstrates (technical proficiency)
2. Experience Level: Years and relevance of experience to the role requirements
3. Education: Degree level and field relevance to the position
4. Work History Relevance: Career progression and alignment with role expectations
5. Keywords: Industry-specific keywords, certifications, tools mentioned
6. Cultural Fit: Soft skills, team collaboration, career motivations, values alignment

PROCESS:
Step 1 & 2: Parse the resume and JD to extract requirements
Step 3: Perform semantic analysis - understand context, transferable skills, career trajectory
Step 4: Score each of the 6 parameters independently (0-100)
Step 5: Calculate weighted final score using provided weights

GUIDELINES:
- Be objective and fair; don't penalize for missing nice-to-have requirements
- Look for transferable skills and related experience
- Consider the whole candidate profile, not just keyword matching
- Provide realistic scores based on actual alignment

Return analysis in JSON format:
{
  "parameterScores": {
    "skillsMatch": <0-100>,
    "experienceLevel": <0-100>,
    "education": <0-100>,
    "workHistoryRelevance": <0-100>,
    "keywords": <0-100>,
    "culturalFit": <0-100>
  },
  "matchedSkills": [<array of matched required skills>],
  "missingSkills": [<array of missing required skills>],
  "experienceMatch": <boolean - does candidate meet experience requirements>,
  "reasoning": "<explanation of overall assessment>",
  "strengths": [<3-5 key candidate strengths>],
  "concerns": [<2-3 main gaps or concerns>]
}`;

    const userPrompt = `Job Description:
${input.jobDescription}

Required Skills: ${input.requiredSkills.join(", ")}

Candidate Resume:
${input.resumeText}

Perform semantic analysis and score this candidate on each of the 6 dimensions. Return the JSON assessment.`;

    try {
      // Step 1-3: Parse resume, JD, and perform semantic analysis via LLM
      const response = await this.llm.invoke([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ]);

      // Parse JSON response
      const content = response.content as string;
      console.log("[ResumeScreener] LLM response length:", content.length);
      
      // Try parsing directly first (JSON mode should return clean JSON)
      let llmResult: any;
      try {
        llmResult = JSON.parse(content);
      } catch (parseError) {
        // Fallback: try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error("[ResumeScreener] Failed to find JSON in response:", content.substring(0, 500));
          throw new Error("Failed to parse LLM response as JSON");
        }
        llmResult = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }

      // Step 4: Get company-specific weights
      const weights = await this.getScoringWeights(input.companyId);

      // Step 5: Calculate weighted final score
      const parameterScores: ParameterScores = {
        skillsMatch: Math.round(llmResult.parameterScores.skillsMatch),
        experienceLevel: Math.round(llmResult.parameterScores.experienceLevel),
        education: Math.round(llmResult.parameterScores.education),
        workHistoryRelevance: Math.round(llmResult.parameterScores.workHistoryRelevance),
        keywords: Math.round(llmResult.parameterScores.keywords),
        culturalFit: Math.round(llmResult.parameterScores.culturalFit),
      };

      const finalScore = Math.round(
        (parameterScores.skillsMatch * weights.skillsMatch) +
        (parameterScores.experienceLevel * weights.experienceLevel) +
        (parameterScores.education * weights.education) +
        (parameterScores.workHistoryRelevance * weights.workHistoryRelevance) +
        (parameterScores.keywords * weights.keywords) +
        (parameterScores.culturalFit * weights.culturalFit)
      );

      const status = this.getScoreBand(finalScore);

      const result: ResumeScreeningOutput = {
        score: finalScore,
        status,
        parameterScores,
        matchedSkills: llmResult.matchedSkills || [],
        missingSkills: llmResult.missingSkills || [],
        experienceMatch: llmResult.experienceMatch || false,
        reasoning: llmResult.reasoning || "",
        strengths: llmResult.strengths || [],
        concerns: llmResult.concerns || [],
      };
      
      console.log(`[ResumeScreener] Screened application ${input.applicationId}: Score ${result.score}% (${result.status})`);
      
      return result;

    } catch (error: any) {
      console.error("[ResumeScreener] Error during resume screening:", error);
      throw error;
    }
  }

  /**
   * Process a screening task from the agent task queue
   */
  async processTask(taskId: string): Promise<void> {
    // Get task details
    const [task] = await db
      .select()
      .from(agentTasks)
      .where(eq(agentTasks.id, taskId));

    if (!task) {
      throw new Error(`Agent task ${taskId} not found`);
    }

    if (task.agentType !== AgentTypes.RESUME_SCREENER) {
      throw new Error(`Task ${taskId} is not a resume screening task`);
    }

    const { applicationId } = task.taskData as { applicationId: string };

    try {
      // Update task status to running
      await db.update(agentTasks)
        .set({
          status: 'running',
          startedAt: new Date(),
        })
        .where(eq(agentTasks.id, taskId));

      // Get application, resume, and job data
      const [application] = await db
        .select()
        .from(applications)
        .where(eq(applications.id, applicationId));

      if (!application) {
        throw new Error(`Application ${applicationId} not found`);
      }

      const [resume] = await db
        .select()
        .from(resumes)
        .where(eq(resumes.applicationId, applicationId));

      if (!resume) {
        throw new Error(`Resume for application ${applicationId} not found`);
      }

      const [job] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, application.jobId));

      if (!job) {
        throw new Error(`Job ${application.jobId} not found`);
      }

      // Perform screening with company-specific weights
      const screeningResult = await this.screenResume({
        applicationId,
        resumeText: resume.rawText || '',
        jobDescription: job.description || '',
        requiredSkills: job.extractedSkills || [],
        companyId: job.companyId,
      });

      // Update application with screening result
      await db.update(applications)
        .set({
          screeningScore: screeningResult.score,
          screeningStatus: screeningResult.score >= 75 ? 'passed' : 'failed',
          screeningData: {
            matchedSkills: screeningResult.matchedSkills,
            missingSkills: screeningResult.missingSkills,
            experienceMatch: screeningResult.experienceMatch,
            reasoning: screeningResult.reasoning,
            strengths: screeningResult.strengths,
            concerns: screeningResult.concerns,
          } as any,
          screenedAt: new Date(),
        })
        .where(eq(applications.id, applicationId));

      // Update workflow with screening score
      await workflowManager.updateWorkflowState(task.workflowRunId, {
        screeningScore: screeningResult.score,
      });

      // Emit screening completed event
      await eventEmitter.emit({
        workflowRunId: task.workflowRunId,
        applicationId,
        jobId: application.jobId,
        eventType: WorkflowEventTypes.SCREENING_COMPLETED,
        fromState: WorkflowStates.SCREENING,
        toState: screeningResult.score >= 75 ? WorkflowStates.SCREEN_PASSED : WorkflowStates.SCREEN_FAILED,
        data: {
          triggeredBy: 'system',
          agentType: AgentTypes.RESUME_SCREENER,
          scores: { screeningScore: screeningResult.score },
          metadata: screeningResult,
        },
      } as any);

      // Transition workflow to next state (top 10-20% pass, rest fail)
      const nextState = screeningResult.score >= 75 
        ? WorkflowStates.SCREEN_PASSED 
        : WorkflowStates.SCREEN_FAILED;
      
      // Log scoring bands for human review
      console.log(`[ResumeScreener] Candidate band: ${screeningResult.status} (${screeningResult.score}%) - ${screeningResult.status === 'excellent' || screeningResult.status === 'strong' ? '✓ TOP CANDIDATES FOR HUMAN REVIEW' : 'Standard processing'}`);

      await workflowManager.transitionToState(task.workflowRunId, nextState);

      // Mark task as completed
      await db.update(agentTasks)
        .set({
          status: 'completed',
          completedAt: new Date(),
          result: {
            success: true,
            data: screeningResult as any,
          },
        })
        .where(eq(agentTasks.id, taskId));

      console.log(`[ResumeScreener] Completed task ${taskId} for application ${applicationId}`);

    } catch (error: any) {
      console.error(`[ResumeScreener] Task ${taskId} failed:`, error);

      // Mark task as failed
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
export const resumeScreenerAgent = new ResumeScreenerAgent();
