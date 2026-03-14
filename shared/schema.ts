import { sql, desc, asc } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  decimal,
  uuid,
  primaryKey,
  unique,
  uniqueIndex,
  real
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ==================== SHARED API TYPES ====================

// Generic paginated response type used by all API endpoints
export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  limit: number;
  offset: number;
};

// ==================== CORE AUTHENTICATION & SESSION TABLES ====================

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// ==================== COMPANY & USER MANAGEMENT ====================

// Companies table - Organizations using the platform
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  companyCode: varchar("company_code", { length: 4 }).unique(), // 4-letter unique code for job IDs (nullable initially for migration)
  domain: varchar("domain"), // Company email domain for auto-joining
  logoUrl: varchar("logo_url"),
  website: varchar("website"),
  industry: varchar("industry"),
  size: varchar("size"), // 1-10, 11-50, 51-200, 201-500, 500+
  description: text("description"),
  // Subscription & billing
  subscriptionTier: varchar("subscription_tier").default("trial"), // trial, starter, professional, enterprise
  subscriptionStatus: varchar("subscription_status").default("active"), // active, cancelled, suspended
  monthlyInterviewLimit: integer("monthly_interview_limit").default(10),
  interviewsUsedThisMonth: integer("interviews_used_this_month").default(0),
  billingCycle: varchar("billing_cycle").default("monthly"), // monthly, annual
  nextBillingDate: timestamp("next_billing_date"),
  subscriptionExpiryDate: timestamp("subscription_expiry_date"), // When the current subscription tier expires
  // Settings
  settings: jsonb("settings").$type<{
    branding?: {
      primaryColor?: string;
      logoUrl?: string;
    };
    emailNotifications?: boolean;
    autoArchiveApplications?: boolean;
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  domainIdx: index("companies_domain_idx").on(table.domain),
  subscriptionStatusIdx: index("companies_subscription_status_idx").on(table.subscriptionStatus),
}));

// Users table - Multi-role: Company Admin, Recruiter, Candidate
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  
  // Role-based access control
  role: varchar("role").notNull().default("candidate"), // company_admin, recruiter, candidate
  companyId: uuid("company_id").references(() => companies.id, { onDelete: 'cascade' }), // null for candidates
  
  // Authentication fields
  mobileNumber: varchar("mobile_number").unique(),
  passwordHash: varchar("password_hash"),
  authMethod: varchar("auth_method").default("replit"), // replit, email, google
  
  // Verification status
  isEmailVerified: boolean("is_email_verified").default(false),
  isMobileVerified: boolean("is_mobile_verified").default(false),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationExpiry: timestamp("email_verification_expiry"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  roleIdx: index("users_role_idx").on(table.role),
  companyIdx: index("users_company_idx").on(table.companyId),
}));

// OTP Verification table for mobile authentication
export const otpVerifications = pgTable("otp_verifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  mobileNumber: varchar("mobile_number").notNull(),
  otp: varchar("otp").notNull(),
  purpose: varchar("purpose").notNull(), // login, signup, verification
  attempts: integer("attempts").default(0),
  isUsed: boolean("is_used").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  mobileNumberIdx: index("otp_mobile_number_idx").on(table.mobileNumber),
  expiresAtIdx: index("otp_expires_at_idx").on(table.expiresAt),
}));

// ==================== JOB POSTING & APPLICATIONS ====================

// Jobs table - Job postings created by recruiters
export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  jobPostingId: varchar("job_posting_id").unique().notNull(), // Format: SCTE20241120001 - Primary tracking ID
  companyId: uuid("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  createdBy: uuid("created_by").references(() => users.id).notNull(), // Recruiter who created it
  
  // Job details
  title: varchar("title").notNull(),
  slug: varchar("slug").unique(), // URL-friendly slug for public job pages
  department: varchar("department"),
  location: varchar("location"), // Remote, On-site, Hybrid, or city name
  employmentType: varchar("employment_type").default("full_time"), // full_time, part_time, contract, internship
  experienceLevel: varchar("experience_level"), // entry, mid, senior, lead, executive
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: varchar("salary_currency").default("INR"),
  
  // Job description & requirements
  description: text("description").notNull(),
  responsibilities: text("responsibilities"),
  requirements: text("requirements"),
  niceToHave: text("nice_to_have"),
  
  // Status & workflow
  status: varchar("status").default("created"), // created, posted, applied, scheduled, interview_complete, selected, rejected
  applicationsCount: integer("applications_count").default(0),
  interviewsScheduled: integer("interviews_scheduled").default(0),
  
  // AI-generated data
  extractedSkills: jsonb("extracted_skills").$type<string[]>().default([]),
  aiGeneratedQuestions: jsonb("ai_generated_questions").$type<{
    questionId: string;
    question: string;
    category: string;
  }[]>().default([]),
  
  // Dates
  publishedAt: timestamp("published_at"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  companyIdx: index("jobs_company_idx").on(table.companyId),
  statusIdx: index("jobs_status_idx").on(table.status),
  createdByIdx: index("jobs_created_by_idx").on(table.createdBy),
  publishedAtIdx: index("jobs_published_at_idx").on(table.publishedAt),
}));

