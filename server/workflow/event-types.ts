// Workflow event types for the Agentic AI system

export const WorkflowEventTypes = {
  // Job creation events (NEW)
  JOB_DRAFT_CREATED: 'job_draft_created',
  JOB_AI_GENERATION_STARTED: 'job_ai_generation_started',
  JOB_AI_GENERATION_COMPLETED: 'job_ai_generation_completed',
  JOB_CREATED: 'job_created',
  
  // Job posting events (NEW)
  JOB_POSTING_STARTED: 'job_posting_started',
  JOB_POSTED_INTERNAL: 'job_posted_internal',
  JOB_POSTED_LINKEDIN: 'job_posted_linkedin',
  JOB_POSTED_INDEED: 'job_posted_indeed',
  JOB_POSTED_GLASSDOOR: 'job_posted_glassdoor',
  JOB_POSTING_COMPLETED: 'job_posting_completed',
  JOB_CLOSED: 'job_closed',
  
  // Application lifecycle events
  APPLICATION_SUBMITTED: 'application_submitted',
  
  // Screening events
  SCREENING_STARTED: 'screening_started',
  SCREENING_COMPLETED: 'screening_completed',
  SCREENING_FAILED: 'screening_failed',
  
  // Interview events
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  INTERVIEW_STARTED: 'interview_started',
  INTERVIEW_COMPLETED: 'interview_completed',
  INTERVIEW_CANCELLED: 'interview_cancelled',
  
  // Evaluation events
  EVALUATION_STARTED: 'evaluation_started',
  EVALUATION_COMPLETED: 'evaluation_completed',
  EVALUATION_FAILED: 'evaluation_failed',
  
  // Ranking events
  RANKING_STARTED: 'ranking_started',
  RANKING_COMPLETED: 'ranking_completed',
  RANKING_UPDATED: 'ranking_updated',
  
  // Decision events
  DECISION_MADE: 'decision_made',
  OFFER_SENT: 'offer_sent',
  OFFER_ACCEPTED: 'offer_accepted',
  OFFER_REJECTED: 'offer_rejected',
  
  // Email events
  EMAIL_SENT: 'email_sent',
  EMAIL_FAILED: 'email_failed',
  
  // Workflow control events
  WORKFLOW_PAUSED: 'workflow_paused',
  WORKFLOW_RESUMED: 'workflow_resumed',
  WORKFLOW_FAILED: 'workflow_failed',
  WORKFLOW_COMPLETED: 'workflow_completed',
  
  // Task management events
  TASK_CREATED: 'task_created',
  STATE_TRANSITION: 'state_transition',
} as const;

export type WorkflowEventType = typeof WorkflowEventTypes[keyof typeof WorkflowEventTypes];

// Workflow states
export const WorkflowStates = {
  // Job-level states (NEW)
  JOB_DRAFT: 'job_draft',
  JOB_AI_GENERATING: 'job_ai_generating',
  JOB_CREATED: 'job_created',
  JOB_POSTING_PENDING: 'job_posting_pending',
  JOB_POSTING_ACTIVE: 'job_posting_active',
  JOB_CLOSED: 'job_closed',
  
  // Application-level states (existing)
  SUBMITTED: 'submitted',
  SCREENING: 'screening',
  SCREEN_PASSED: 'screen_passed',
  SCREEN_FAILED: 'screen_failed',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  INTERVIEWING: 'interviewing',
  EVALUATED: 'evaluated',
  RANKED: 'ranked',
  SELECTED: 'selected',
  REJECTED: 'rejected',
  OFFER_SENT: 'offer_sent',
  OFFER_ACCEPTED: 'offer_accepted',
  OFFER_REJECTED: 'offer_rejected',
} as const;

export type WorkflowState = typeof WorkflowStates[keyof typeof WorkflowStates];

// Agent types
export const AgentTypes = {
  JOB_CREATOR: 'job_creator',              // NEW
  JOB_POSTER: 'job_poster',                // NEW
  RESUME_SCREENER: 'resume_screener',
  INTERVIEW_SCHEDULER: 'interview_scheduler',
  INTERVIEW_EVALUATOR: 'interview_evaluator',
  RANKER: 'ranker',
  NOTIFICATION_SENDER: 'notification_sender',
} as const;

export type AgentType = typeof AgentTypes[keyof typeof AgentTypes];

// Task types
export const TaskTypes = {
  CREATE_JOB_DESCRIPTION: 'create_job_description',    // NEW
  POST_JOB_INTERNAL: 'post_job_internal',              // NEW
  POST_JOB_LINKEDIN: 'post_job_linkedin',              // NEW
  POST_JOB_INDEED: 'post_job_indeed',                  // NEW
  POST_JOB_GLASSDOOR: 'post_job_glassdoor',            // NEW
  SCREEN_RESUME: 'screen_resume',
  SCHEDULE_INTERVIEW: 'schedule_interview',
  EVALUATE_INTERVIEW: 'evaluate_interview',
  RANK_CANDIDATES: 'rank_candidates',
  SEND_EMAIL: 'send_email',
  GENERATE_QUESTIONS: 'generate_questions',
} as const;

export type TaskType = typeof TaskTypes[keyof typeof TaskTypes];

// Event payload interface
export interface WorkflowEventPayload {
  workflowRunId: string;
  applicationId: string;
  jobId: string; // Job-centric workflow tracking
  eventType: WorkflowEventType;
  fromState?: WorkflowState;
  toState?: WorkflowState;
  data?: {
    triggeredBy?: 'system' | 'ai_agent' | 'recruiter' | 'candidate';
    agentType?: AgentType;
    aiModel?: string;
    scores?: Record<string, number>;
    decision?: string;
    metadata?: Record<string, any>;
  };
  timestamp: Date;
}
