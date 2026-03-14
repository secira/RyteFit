import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { db } from "../db";
import { scoringConfigs } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * LangGraph-based Resume Screening Workflow
 * Multi-step analysis with state management for better accuracy
 */

// Define state annotation for resume screening workflow
export const ResumeScreeningStateAnnotation = Annotation.Root({
  // Input data
  applicationId: Annotation<string>(),
  resumeText: Annotation<string>(),
  jobDescription: Annotation<string>(),
  requiredSkills: Annotation<string[]>(),
  companyId: Annotation<string | undefined>(),
  
  // Extracted data from resume
  parsedResume: Annotation<{
    skills: string[];
    experience: { company: string; role: string; duration: string; }[];
    education: { institution: string; degree: string; field: string; }[];
    summary: string;
  } | null>({
    default: () => null,
  }),
  
  // Extracted data from job description
  parsedJob: Annotation<{
    requiredSkills: string[];
    requiredExperience: string;
    requiredEducation: string;
    responsibilities: string[];
  } | null>({
    default: () => null,
  }),
  
  // Semantic analysis results
  semanticAnalysis: Annotation<{
    transferableSkills: string[];
    careerProgression: string;
    contextualFit: string;
  } | null>({
    default: () => null,
  }),
  
  // Parameter scores (0-100 each)
  parameterScores: Annotation<{
    skillsMatch: number;
    experienceLevel: number;
    education: number;
    workHistoryRelevance: number;
    keywords: number;
    culturalFit: number;
  } | null>({
    default: () => null,
  }),
  
  // Scoring weights
  weights: Annotation<{
    skillsMatch: number;
    experienceLevel: number;
    education: number;
    workHistoryRelevance: number;
    keywords: number;
    culturalFit: number;
  } | null>({
    default: () => null,
  }),
  
  // Final results
  finalScore: Annotation<number>({
    default: () => 0,
  }),
  
  status: Annotation<'excellent' | 'strong' | 'good' | 'moderate' | 'weak'>({
    default: () => 'weak',
  }),
  
  matchedSkills: Annotation<string[]>({
    default: () => [],
  }),
  
  missingSkills: Annotation<string[]>({
    default: () => [],
  }),
  
  experienceMatch: Annotation<boolean>({
    default: () => false,
  }),
  
  reasoning: Annotation<string>({
    default: () => '',
  }),
  
  strengths: Annotation<string[]>({
    default: () => [],
  }),
  
  concerns: Annotation<string[]>({
    default: () => [],
  }),
  
  // Error handling
  error: Annotation<string | null>({
    default: () => null,
  }),
});

export type ResumeScreeningState = typeof ResumeScreeningStateAnnotation.State;

// Initialize LLM
const llm = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0.3,
  modelKwargs: {
    response_format: { type: "json_object" }
  },
});

/**
 * Node 1: Parse Resume - Extract structured data
 */
async function parseResumeNode(state: ResumeScreeningState): Promise<Partial<ResumeScreeningState>> {
  console.log(`[ResumeScreeningGraph] Step 1: Parsing resume for application ${state.applicationId}`);
  
  const prompt = `You are an expert resume parser. Extract structured information from the following resume.

Resume:
${state.resumeText}

Return JSON with:
{
  "skills": [array of technical and soft skills],
  "experience": [{ "company": "...", "role": "...", "duration": "..." }],
  "education": [{ "institution": "...", "degree": "...", "field": "..." }],
  "summary": "brief professional summary"
}`;

  try {
    const response = await llm.invoke([{ role: "user", content: prompt }]);
    const content = response.content as string;
    const parsedResume = JSON.parse(content);
    
    console.log(`[ResumeScreeningGraph] Resume parsed: ${parsedResume.skills?.length || 0} skills found`);
    
    return { parsedResume };
  } catch (error: any) {
    console.error("[ResumeScreeningGraph] Error parsing resume:", error.message);
    return { error: `Failed to parse resume: ${error.message}` };
  }
}

/**
 * Node 2: Parse Job Description - Extract requirements
 */
async function parseJobNode(state: ResumeScreeningState): Promise<Partial<ResumeScreeningState>> {
  console.log(`[ResumeScreeningGraph] Step 2: Parsing job description`);
  
  const prompt = `You are an expert job requirement analyzer. Extract structured requirements from the following job description.

Job Description:
${state.jobDescription}

Required Skills from Posting: ${state.requiredSkills.join(", ")}

Return JSON with:
{
  "requiredSkills": [array of required technical and soft skills],
  "requiredExperience": "minimum experience requirement",
  "requiredEducation": "education requirement",
  "responsibilities": [key responsibilities]
}`;

  try {
    const response = await llm.invoke([{ role: "user", content: prompt }]);
    const content = response.content as string;
    const parsedJob = JSON.parse(content);
    
    console.log(`[ResumeScreeningGraph] Job parsed: ${parsedJob.requiredSkills?.length || 0} required skills`);
    
    return { parsedJob };
  } catch (error: any) {
    console.error("[ResumeScreeningGraph] Error parsing job:", error.message);
    return { error: `Failed to parse job: ${error.message}` };
  }
}