// Job Platform Postings - Track where jobs are posted (RyteFit Career Site, LinkedIn, Indeed, etc.)
export const jobPlatformPostings = pgTable("job_platform_postings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: uuid("job_id").references(() => jobs.id, { onDelete: 'cascade' }).notNull(),
  
  // Platform details
  platformName: varchar("platform_name").notNull(), // "RyteFit Career Site", "LinkedIn", "Indeed", etc.
  platformSlug: varchar("platform_slug").notNull(), // "rytefit", "linkedin", "indeed"
  
  // Posting details
  postedAt: timestamp("posted_at").defaultNow(),
  postedBy: uuid("posted_by").references(() => users.id), // User who posted (optional for auto-posts)
  
  // External reference
  externalUrl: text("external_url"), // URL on external platform (for LinkedIn, Indeed, etc.)
  externalJobId: varchar("external_job_id"), // ID on external platform
  
  // Status
  status: varchar("status").default("active"), // active, expired, removed
  
  // Metadata
  metadata: jsonb("metadata").$type<{
    views?: number;
    clicks?: number;
    applications?: number;
  }>().default({}),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  jobIdx: index("job_platform_postings_job_idx").on(table.jobId),
  platformSlugIdx: index("job_platform_postings_platform_slug_idx").on(table.platformSlug),
  // Unique constraint: One posting per job per platform
  jobPlatformUnique: uniqueIndex("job_platform_postings_job_platform_unique").on(table.jobId, table.platformSlug),
}));

// Resumes table - Parsed resume artifacts
export const resumes = pgTable("resumes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: 'cascade' }).notNull().unique(),
  
  // Resume storage
  storageUrl: text("storage_url"), // Cloud storage URL
  fileName: varchar("file_name"),
  fileSize: integer("file_size"),
  fileType: varchar("file_type"), // pdf, docx, txt
  
  // Parsed content
  rawText: text("raw_text"), // Full extracted text
  extractedSkills: jsonb("extracted_skills").$type<string[]>().default([]),
  parsedMetadata: jsonb("parsed_metadata").$type<{
    skills: string[];
    experience: { company: string; role: string; duration: string; }[];
    education: { institution: string; degree: string; field: string; year: string; }[];
    summary: string;
  }>(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  applicationIdx: index("resumes_application_idx").on(table.applicationId),
}));

// Applications table - Candidate applications to jobs
export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: uuid("job_id").references(() => jobs.id, { onDelete: 'cascade' }).notNull(),
  jobPostingId: varchar("job_posting_id"), // Job posting ID for grouping (e.g., TESO20251121071)
  candidateId: uuid("candidate_id").references(() => users.id, { onDelete: 'cascade' }), // Nullable for bulk resume uploads - candidates created without user account
  
  // Candidate info (from resume parsing or manual entry)
  candidateName: varchar("candidate_name"),
  candidateEmail: varchar("candidate_email"),
  candidatePhone: varchar("candidate_phone"),
  candidateLocation: varchar("candidate_location"),
  resumeText: text("resume_text"), // Raw resume text from PDF parsing
  
  // Application details
  resumeUrl: text("resume_url"), // Cloud storage URL (deprecated - use resumes.storageUrl)
  coverLetter: text("cover_letter"),
  status: varchar("status").default("applied"), // applied, screening, scheduled, interview_complete, selected, rejected
  
  // AI workflow state - summary fields for LangGraph state machine
  screeningScore: real("screening_score"), // 0-100 AI screening score
  screeningStatus: varchar("screening_status"), // pending, passed, failed
  screeningData: jsonb("screening_data").$type<{
    matchedSkills?: string[];
    missingSkills?: string[];
    experienceMatch?: boolean;
    reasoning?: string;
    strengths?: string[];
    concerns?: string[];
  }>(),
  screenedAt: timestamp("screened_at"),
  
  evaluationScore: real("evaluation_score"), // 0-100 interview evaluation score
  evaluatedAt: timestamp("evaluated_at"),
  
  // Ranking results - Final candidate ranking after all evaluations
  finalRank: integer("final_rank"), // 1, 2, 3... (1 is best) - Rank among all candidates for this job
  rankingScore: real("ranking_score"), // Composite score used for ranking (weighted average of screening + evaluation)
  
  // AI screening results (legacy - use screeningScore)
  aiMatchScore: real("ai_match_score"), // 0-100 percentage match
  aiRanking: integer("ai_ranking"), // Rank among all applicants for this job
  resumeParsingData: jsonb("resume_parsing_data").$type<{
    skills: string[];
    experience: { company: string; role: string; duration: string; }[];
    education: { institution: string; degree: string; field: string; year: string; }[];
    summary: string;
  }>(),
  
  // Recruiter notes & feedback
  recruiterNotes: text("recruiter_notes"),
  recruiterMatchScore: real("recruiter_match_score"), // 0-100 manual recruiter match score
  internalRating: integer("internal_rating"), // 1-5 stars
  assignedTo: uuid("assigned_to").references(() => users.id), // Recruiter assigned to review
  
  // Interview scheduling & tracking
  interviewScheduledAt: timestamp("interview_scheduled_at"), // When candidate selected interview date/time
  interviewLink: varchar("interview_link").unique(), // Auto-generated unique interview link
  interviewOutcome: varchar("interview_outcome"), // cleared, rejected, on_hold
  
  // Notification tracking
  notificationSent: boolean("notification_sent").default(false),
  notificationSentAt: timestamp("notification_sent_at"),
  
  // Metadata
  source: varchar("source"), // careers_page, linkedin, referral, etc.
  metadata: jsonb("metadata").$type<{
    referredBy?: string;
    customFields?: Record<string, any>;
  }>().default({}),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  jobIdx: index("applications_job_idx").on(table.jobId),
  candidateIdx: index("applications_candidate_idx").on(table.candidateId),
  statusIdx: index("applications_status_idx").on(table.status),
  aiRankingIdx: index("applications_ai_ranking_idx").on(table.aiRanking),
  assignedToIdx: index("applications_assigned_to_idx").on(table.assignedTo),
  screeningStatusIdx: index("applications_screening_status_idx").on(table.screeningStatus),
  // Unique constraint: Only one application per job per candidate email
  jobEmailUnique: uniqueIndex("applications_job_email_unique").on(table.jobId, table.candidateEmail),
}));

// ==================== AI SCREENING RESULTS ====================

// Screening Results - Detailed AI resume screening analysis
export const screeningResults = pgTable("screening_results", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: 'cascade' }).notNull().unique(),
  jobId: uuid("job_id").references(() => jobs.id).notNull(),
  candidateId: uuid("candidate_id"), // Nullable since B2B candidates don't have user accounts
  
  // Overall screening verdict
  overallScore: real("overall_score").notNull(), // 0-100
  recommendation: varchar("recommendation").notNull(), // strong_match, good_match, potential_match, weak_match, no_match
  
  // Detailed scoring dimensions
  skillsMatchScore: real("skills_match_score"), // 0-100
  experienceMatchScore: real("experience_match_score"), // 0-100
  educationMatchScore: real("education_match_score"), // 0-100
  culturalFitScore: real("cultural_fit_score"), // 0-100
  
  // Skill-by-skill breakdown
  skillsAnalysis: jsonb("skills_analysis").$type<{
    requiredSkill: string;
    candidateHas: boolean;
    proficiencyLevel?: string;
    yearsOfExperience?: number;
    matched: boolean;
  }[]>().default([]),
  
  // Experience analysis
  experienceAnalysis: jsonb("experience_analysis").$type<{
    totalYears: number;
    relevantYears: number;
    industryMatch: boolean;
    roleMatch: boolean;
    seniorityMatch: boolean;
  }>(),
  
  // AI-generated insights
  strengths: jsonb("strengths").$type<string[]>().default([]),
  concerns: jsonb("concerns").$type<string[]>().default([]),
  keyHighlights: text("key_highlights"),
  aiSummary: text("ai_summary"),
  
  // Resume quality metrics
  resumeQualityScore: real("resume_quality_score"), // 0-100
  resumeCompleteness: real("resume_completeness"), // 0-100
  
  // Metadata
  screenedBy: varchar("screened_by").default("ai"), // ai, human, hybrid
  aiModel: varchar("ai_model"), // gpt-4, gpt-4-turbo, etc.
  processingTime: integer("processing_time"), // milliseconds
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  applicationIdx: uniqueIndex("screening_results_application_idx").on(table.applicationId),
  jobIdx: index("screening_results_job_idx").on(table.jobId),
  recommendationIdx: index("screening_results_recommendation_idx").on(table.recommendation),
  overallScoreIdx: index("screening_results_overall_score_idx").on(table.overallScore),
}));

// ==================== SELECTION DECISIONS ====================

// Selection Decisions - Final recruiter hiring decisions
export const selectionDecisions = pgTable("selection_decisions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: 'cascade' }).notNull(),
  jobId: uuid("job_id").references(() => jobs.id).notNull(),
  candidateId: uuid("candidate_id"), // Nullable since B2B candidates don't have user accounts
  
  // Decision details
  decision: varchar("decision").notNull(), // selected, rejected, waitlisted, moved_to_next_round
  round: integer("round").default(1), // Decision round/stage (1 = initial screening, 2 = second round, etc.)
  stage: varchar("stage").default("screening"), // screening, technical_interview, behavioral_interview, final_round, offer
  decisionMadeBy: uuid("decision_made_by").references(() => users.id).notNull(), // Recruiter who made decision
  decisionDate: timestamp("decision_date").defaultNow(),
  
  // Rationale
  reason: text("reason"), // Why this decision was made
  internalNotes: text("internal_notes"), // Private notes for recruiters
  
  // Related data
  interviewEvaluationId: uuid("interview_evaluation_id").references(() => interviewEvaluations.id),
  screeningResultId: uuid("screening_result_id").references(() => screeningResults.id),
  
  // Offer details (if selected)
  offerExtended: boolean("offer_extended").default(false),
  offerExtendedDate: timestamp("offer_extended_date"),
  offerAccepted: boolean("offer_accepted"),
  offerAcceptedDate: timestamp("offer_accepted_date"),
  offerLetter: text("offer_letter"), // Store the full offer letter content
  
  // Compensation (if selected)
  offeredSalary: integer("offered_salary"),
  offeredCurrency: varchar("offered_currency").default("INR"),
  offeredBenefits: text("offered_benefits"),
  
  // Next steps
  nextSteps: text("next_steps"), // What happens after this decision
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  
  // Metadata
  metadata: jsonb("metadata").$type<{
    rejectionEmailSent?: boolean;
    offerEmailSent?: boolean;
    customFields?: Record<string, any>;
  }>().default({}),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  applicationIdx: index("selection_decisions_application_idx").on(table.applicationId),
  jobIdx: index("selection_decisions_job_idx").on(table.jobId),
  candidateIdx: index("selection_decisions_candidate_idx").on(table.candidateId),
  decisionIdx: index("selection_decisions_decision_idx").on(table.decision),
  decisionMadeByIdx: index("selection_decisions_made_by_idx").on(table.decisionMadeBy),
  decisionDateIdx: index("selection_decisions_date_idx").on(table.decisionDate),
  // Ensure only one decision per application per round/stage
  uniqueRoundStage: uniqueIndex("selection_decisions_application_round_stage_unique").on(table.applicationId, table.round, table.stage),
}));