/**
 * Node 3: Semantic Analysis - Understand context and fit
 */
async function semanticAnalysisNode(state: ResumeScreeningState): Promise<Partial<ResumeScreeningState>> {
  console.log(`[ResumeScreeningGraph] Step 3: Performing semantic analysis`);
  
  const prompt = `You are an expert career analyst. Analyze the candidate's background against the job requirements.

Candidate Skills: ${state.parsedResume?.skills.join(", ")}
Candidate Experience: ${JSON.stringify(state.parsedResume?.experience)}
Required Skills: ${state.parsedJob?.requiredSkills.join(", ")}

Perform semantic analysis and return JSON with:
{
  "transferableSkills": [skills from resume that transfer to this role even if not exact matches],
  "careerProgression": "analysis of career trajectory and growth",
  "contextualFit": "how well the candidate's background fits the role context"
}`;

  try {
    const response = await llm.invoke([{ role: "user", content: prompt }]);
    const content = response.content as string;
    const semanticAnalysis = JSON.parse(content);
    
    console.log(`[ResumeScreeningGraph] Semantic analysis complete: ${semanticAnalysis.transferableSkills?.length || 0} transferable skills`);
    
    return { semanticAnalysis };
  } catch (error: any) {
    console.error("[ResumeScreeningGraph] Error in semantic analysis:", error.message);
    return { error: `Failed semantic analysis: ${error.message}` };
  }
}

/**
 * Node 4: Score Parameters - Calculate 6 dimension scores
 */
async function scoreParametersNode(state: ResumeScreeningState): Promise<Partial<ResumeScreeningState>> {
  console.log(`[ResumeScreeningGraph] Step 4: Scoring 6 parameters`);
  
  const prompt = `You are an expert HR evaluator. Score the candidate on each dimension (0-100 scale).

CANDIDATE DATA:
Skills: ${state.parsedResume?.skills.join(", ")}
Experience: ${JSON.stringify(state.parsedResume?.experience)}
Education: ${JSON.stringify(state.parsedResume?.education)}
Transferable Skills: ${state.semanticAnalysis?.transferableSkills.join(", ")}

JOB REQUIREMENTS:
Required Skills: ${state.parsedJob?.requiredSkills.join(", ")}
Required Experience: ${state.parsedJob?.requiredExperience}
Required Education: ${state.parsedJob?.requiredEducation}

SCORING DIMENSIONS:
1. Skills Match (0-100): % of required skills demonstrated
2. Experience Level (0-100): Years and relevance of experience
3. Education (0-100): Degree level and field relevance
4. Work History Relevance (0-100): Career progression and alignment
5. Keywords (0-100): Industry keywords and certifications
6. Cultural Fit (0-100): Soft skills and collaboration

Return JSON with:
{
  "parameterScores": {
    "skillsMatch": <0-100>,
    "experienceLevel": <0-100>,
    "education": <0-100>,
    "workHistoryRelevance": <0-100>,
    "keywords": <0-100>,
    "culturalFit": <0-100>
  },
  "matchedSkills": [skills from resume that match requirements],
  "missingSkills": [required skills not found in resume],
  "experienceMatch": <boolean>
}`;

  try {
    const response = await llm.invoke([{ role: "user", content: prompt }]);
    const content = response.content as string;
    const result = JSON.parse(content);
    
    console.log(`[ResumeScreeningGraph] Parameters scored`);
    
    return {
      parameterScores: result.parameterScores,
      matchedSkills: result.matchedSkills || [],
      missingSkills: result.missingSkills || [],
      experienceMatch: result.experienceMatch || false,
    };
  } catch (error: any) {
    console.error("[ResumeScreeningGraph] Error scoring parameters:", error.message);
    return { error: `Failed to score parameters: ${error.message}` };
  }
}

/**
 * Node 5: Load Weights - Fetch company-specific scoring weights
 */
async function loadWeightsNode(state: ResumeScreeningState): Promise<Partial<ResumeScreeningState>> {
  console.log(`[ResumeScreeningGraph] Step 5: Loading scoring weights`);
  
  const defaults = {
    skillsMatch: 0.35,
    experienceLevel: 0.25,
    education: 0.15,
    workHistoryRelevance: 0.20,
    keywords: 0.05,
    culturalFit: 0.05,
  };

  if (!state.companyId) {
    return { weights: defaults };
  }

  try {
    const [config] = await db
      .select()
      .from(scoringConfigs)
      .where(eq(scoringConfigs.companyId, state.companyId));

    if (config) {
      return {
        weights: {
          skillsMatch: (config.skillsMatch ?? 35) / 100,
          experienceLevel: (config.experienceLevel ?? 25) / 100,
          education: (config.education ?? 15) / 100,
          workHistoryRelevance: (config.workHistoryRelevance ?? 20) / 100,
          keywords: (config.keywords ?? 5) / 100,
          culturalFit: (config.culturalFit ?? 5) / 100,
        },
      };
    }
  } catch (error) {
    console.warn("[ResumeScreeningGraph] Failed to fetch scoring config, using defaults");
  }

  return { weights: defaults };
}