// ==================== CANDIDATE PROFILES & RESUMES ====================

// Candidate Profiles - Extended profile data for candidates
export const candidateProfiles = pgTable("candidate_profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  
  // Professional info
  currentTitle: varchar("current_title"),
  currentCompany: varchar("current_company"),
  yearsOfExperience: integer("years_of_experience"),
  location: varchar("location"),
  linkedinUrl: varchar("linkedin_url"),
  githubUrl: varchar("github_url"),
  portfolioUrl: varchar("portfolio_url"),
  
  // Career preferences
  desiredRoles: jsonb("desired_roles").$type<string[]>().default([]),
  preferredLocations: jsonb("preferred_locations").$type<string[]>().default([]),
  expectedSalary: integer("expected_salary"),
  remotePreference: varchar("remote_preference"), // remote_only, hybrid, onsite, flexible
  
  // Skills & competencies
  skills: jsonb("skills").$type<{
    name: string;
    level: string; // beginner, intermediate, advanced, expert
    yearsOfExperience?: number;
  }[]>().default([]),
  
  // Work history
  workHistory: jsonb("work_history").$type<{
    company: string;
    title: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
  }[]>().default([]),
  
  // Education
  education: jsonb("education").$type<{
    institution: string;
    degree: string;
    field: string;
    startYear: string;
    endYear: string;
  }[]>().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdx: uniqueIndex("candidate_profiles_user_idx").on(table.userId),
}));

// ==================== INTERVIEW QUESTION BANKS ====================

// Question Banks - Role and skill-based interview questions
export const questionBanks = pgTable("question_banks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: 'cascade' }), // null = global questions
  
  // Question content
  question: text("question").notNull(),
  category: varchar("category").notNull(), // technical, behavioral, situational, cultural_fit
  
  // Targeting
  role: varchar("role"), // software_engineer, product_manager, data_scientist, etc.
  skills: jsonb("skills").$type<string[]>().default([]), // Required skills for this question
  difficultyLevel: integer("difficulty_level").default(2), // 1-5 scale
  experienceLevel: varchar("experience_level"), // entry, mid, senior
  
  // Question metadata
  expectedAnswerPoints: jsonb("expected_answer_points").$type<string[]>().default([]),
  scoringCriteria: jsonb("scoring_criteria").$type<{
    criterion: string;
    weight: number;
  }[]>().default([]),
  
  // Usage tracking
  usageCount: integer("usage_count").default(0),
  averageScore: real("average_score"), // Average candidate performance
  
  // Status
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  companyIdx: index("question_banks_company_idx").on(table.companyId),
  categoryIdx: index("question_banks_category_idx").on(table.category),
  roleIdx: index("question_banks_role_idx").on(table.role),
}));

// ==================== AI VIDEO/AUDIO INTERVIEW SYSTEM ====================

// Interview Sessions - AI video/audio interviews
export const interviewSessions = pgTable("interview_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid("user_id").references(() => users.id), // Candidate (nullable for resume-only workflow)
  jobId: uuid("job_id").references(() => jobs.id).notNull(),
  
  // Interview type & mode
  interviewType: varchar("interview_type").default("ai_async"), // ai_async (pre-recorded), ai_live (live with AI assist)
  examType: varchar("exam_type"), // Legacy field, can be repurposed for job role
  subject: varchar("subject"), // Legacy field, can be repurposed for department
  
  // Session status
  status: varchar("status").default("scheduled"), // scheduled, in_progress, completed, expired, cancelled
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"), // in seconds
  
  // Interview configuration
  totalQuestions: integer("total_questions").default(10),
  questionsAnswered: integer("questions_answered").default(0),
  
  // Video/Audio URLs (stored in object storage)
  videoUrls: jsonb("video_urls").$type<string[]>().default([]),
  
  // Video file path (stored on server filesystem)
  videoPath: varchar("video_path"),
  
  // AI Evaluation Results
  overallScore: real("overall_score"), // 0-100
  skillScores: jsonb("skill_scores").$type<{
    skill: string;
    score: number;
  }[]>().default([]),
  
  // Metadata
  metadata: jsonb("metadata").$type<{
    interviewType?: string;
    difficulty?: string;
    topics?: string[];
  }>().default({}),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdx: index("interview_sessions_user_idx").on(table.userId),
  statusIdx: index("interview_sessions_status_idx").on(table.status),
  applicationIdx: index("interview_sessions_application_idx").on(table.applicationId),
  scheduledAtIdx: index("interview_sessions_scheduled_at_idx").on(table.scheduledAt),
  // Unique constraint: One interview session per application (prevents duplicates)
  applicationUnique: uniqueIndex("interview_sessions_application_unique").on(table.applicationId),
}));

// AI Video Interview Messages - Track Q&A during video interviews
export const interviewMessages = pgTable("interview_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid("session_id").references(() => interviewSessions.id, { onDelete: 'cascade' }).notNull(),
  role: varchar("role").notNull(), // interviewer (AI), candidate (student)
  messageType: varchar("message_type").default("text"), // text, audio, video
  content: text("content").notNull(), // Text content (transcribed for audio/video)
  audioUrl: text("audio_url"), // TTS generated audio for AI questions
  videoTimestamp: integer("video_timestamp"), // Timestamp in video recording (seconds)
  duration: integer("duration"), // Message duration in seconds
  metadata: jsonb("metadata").$type<{
    questionType?: string;
    topic?: string;
    difficulty?: string;
    confidence?: number;
    transcriptionConfidence?: number;
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  sessionIdx: index("interview_messages_session_idx").on(table.sessionId),
  roleIdx: index("interview_messages_role_idx").on(table.role),
}));

// Interview Evaluations - Detailed assessments
export const interviewEvaluations = pgTable("interview_evaluations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid("session_id").references(() => interviewSessions.id, { onDelete: 'cascade' }).notNull(),
  
  // Overall evaluation
  overallScore: real("overall_score").notNull(), // 0-100
  recommendation: varchar("recommendation").notNull(), // strong_hire, hire, maybe, no_hire
  
  // Dimensional scores
  technicalScore: real("technical_score"), // Technical competency
  communicationScore: real("communication_score"), // Clarity and articulation
  problemSolvingScore: real("problem_solving_score"), // Analytical thinking
  culturalFitScore: real("cultural_fit_score"), // Alignment with company values
  confidenceScore: real("confidence_score"), // Candidate confidence level
  
  // Detailed feedback
  strengths: jsonb("strengths").$type<string[]>().default([]),
  weaknesses: jsonb("weaknesses").$type<string[]>().default([]),
  keyInsights: text("key_insights"),
  
  // Question-by-question breakdown
  questionScores: jsonb("question_scores").$type<{
    questionId: string;
    question: string;
    answer: string;
    score: number;
    feedback: string;
  }[]>().default([]),
  
  // AI analysis
  sentimentAnalysis: jsonb("sentiment_analysis").$type<{
    positive: number;
    neutral: number;
    negative: number;
  }>(),
  
  transcriptSummary: text("transcript_summary"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  sessionIdx: uniqueIndex("interview_evaluations_session_idx").on(table.sessionId),
  recommendationIdx: index("interview_evaluations_recommendation_idx").on(table.recommendation),
}));

// ==================== NOTIFICATIONS ====================

// Notifications table for all platform notifications
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Notification content
  type: varchar("type").notNull(), // application_received, interview_scheduled, interview_completed, offer_extended, etc.
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  
  // Related entities
  jobId: uuid("job_id").references(() => jobs.id, { onDelete: 'cascade' }),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: 'cascade' }),
  
  // Status
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  
  // Metadata
  metadata: jsonb("metadata").$type<{
    actionUrl?: string;
    actionLabel?: string;
  }>().default({}),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdx: index("notifications_user_idx").on(table.userId),
  isReadIdx: index("notifications_is_read_idx").on(table.isRead),
  typeIdx: index("notifications_type_idx").on(table.type),
}));

// ==================== PAYMENTS & SUBSCRIPTIONS ====================

// Transactions table for payment tracking
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(), // User who initiated payment
  
  // Payment gateway data
  razorpayOrderId: varchar("razorpay_order_id").unique(),
  razorpayPaymentId: varchar("razorpay_payment_id").unique(),
  razorpaySignature: varchar("razorpay_signature"),
  
  // Transaction details
  amount: integer("amount").notNull(), // in smallest currency unit (paise for INR)
  currency: varchar("currency").default("INR"),
  status: varchar("status").default("created"), // created, paid, failed, refunded
  
  // Purpose
  purpose: varchar("purpose"), // subscription, interview_pack, etc.
  planType: varchar("plan_type"), // starter, professional, enterprise
  interviewCount: integer("interview_count"), // Number of interviews purchased
  
  // Metadata
  metadata: jsonb("metadata").$type<{
    invoiceUrl?: string;
    receiptUrl?: string;
  }>().default({}),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  paidAt: timestamp("paid_at"),
}, (table) => ({
  companyIdx: index("transactions_company_idx").on(table.companyId),
  statusIdx: index("transactions_status_idx").on(table.status),
  razorpayOrderIdx: uniqueIndex("transactions_razorpay_order_idx").on(table.razorpayOrderId),
}));

// ==================== AGENTIC AI WORKFLOW ORCHESTRATION ====================

// Workflow Runs - Track LangGraph state machine execution for each application
export const workflowRuns = pgTable("workflow_runs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: 'cascade' }).notNull().unique(),
  jobId: uuid("job_id").references(() => jobs.id, { onDelete: 'cascade' }).notNull(), // Job-centric workflow
  
  // Current state
  currentState: varchar("current_state").notNull().default("submitted"), 
  // States: submitted, screening, screen_passed, screen_failed, interview_scheduled, 
  // interviewing, evaluated, ranked, selected, rejected, offer_sent, offer_accepted
  previousState: varchar("previous_state"),
  
  // LangGraph checkpoint data for state persistence
  checkpointData: jsonb("checkpoint_data").$type<{
    nodeId?: string;
    channelValues?: Record<string, any>;
    metadata?: Record<string, any>;
  }>().default({}),
  
  // Execution metadata
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  lastError: text("last_error"),
  lastErrorAt: timestamp("last_error_at"),
  
  // Manual controls
  isPaused: boolean("is_paused").default(false),
  pausedBy: uuid("paused_by").references(() => users.id), // Recruiter who paused
  pausedAt: timestamp("paused_at"),
  pauseReason: text("pause_reason"),
  
  // Status tracking
  status: varchar("status").default("active"), // active, paused, completed, failed
  completedAt: timestamp("completed_at"),
  
  // Audit
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  applicationIdx: index("workflow_runs_application_idx").on(table.applicationId),
  jobIdx: index("workflow_runs_job_idx").on(table.jobId),
  currentStateIdx: index("workflow_runs_current_state_idx").on(table.currentState),
  statusIdx: index("workflow_runs_status_idx").on(table.status),
}));