/**
 * Node 6: Calculate Final Score - Apply weights and generate final score
 */
async function calculateFinalScoreNode(state: ResumeScreeningState): Promise<Partial<ResumeScreeningState>> {
  console.log(`[ResumeScreeningGraph] Step 6: Calculating final weighted score`);
  
  if (!state.parameterScores || !state.weights) {
    return { error: "Missing parameter scores or weights" };
  }

  const finalScore = Math.round(
    (state.parameterScores.skillsMatch * state.weights.skillsMatch) +
    (state.parameterScores.experienceLevel * state.weights.experienceLevel) +
    (state.parameterScores.education * state.weights.education) +
    (state.parameterScores.workHistoryRelevance * state.weights.workHistoryRelevance) +
    (state.parameterScores.keywords * state.weights.keywords) +
    (state.parameterScores.culturalFit * state.weights.culturalFit)
  );

  let status: 'excellent' | 'strong' | 'good' | 'moderate' | 'weak';
  if (finalScore >= 90) status = 'excellent';
  else if (finalScore >= 75) status = 'strong';
  else if (finalScore >= 60) status = 'good';
  else if (finalScore >= 50) status = 'moderate';
  else status = 'weak';

  console.log(`[ResumeScreeningGraph] Final score: ${finalScore}% (${status})`);

  return { finalScore, status };
}

/**
 * Node 7: Generate Report - Create detailed analysis
 */
async function generateReportNode(state: ResumeScreeningState): Promise<Partial<ResumeScreeningState>> {
  console.log(`[ResumeScreeningGraph] Step 7: Generating screening report`);
  
  const prompt = `You are an expert recruiter providing feedback. Generate a screening report.

CANDIDATE SUMMARY:
${state.parsedResume?.summary}

SCORES:
- Skills Match: ${state.parameterScores?.skillsMatch}%
- Experience: ${state.parameterScores?.experienceLevel}%
- Education: ${state.parameterScores?.education}%
- Work History: ${state.parameterScores?.workHistoryRelevance}%
- Keywords: ${state.parameterScores?.keywords}%
- Cultural Fit: ${state.parameterScores?.culturalFit}%
- FINAL: ${state.finalScore}% (${state.status})

MATCHED SKILLS: ${state.matchedSkills.join(", ")}
MISSING SKILLS: ${state.missingSkills.join(", ")}

Generate JSON with:
{
  "reasoning": "2-3 sentence overall assessment explaining the score",
  "strengths": [3-5 key strengths],
  "concerns": [2-3 main gaps or concerns]
}`;

  try {
    const response = await llm.invoke([{ role: "user", content: prompt }]);
    const content = response.content as string;
    const report = JSON.parse(content);
    
    console.log(`[ResumeScreeningGraph] Report generated`);
    
    return {
      reasoning: report.reasoning || '',
      strengths: report.strengths || [],
      concerns: report.concerns || [],
    };
  } catch (error: any) {
    console.error("[ResumeScreeningGraph] Error generating report:", error.message);
    return {
      reasoning: `Analysis complete. Final score: ${state.finalScore}%`,
      strengths: state.matchedSkills.slice(0, 3),
      concerns: state.missingSkills.slice(0, 2),
    };
  }
}

/**
 * Build the resume screening workflow graph
 */
export function buildResumeScreeningGraph() {
  const workflow = new StateGraph(ResumeScreeningStateAnnotation);

  // Add all nodes
  workflow
    .addNode("parse_resume", parseResumeNode)
    .addNode("parse_job", parseJobNode)
    .addNode("semantic_analysis", semanticAnalysisNode)
    .addNode("score_parameters", scoreParametersNode)
    .addNode("load_weights", loadWeightsNode)
    .addNode("calculate_final_score", calculateFinalScoreNode)
    .addNode("generate_report", generateReportNode);

  // Define the flow (sequential analysis)
  workflow.addEdge(START, "parse_resume");
  workflow.addEdge("parse_resume", "parse_job");
  workflow.addEdge("parse_job", "semantic_analysis");
  workflow.addEdge("semantic_analysis", "score_parameters");
  workflow.addEdge("score_parameters", "load_weights");
  workflow.addEdge("load_weights", "calculate_final_score");
  workflow.addEdge("calculate_final_score", "generate_report");
  workflow.addEdge("generate_report", END);

  return workflow.compile();
}

// Export singleton graph instance
export const resumeScreeningGraph = buildResumeScreeningGraph();