// Workflow Events - Audit trail of all state transitions and AI decisions
export const workflowEvents = pgTable("workflow_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowRunId: uuid("workflow_run_id").references(() => workflowRuns.id, { onDelete: 'cascade' }).notNull(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: 'cascade' }).notNull(),
  jobId: uuid("job_id").references(() => jobs.id, { onDelete: 'cascade' }).notNull(), // Job-centric tracking
  
  // Event details
  eventType: varchar("event_type").notNull(), 
  // Types: application_submitted, screening_started, screening_completed, 
  // interview_scheduled, interview_started, interview_completed, 
  // evaluation_completed, ranking_updated, decision_made, email_sent
  
  fromState: varchar("from_state"),
  toState: varchar("to_state"),
  
  // Event payload and results
  eventData: jsonb("event_data").$type<{
    triggeredBy?: "system" | "ai_agent" | "recruiter" | "candidate";
    agentType?: "resume_screener" | "interview_evaluator" | "ranker" | "notification_sender";
    aiModel?: string;
    scores?: Record<string, number>;
    decision?: string;
    metadata?: Record<string, any>;
  }>().default({}),
  
  // Processing status
  status: varchar("status").default("pending"), // pending, processing, completed, failed
  processedAt: timestamp("processed_at"),
  error: text("error"),
  
  // Idempotency - prevent duplicate processing
  idempotencyKey: varchar("idempotency_key").unique(),
  
  // Sequence tracking for ordering
  sequenceNumber: integer("sequence_number").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  workflowRunIdx: index("workflow_events_workflow_run_idx").on(table.workflowRunId),
  applicationIdx: index("workflow_events_application_idx").on(table.applicationId),
  jobIdx: index("workflow_events_job_idx").on(table.jobId),
  eventTypeIdx: index("workflow_events_event_type_idx").on(table.eventType),
  statusIdx: index("workflow_events_status_idx").on(table.status),
  idempotencyIdx: uniqueIndex("workflow_events_idempotency_idx").on(table.idempotencyKey),
  // Unique constraint on (workflowRunId, sequenceNumber) for strict event ordering
  uniqueSequenceIdx: uniqueIndex("workflow_events_unique_sequence_idx").on(table.workflowRunId, table.sequenceNumber),
}));

// Agent Tasks - Background job queue for AI agent work
export const agentTasks = pgTable("agent_tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowRunId: uuid("workflow_run_id").references(() => workflowRuns.id, { onDelete: 'cascade' }).notNull(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: 'cascade' }).notNull(),
  jobId: uuid("job_id").references(() => jobs.id, { onDelete: 'cascade' }).notNull(), // Job-centric task
  
  // Task details
  taskType: varchar("task_type").notNull(), 
  // Types: screen_resume, evaluate_interview, rank_candidates, send_email, 
  // schedule_interview, generate_questions
  
  agentType: varchar("agent_type").notNull(),
  // Agents: resume_screener, interview_evaluator, ranker, notification_sender, scheduler
  
  // Task input data
  taskData: jsonb("task_data").$type<{
    resumeUrl?: string;
    interviewSessionId?: string;
    jobId?: string;
    candidateId?: string;
    emailType?: string;
    workflowState?: string; // Workflow state for notifications
    metadata?: Record<string, any>;
  }>().default({}),
  
  // Task output/results
  result: jsonb("result").$type<{
    success?: boolean;
    data?: Record<string, any>;
    error?: string;
    aiResponse?: any;
  }>().default({}),
  
  // Priority and scheduling
  priority: integer("priority").default(5), // 1-10, higher = more urgent
  scheduledFor: timestamp("scheduled_for").defaultNow(),
  
  // Execution tracking
  status: varchar("status").default("queued"), // queued, running, completed, failed, cancelled
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  
  // Retry logic
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  lastError: text("last_error"),
  nextRetryAt: timestamp("next_retry_at"),
  
  // Worker tracking
  workerId: varchar("worker_id"), // ID of the worker process handling this task
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  workflowRunIdx: index("agent_tasks_workflow_run_idx").on(table.workflowRunId),
  applicationIdx: index("agent_tasks_application_idx").on(table.applicationId),
  taskTypeIdx: index("agent_tasks_task_type_idx").on(table.taskType),
  statusIdx: index("agent_tasks_status_idx").on(table.status),
  priorityIdx: index("agent_tasks_priority_idx").on(table.priority),
  scheduledForIdx: index("agent_tasks_scheduled_for_idx").on(table.scheduledFor),
  // Optimized index for priority queue: queued tasks ordered by priority DESC, scheduledFor ASC
  // This matches the typical dequeue query: WHERE status='queued' ORDER BY priority DESC, scheduledFor ASC
  queueIdx: index("agent_tasks_queue_idx").on(table.status, desc(table.priority), asc(table.scheduledFor)),
}));

// ==================== ZORT SCHEMAS FOR VALIDATION ====================

// Users
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = typeof users.$inferSelect;

// Update User Profile Schema (for profile page)
export const updateUserProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100).optional(),
  lastName: z.string().min(1, "Last name is required").max(100).optional(),
  email: z.string().email("Invalid email address").optional(),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits").max(15).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters").optional(),
});
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

// Companies
export const insertCompanySchema = createInsertSchema(companies);
export const selectCompanySchema = createSelectSchema(companies);
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type SelectCompany = typeof companies.$inferSelect;

// Jobs
export const insertJobSchema = createInsertSchema(jobs);
export const selectJobSchema = createSelectSchema(jobs);
export type InsertJob = z.infer<typeof insertJobSchema>;
export type SelectJob = typeof jobs.$inferSelect;

// Job Platform Postings
export const insertJobPlatformPostingSchema = createInsertSchema(jobPlatformPostings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectJobPlatformPostingSchema = createSelectSchema(jobPlatformPostings);
export type InsertJobPlatformPosting = z.infer<typeof insertJobPlatformPostingSchema>;
export type SelectJobPlatformPosting = typeof jobPlatformPostings.$inferSelect;

// Applications
export const insertApplicationSchema = createInsertSchema(applications);
export const selectApplicationSchema = createSelectSchema(applications);
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type SelectApplication = typeof applications.$inferSelect;

// Candidate Profiles
export const insertCandidateProfileSchema = createInsertSchema(candidateProfiles);
export const selectCandidateProfileSchema = createSelectSchema(candidateProfiles);
export type InsertCandidateProfile = z.infer<typeof insertCandidateProfileSchema>;
export type SelectCandidateProfile = typeof candidateProfiles.$inferSelect;

// Question Banks
export const insertQuestionBankSchema = createInsertSchema(questionBanks);
export const selectQuestionBankSchema = createSelectSchema(questionBanks);
export type InsertQuestionBank = z.infer<typeof insertQuestionBankSchema>;
export type SelectQuestionBank = typeof questionBanks.$inferSelect;

// Interview Sessions
export const insertInterviewSessionSchema = createInsertSchema(interviewSessions);
export const selectInterviewSessionSchema = createSelectSchema(interviewSessions);
export type InsertInterviewSession = z.infer<typeof insertInterviewSessionSchema>;
export type SelectInterviewSession = typeof interviewSessions.$inferSelect;

// Interview Messages
export const insertInterviewMessageSchema = createInsertSchema(interviewMessages);
export const selectInterviewMessageSchema = createSelectSchema(interviewMessages);
export type InsertInterviewMessage = z.infer<typeof insertInterviewMessageSchema>;
export type SelectInterviewMessage = typeof interviewMessages.$inferSelect;

// Interview Evaluations
export const insertInterviewEvaluationSchema = createInsertSchema(interviewEvaluations);
export const selectInterviewEvaluationSchema = createSelectSchema(interviewEvaluations);
export type InsertInterviewEvaluation = z.infer<typeof insertInterviewEvaluationSchema>;
export type SelectInterviewEvaluation = typeof interviewEvaluations.$inferSelect;

// Notifications
export const insertNotificationSchema = createInsertSchema(notifications);
export const selectNotificationSchema = createSelectSchema(notifications);
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type SelectNotification = typeof notifications.$inferSelect;

// Transactions
export const insertTransactionSchema = createInsertSchema(transactions);
export const selectTransactionSchema = createSelectSchema(transactions);
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type SelectTransaction = typeof transactions.$inferSelect;

// Screening Results
export const insertScreeningResultSchema = createInsertSchema(screeningResults);
export const selectScreeningResultSchema = createSelectSchema(screeningResults);
export type InsertScreeningResult = z.infer<typeof insertScreeningResultSchema>;
export type SelectScreeningResult = typeof screeningResults.$inferSelect;

// Selection Decisions
export const insertSelectionDecisionSchema = createInsertSchema(selectionDecisions);
export const selectSelectionDecisionSchema = createSelectSchema(selectionDecisions);
export type InsertSelectionDecision = z.infer<typeof insertSelectionDecisionSchema>;
export type SelectSelectionDecision = typeof selectionDecisions.$inferSelect;

// Workflow Runs
export const insertWorkflowRunSchema = createInsertSchema(workflowRuns);
export const selectWorkflowRunSchema = createSelectSchema(workflowRuns);
export type InsertWorkflowRun = z.infer<typeof insertWorkflowRunSchema>;
export type SelectWorkflowRun = typeof workflowRuns.$inferSelect;

// Workflow Events
export const insertWorkflowEventSchema = createInsertSchema(workflowEvents);
export const selectWorkflowEventSchema = createSelectSchema(workflowEvents);
export type InsertWorkflowEvent = z.infer<typeof insertWorkflowEventSchema>;
export type SelectWorkflowEvent = typeof workflowEvents.$inferSelect;

// Agent Tasks
export const insertAgentTaskSchema = createInsertSchema(agentTasks);
export const selectAgentTaskSchema = createSelectSchema(agentTasks);
export type InsertAgentTask = z.infer<typeof insertAgentTaskSchema>;
export type SelectAgentTask = typeof agentTasks.$inferSelect;

// ==================== CANDIDATE RESUME MANAGEMENT ====================

// Candidate Resumes - Resumes managed by candidates for their profile
export const candidateResumes = pgTable("candidate_resumes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Resume slot (1-5) and customizable type name
  slotNumber: integer("slot_number").notNull(), // 1-5
  typeName: varchar("type_name").notNull(), // Customizable name (e.g., "CTO", "VP Engg", "Director Technology")
  
  // File storage
  fileData: text("file_data"), // Base64 encoded file content (null if only type name set)
  fileName: varchar("file_name"), // Original file name
  fileType: varchar("file_type"), // pdf or docx
  fileSize: integer("file_size"),
  
  uploadedAt: timestamp("uploaded_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdx: index("candidate_resumes_user_idx").on(table.userId),
  userSlotUniqueIdx: unique("candidate_resumes_user_slot_unique").on(table.userId, table.slotNumber),
}));

export const insertCandidateResumeSchema = createInsertSchema(candidateResumes).omit({ id: true, uploadedAt: true, updatedAt: true });
export const selectCandidateResumeSchema = createSelectSchema(candidateResumes);
export type InsertCandidateResume = z.infer<typeof insertCandidateResumeSchema>;
export type SelectCandidateResume = typeof candidateResumes.$inferSelect;

// ==================== SCORING CONFIGURATION ====================

// Scoring configuration table - AI scoring parameters per company
export const scoringConfigs = pgTable("scoring_configs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull().unique(),
  
  // Scoring weightages
  skillsMatch: real("skills_match").default(35), // 30-35%
  experienceLevel: real("experience_level").default(28), // 25-30%
  education: real("education").default(12), // 10-15%
  workHistoryRelevance: real("work_history_relevance").default(22), // 20-25%
  keywords: real("keywords").default(7), // 5-10%
  culturalFit: real("cultural_fit").default(8), // 5-10%
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  companyIdIdx: index("scoring_configs_company_idx").on(table.companyId),
}));

export const insertScoringConfigSchema = createInsertSchema(scoringConfigs).omit({ id: true, createdAt: true, updatedAt: true });
export const selectScoringConfigSchema = createSelectSchema(scoringConfigs);
export type InsertScoringConfig = z.infer<typeof insertScoringConfigSchema>;
export type SelectScoringConfig = typeof scoringConfigs.$inferSelect;

// ==================== MOBILE & PWA SUPPORT ====================

// Mobile devices - Push notification subscriptions and device tokens
export const mobileDevices = pgTable("mobile_devices", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Device identification
  deviceType: varchar("device_type").notNull(), // 'ios', 'android', 'web'
  deviceName: varchar("device_name"), // User-friendly device name
  deviceFingerprint: varchar("device_fingerprint"), // Unique device identifier
  
  // Push notification tokens
  pushToken: text("push_token"), // FCM/APNs token for mobile, or endpoint for web push
  pushSubscription: jsonb("push_subscription").$type<{
    endpoint?: string;
    expirationTime?: number | null;
    keys?: {
      p256dh?: string;
      auth?: string;
    };
  }>(), // Full web push subscription object
  
  // Mobile auth token (JWT refresh token)
  refreshToken: text("refresh_token"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  
  // Device status
  isActive: boolean("is_active").default(true),
  lastActiveAt: timestamp("last_active_at"),
  
  // Notification preferences
  notificationsEnabled: boolean("notifications_enabled").default(true),
  notificationPreferences: jsonb("notification_preferences").$type<{
    newApplications?: boolean;
    interviewReminders?: boolean;
    evaluationComplete?: boolean;
    systemAlerts?: boolean;
  }>().default({}),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdx: index("mobile_devices_user_idx").on(table.userId),
  deviceTypeIdx: index("mobile_devices_type_idx").on(table.deviceType),
  pushTokenIdx: index("mobile_devices_push_token_idx").on(table.pushToken),
}));

export const insertMobileDeviceSchema = createInsertSchema(mobileDevices).omit({ id: true, createdAt: true, updatedAt: true });
export const selectMobileDeviceSchema = createSelectSchema(mobileDevices);
export type InsertMobileDevice = z.infer<typeof insertMobileDeviceSchema>;
export type SelectMobileDevice = typeof mobileDevices.$inferSelect;

// Mobile API tokens - JWT-based auth for mobile apps
export const mobileApiTokens = pgTable("mobile_api_tokens", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  deviceId: uuid("device_id").references(() => mobileDevices.id, { onDelete: 'cascade' }),
  
  // Token data
  tokenHash: varchar("token_hash").notNull(), // Hashed JWT ID for revocation
  tokenType: varchar("token_type").notNull().default("access"), // 'access' or 'refresh'
  
  // Token metadata
  issuedAt: timestamp("issued_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  
  // Security tracking
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdx: index("mobile_api_tokens_user_idx").on(table.userId),
  tokenHashIdx: index("mobile_api_tokens_hash_idx").on(table.tokenHash),
  expiresAtIdx: index("mobile_api_tokens_expires_idx").on(table.expiresAt),
}));

export const insertMobileApiTokenSchema = createInsertSchema(mobileApiTokens).omit({ id: true, createdAt: true });
export const selectMobileApiTokenSchema = createSelectSchema(mobileApiTokens);
export type InsertMobileApiToken = z.infer<typeof insertMobileApiTokenSchema>;
export type SelectMobileApiToken = typeof mobileApiTokens.$inferSelect;
