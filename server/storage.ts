import {
  users,
  companies,
  jobs,
  applications,
  candidateProfiles,
  candidateResumes,
  questionBanks,
  interviewSessions,
  interviewMessages,
  interviewEvaluations,
  notifications,
  transactions,
  otpVerifications,
  selectionDecisions,
  screeningResults,
  jobPlatformPostings,
  type SelectUser,
  type InsertUser,
  type SelectCompany,
  type InsertCompany,
  type SelectJob,
  type InsertJob,
  type SelectApplication,
  type InsertApplication,
  type SelectCandidateProfile,
  type InsertCandidateProfile,
  type SelectCandidateResume,
  type InsertCandidateResume,
  type SelectQuestionBank,
  type InsertQuestionBank,
  type SelectInterviewSession,
  type InsertInterviewSession,
  type SelectInterviewMessage,
  type InsertInterviewMessage,
  type SelectInterviewEvaluation,
  type InsertInterviewEvaluation,
  type SelectNotification,
  type InsertNotification,
  type SelectTransaction,
  type InsertTransaction,
  type SelectSelectionDecision,
  type InsertSelectionDecision,
  type SelectJobPlatformPosting,
  type InsertJobPlatformPosting,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { generateJobPostingId } from "./utils/jobPostingId";

// ==================== STORAGE INTERFACE ====================

// Pagination interface
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// Helper to normalize pagination params with defaults and hard cap
function normalizePagination(params?: PaginationParams, allowUnlimited = false): Required<PaginationParams> {
  let limit = params?.limit || 20; // Default 20
  if (!allowUnlimited) {
    limit = Math.min(limit, 100); // Cap at 100 for external API calls
  }
  const offset = Math.max(params?.offset || 0, 0);  // Default 0, no negatives
  return { limit, offset };
}

export interface IStorage {
  // User management
  getUser(id: string): Promise<SelectUser | undefined>;
  getUserById(id: string): Promise<SelectUser | undefined>;
  getUserByEmail(email: string): Promise<SelectUser | undefined>;
  getUserByMobile(mobile: string): Promise<SelectUser | undefined>;
  createUser(user: Partial<InsertUser>): Promise<SelectUser>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<SelectUser | undefined>;
  updateLastLogin(id: string): Promise<void>;
  upsertUser(user: Partial<InsertUser>): Promise<SelectUser>;
  
  // OTP management
  createOTP(mobileNumber: string, purpose: string): Promise<string>;
  verifyOTP(mobileNumber: string, otp: string, purpose: string): Promise<boolean>;
  markOTPAsUsed(mobileNumber: string, otp: string): Promise<void>;
  
  // Company management
  getCompany(id: string): Promise<SelectCompany | undefined>;
  getCompanyByCode(code: string): Promise<SelectCompany | undefined>;
  createCompany(company: Partial<InsertCompany>): Promise<SelectCompany>;
  updateCompany(id: string, updates: Partial<InsertCompany>): Promise<SelectCompany | undefined>;
  
  // Job management
  getJob(id: string): Promise<SelectJob | undefined>;
  getJobs(companyId: string, params?: PaginationParams): Promise<PaginatedResponse<SelectJob>>;
  getAllJobs(params?: PaginationParams): Promise<PaginatedResponse<SelectJob>>;
  getActiveJobs(companyId?: string, params?: PaginationParams): Promise<PaginatedResponse<SelectJob>>;
  createJob(job: Partial<InsertJob>): Promise<SelectJob>;
  updateJob(id: string, updates: Partial<InsertJob>): Promise<SelectJob | undefined>;
  deleteJob(id: string): Promise<void>;
  
  // Application management
  getApplication(id: string): Promise<SelectApplication | undefined>;
  getJobApplications(jobId: string): Promise<SelectApplication[]>;
  getCandidateApplications(candidateId: string): Promise<SelectApplication[]>;
  getCompanyApplications(companyId: string, params?: PaginationParams): Promise<PaginatedResponse<SelectApplication>>;
  getAllApplications(params?: PaginationParams): Promise<PaginatedResponse<SelectApplication>>;
  createApplication(application: Partial<InsertApplication>): Promise<SelectApplication>;
  updateApplication(id: string, updates: Partial<InsertApplication>): Promise<SelectApplication | undefined>;
  deleteApplication(id: string): Promise<void>;
  getApplicationsSummary(candidateId: string): Promise<any>;
  getInterviewsSummary(candidateId: string): Promise<any>;
  
  // Stats
  getAllUsers(params?: PaginationParams): Promise<PaginatedResponse<SelectUser>>;
  getCompanyStats(companyId: string): Promise<any>;
  getPlatformStats(): Promise<any>;
  
  // Interview management
  getInterviewSession(id: string): Promise<SelectInterviewSession | undefined>;
  createInterviewSession(session: Partial<InsertInterviewSession>): Promise<SelectInterviewSession>;
  updateInterviewSession(id: string, updates: Partial<InsertInterviewSession>): Promise<SelectInterviewSession | undefined>;
  
  // Candidate Resume Management
  getCandidateResumes(userId: string, params?: PaginationParams): Promise<PaginatedResponse<SelectCandidateResume>>;
  getCandidateResume(id: string): Promise<SelectCandidateResume | undefined>;
  createCandidateResume(resume: Partial<InsertCandidateResume>): Promise<SelectCandidateResume>;
  updateCandidateResume(id: string, updates: Partial<InsertCandidateResume>): Promise<SelectCandidateResume | undefined>;
  deleteCandidateResume(id: string): Promise<void>;
  
  // Notifications
  createNotification(notification: Partial<InsertNotification>): Promise<SelectNotification>;
  getUserNotifications(userId: string): Promise<SelectNotification[]>;
  markNotificationAsRead(id: string): Promise<void>;

  // Selection Decisions
  createSelectionDecision(decision: Partial<InsertSelectionDecision>): Promise<SelectSelectionDecision>;
  getSelectionDecisionByApplication(applicationId: string): Promise<SelectSelectionDecision | undefined>;
  
  // Transactions
  createTransaction(transaction: Partial<InsertTransaction>): Promise<SelectTransaction>;
  
  // Job Platform Postings
  getJobPlatformPostings(jobId: string): Promise<SelectJobPlatformPosting[]>;
  getJobPlatformPostingsSummary(jobId: string): Promise<{ count: number; latestPostedAt: Date | null }>;
  createJobPlatformPosting(posting: Partial<InsertJobPlatformPosting>): Promise<SelectJobPlatformPosting>;
  getJobPlatformPostingByPlatform(jobId: string, platformSlug: string): Promise<SelectJobPlatformPosting | undefined>;
}

// ==================== DATABASE STORAGE IMPLEMENTATION ====================

export class DbStorage implements IStorage {
  // ==================== USERS ====================
  
  async getUser(id: string): Promise<SelectUser | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
  
  async getUserByEmail(email: string): Promise<SelectUser | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }
  
  async createUser(user: Partial<InsertUser>): Promise<SelectUser> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }
  
  async updateUser(id: string, updates: Partial<InsertUser>): Promise<SelectUser | undefined> {
    const result = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
  
  async upsertUser(user: Partial<InsertUser>): Promise<SelectUser> {
    const result = await db
      .insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...user,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  }
  
  async getUserById(id: string): Promise<SelectUser | undefined> {
    return this.getUser(id);
  }
  
  async getUserByMobile(mobile: string): Promise<SelectUser | undefined> {
    const result = await db.select().from(users).where(eq(users.mobileNumber, mobile)).limit(1);
    return result[0];
  }
  
  async updateLastLogin(id: string): Promise<void> {
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id));
  }
  
  // ==================== OTP MANAGEMENT ====================
  
  async createOTP(mobileNumber: string, purpose: string): Promise<string> {
    const crypto = await import('crypto');
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    await db
      .update(otpVerifications)
      .set({ isUsed: true })
      .where(
        and(
          eq(otpVerifications.mobileNumber, mobileNumber),
          eq(otpVerifications.purpose, purpose),
          eq(otpVerifications.isUsed, false)
        )
      );
    
    await db.insert(otpVerifications).values({
      mobileNumber,
      otp,
      purpose,
      expiresAt,
    });
    
    return otp;
  }
  
  async verifyOTP(mobileNumber: string, otp: string, purpose: string): Promise<boolean> {
    const result = await db
      .select()
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.mobileNumber, mobileNumber),
          eq(otpVerifications.purpose, purpose),
          eq(otpVerifications.isUsed, false),
          sql`${otpVerifications.expiresAt} > NOW()`
        )
      )
      .orderBy(desc(otpVerifications.createdAt))
      .limit(1);
    
    if (!result[0]) {
      return false;
    }
    
    const maxAttempts = 3;
    if (result[0].attempts! >= maxAttempts) {
      return false;
    }
    
    await db
      .update(otpVerifications)
      .set({ attempts: (result[0].attempts || 0) + 1 })
      .where(eq(otpVerifications.id, result[0].id));
    
    const isValid = result[0].otp === otp;
    
    if (isValid) {
      await db
        .update(otpVerifications)
        .set({ isUsed: true })
        .where(eq(otpVerifications.id, result[0].id));
    }
    
    return isValid;
  }
  
  async markOTPAsUsed(mobileNumber: string, otp: string): Promise<void> {
    await db
      .update(otpVerifications)
      .set({ isUsed: true })
      .where(
        and(
          eq(otpVerifications.mobileNumber, mobileNumber),
          eq(otpVerifications.otp, otp)
        )
      );
  }
  
  // ==================== COMPANIES ====================
  
  async getCompany(id: string): Promise<SelectCompany | undefined> {
    const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    return result[0];
  }
  
  async getCompanyByCode(code: string): Promise<SelectCompany | undefined> {
    const result = await db.select().from(companies).where(eq(companies.companyCode, code)).limit(1);
    return result[0];
  }
  
  async createCompany(company: Partial<InsertCompany>): Promise<SelectCompany> {
    const result = await db.insert(companies).values(company).returning();
    return result[0];
  }
  
  async updateCompany(id: string, updates: Partial<InsertCompany>): Promise<SelectCompany | undefined> {
    const result = await db.update(companies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return result[0];
  }
  
  // ==================== JOBS ====================
  
  async getJob(id: string): Promise<SelectJob | undefined> {
    const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    return result[0];
  }
  
  async getJobs(companyId: string, params?: PaginationParams): Promise<PaginatedResponse<SelectJob>> {
    const { limit, offset } = normalizePagination(params);
    
    // Get total count
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(eq(jobs.companyId, companyId));
    
    // Get paginated data
    const data = await db.select()
      .from(jobs)
      .where(eq(jobs.companyId, companyId))
      .orderBy(desc(jobs.createdAt))
      .limit(limit)
      .offset(offset);
    
    return {
      data,
      total: Number(countResult.count),
      limit,
      offset
    };
  }
  
  async getAllJobs(params?: PaginationParams): Promise<PaginatedResponse<SelectJob>> {
    const { limit, offset } = normalizePagination(params);
    
    // Get total count
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(jobs);
    
    // Get paginated data
    const data = await db.select()
      .from(jobs)
      .orderBy(desc(jobs.createdAt))
      .limit(limit)
      .offset(offset);
    
    return {
      data,
      total: Number(countResult.count),
      limit,
      offset
    };
  }
  
  async getActiveJobs(companyId?: string, params?: PaginationParams): Promise<PaginatedResponse<SelectJob>> {
    const { limit, offset } = normalizePagination(params);
    
    if (companyId) {
      // Get total count for company
      const [countResult] = await db.select({ count: sql<number>`count(*)` })
        .from(jobs)
        .where(and(
          eq(jobs.companyId, companyId),
          eq(jobs.status, 'posted')
        ));
      
      // Get paginated data
      const data = await db.select()
        .from(jobs)
        .where(and(
          eq(jobs.companyId, companyId),
          eq(jobs.status, 'posted')
        ))
        .orderBy(desc(jobs.publishedAt))
        .limit(limit)
        .offset(offset);
      
      return {
        data,
        total: Number(countResult.count),
        limit,
        offset
      };
    }
    
    // Get total count for all posted jobs
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(eq(jobs.status, 'posted'));
    
    // Get paginated data
    const data = await db.select()
      .from(jobs)
      .where(eq(jobs.status, 'posted'))
      .orderBy(desc(jobs.publishedAt))
      .limit(limit)
      .offset(offset);
    
    return {
      data,
      total: Number(countResult.count),
      limit,
      offset
    };
  }
  
  async createJob(job: Partial<InsertJob>): Promise<SelectJob> {
    // Get company to fetch company code
    if (!job.companyId) {
      throw new Error("companyId is required to create a job");
    }
    
    const company = await this.getCompany(job.companyId);
    if (!company) {
      throw new Error("Company not found");
    }
    
    if (!company.companyCode) {
      throw new Error("Company code is required to generate job posting ID");
    }
    
    // Generate job posting ID
    const jobPostingId = generateJobPostingId(company.companyCode);
    
    const result = await db.insert(jobs).values({
      ...job,
      jobPostingId,
    }).returning();
    return result[0];
  }
  
  async updateJob(id: string, updates: Partial<InsertJob>): Promise<SelectJob | undefined> {
    const result = await db.update(jobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return result[0];
  }
  
  async deleteJob(id: string): Promise<void> {
    // First, get all application IDs for this job to delete related records
    const jobApplications = await db.select({ id: applications.id })
      .from(applications)
      .where(eq(applications.jobId, id));
    
    // Delete child records that don't have CASCADE in their foreign key definitions
    // 1. Delete screening results for this job
    await db.delete(screeningResults).where(eq(screeningResults.jobId, id));
    
    // 2. Delete application-related records one by one
    for (const app of jobApplications) {
      // Delete selection decisions for this application
      await db.delete(selectionDecisions)
        .where(eq(selectionDecisions.applicationId, app.id));
      
      // Get interview sessions for this application to delete evaluations
      const sessions = await db.select({ id: interviewSessions.id })
        .from(interviewSessions)
        .where(eq(interviewSessions.applicationId, app.id));
      
      // Delete interview evaluations for each session (evaluations use sessionId, not applicationId)
      for (const session of sessions) {
        await db.delete(interviewEvaluations)
          .where(eq(interviewEvaluations.sessionId, session.id));
      }
      
      // Delete interview sessions for this application
      await db.delete(interviewSessions)
        .where(eq(interviewSessions.applicationId, app.id));
    }
    
    // Now delete the job - applications will cascade delete automatically
    await db.delete(jobs).where(eq(jobs.id, id));
  }
  
  // ==================== APPLICATIONS ====================
  
  async getApplication(id: string): Promise<SelectApplication | undefined> {
    const result = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
    return result[0];
  }
  
  async getJobApplications(jobId: string): Promise<SelectApplication[]> {
    const results = await db.select({
      application: applications,
      job: jobs,
      candidate: users,
    })
      .from(applications)
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(users, eq(applications.candidateId, users.id))
      .where(eq(applications.jobId, jobId))
      .orderBy(desc(applications.aiMatchScore), desc(applications.createdAt));
    
    return results.map(r => ({
      ...r.application,
      job: r.job as any,
      candidate: r.candidate ? {
        id: r.candidate.id,
        firstName: r.candidate.firstName,
        lastName: r.candidate.lastName,
        email: r.candidate.email,
      } : null,
    } as any));
  }
  
  async getCandidateApplications(candidateId: string): Promise<SelectApplication[]> {
    const results = await db.select({
      // Application fields
      application: applications,
      // Job fields
      job: jobs,
      // Company fields
      company: companies,
      // Recruiter (created by) fields
      recruiter: users,
      // Selection/Offer decision fields - only select specific columns
      offeredSalary: selectionDecisions.offeredSalary,
      offeredCurrency: selectionDecisions.offeredCurrency,
      offeredBenefits: selectionDecisions.offeredBenefits,
      offerLetter: selectionDecisions.offerLetter,
    })
      .from(applications)
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(companies, eq(jobs.companyId, companies.id))
      .leftJoin(users, eq(jobs.createdBy, users.id))
      .leftJoin(selectionDecisions, eq(applications.id, selectionDecisions.applicationId))
      .where(eq(applications.candidateId, candidateId))
      .orderBy(desc(applications.createdAt));
    
    // Flatten the results for easier frontend consumption
    return results.map(r => ({
      ...r.application,
      job: r.job as any,
      company: r.company as any,
      recruiter: r.recruiter ? {
        id: r.recruiter.id,
        firstName: r.recruiter.firstName,
        lastName: r.recruiter.lastName,
        email: r.recruiter.email,
      } : null,
      // Include offer data from selection_decisions if available
      offeredSalary: r.offeredSalary || undefined,
      offeredCurrency: r.offeredCurrency || 'INR',
      offeredBenefits: r.offeredBenefits || undefined,
      offerLetter: r.offerLetter || undefined,
    } as any));
  }
  
  async createApplication(application: Partial<InsertApplication>): Promise<SelectApplication> {
    // Check for existing application with same job ID and email (prevent duplicates)
    if (application.jobId && application.candidateEmail) {
      const existing = await db.select()
        .from(applications)
        .where(
          and(
            eq(applications.jobId, application.jobId),
            eq(applications.candidateEmail, application.candidateEmail)
          )
        )
        .limit(1);
      
      if (existing.length > 0) {
        throw new Error(`DUPLICATE_APPLICATION: An application already exists for email ${application.candidateEmail} on this job`);
      }
    }
    
    // Create application
    const result = await db.insert(applications).values({
      ...application,
    }).returning();
    return result[0];
  }
  
  async updateApplication(id: string, updates: Partial<InsertApplication>): Promise<SelectApplication | undefined> {
    const result = await db.update(applications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();
    return result[0];
  }

  async deleteApplication(id: string): Promise<void> {
    await db.delete(applications).where(eq(applications.id, id));
  }

  async createInterviewSession(session: Partial<typeof interviewSessions.$inferInsert>): Promise<any> {
    // Check for existing interview session for this application (prevent duplicates)
    if (session.applicationId) {
      const existing = await db.select()
        .from(interviewSessions)
        .where(eq(interviewSessions.applicationId, session.applicationId))
        .limit(1);
      
      if (existing.length > 0) {
        // Update existing session instead of creating duplicate
        const updated = await db.update(interviewSessions)
          .set({ 
            ...session, 
            updatedAt: new Date() 
          } as any)
          .where(eq(interviewSessions.id, existing[0].id))
          .returning();
        return updated[0];
      }
    }
    
    const result = await db.insert(interviewSessions).values({
      ...session,
    } as any).returning();
    return result[0];
  }

  async getApplicationsSummary(candidateId: string): Promise<any> {
    const results = await db.select({
      status: applications.status,
      count: sql<number>`count(*)`,
    })
      .from(applications)
      .where(eq(applications.candidateId, candidateId))
      .groupBy(applications.status);

    const summary: any = {
      total: 0,
      submitted: 0,
      screening: 0,
      interview_scheduled: 0,
      interviewing: 0,
      interview: 0,
      interviewed: 0,
      rejected: 0,
      selected: 0,
    };

    results.forEach(r => {
      const count = Number(r.count);
      summary[r.status || 'submitted'] = count;
      summary.total += count;
    });

    return summary;
  }

  async getInterviewsSummary(candidateId: string): Promise<any> {
    const results = await db.select({
      status: interviewSessions.status,
      count: sql<number>`count(*)`,
    })
      .from(interviewSessions)
      .where(eq(interviewSessions.userId, candidateId))
      .groupBy(interviewSessions.status);

    const summary: any = {
      total: 0,
      scheduled: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };

    results.forEach(r => {
      const count = Number(r.count);
      summary[r.status || 'scheduled'] = count;
      summary.total += count;
    });

    return summary;
  }
  
  async getCompanyApplications(companyId: string, params?: PaginationParams): Promise<PaginatedResponse<SelectApplication>> {
    const { limit, offset } = normalizePagination(params);
    
    // Get ALL company job IDs directly (no pagination to avoid cap)
    const companyJobs = await db.select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.companyId, companyId));
    const jobIds = companyJobs.map(j => j.id);
    
    if (jobIds.length === 0) {
      return { data: [], total: 0, limit, offset };
    }
    
    // Get total count (filtered by company jobs)
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(applications)
      .where(inArray(applications.jobId, jobIds));
    
    // Get paginated data WITH job, candidate, and evaluation data
    const rawData = await db.select()
      .from(applications)
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(users, eq(applications.candidateId, users.id))
      .leftJoin(interviewSessions, eq(applications.id, interviewSessions.applicationId))
      .leftJoin(interviewEvaluations, eq(interviewSessions.id, interviewEvaluations.sessionId))
      .where(inArray(applications.jobId, jobIds))
      .orderBy(desc(applications.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Transform to include job, candidate, interview session, and evaluation data in the application object
    const data = rawData.map(row => ({
      ...row.applications,
      job: row.jobs || undefined,
      candidate: row.users ? {
        id: row.users.id,
        firstName: row.users.firstName,
        lastName: row.users.lastName,
        email: row.users.email,
        mobileNumber: row.users.mobileNumber,
      } : null,
      candidateName: row.applications.candidateName || (row.users ? `${row.users.firstName || ''} ${row.users.lastName || ''}`.trim() : 'Unknown'),
      candidateEmail: row.applications.candidateEmail || row.users?.email || '-',
      candidatePhone: row.applications.candidatePhone || row.users?.mobileNumber || '-',
      interviewSession: row.interview_sessions ? {
        id: row.interview_sessions.id,
        status: row.interview_sessions.status,
        scheduledAt: row.interview_sessions.scheduledAt,
        startedAt: row.interview_sessions.startedAt,
        completedAt: row.interview_sessions.completedAt,
      } : null,
      evaluation: row.interview_evaluations ? {
        id: row.interview_evaluations.id,
        overallScore: row.interview_evaluations.overallScore,
        technicalScore: row.interview_evaluations.technicalScore,
        communicationScore: row.interview_evaluations.communicationScore,
        recommendation: row.interview_evaluations.recommendation,
      } : null,
    })) as SelectApplication[];
    
    return {
      data,
      total: Number(countResult.count),
      limit,
      offset
    };
  }
  
  async getAllApplications(params?: PaginationParams): Promise<PaginatedResponse<SelectApplication>> {
    const { limit, offset } = normalizePagination(params);
    
    // Get total count
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(applications);
    
    // Get paginated data WITH job and candidate data
    const rawData = await db.select()
      .from(applications)
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(users, eq(applications.candidateId, users.id))
      .orderBy(desc(applications.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Transform to include job and candidate data in the application object
    const data = rawData.map(row => ({
      ...row.applications,
      job: row.jobs || undefined,
      candidate: row.users ? {
        id: row.users.id,
        firstName: row.users.firstName,
        lastName: row.users.lastName,
        email: row.users.email,
        mobileNumber: row.users.mobileNumber,
      } : null,
      candidateName: row.applications.candidateName || (row.users ? `${row.users.firstName || ''} ${row.users.lastName || ''}`.trim() : 'Unknown'),
      candidateEmail: row.applications.candidateEmail || row.users?.email || '-',
      candidatePhone: row.applications.candidatePhone || row.users?.mobileNumber || '-',
    })) as SelectApplication[];
    
    return {
      data,
      total: Number(countResult.count),
      limit,
      offset
    };
  }
  
  // ==================== STATS ====================
  
  async getAllUsers(params?: PaginationParams): Promise<PaginatedResponse<SelectUser>> {
    const { limit, offset } = normalizePagination(params);
    
    // Get total count
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(users);
    
    // Get paginated data
    const data = await db.select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
    
    return {
      data,
      total: Number(countResult.count),
      limit,
      offset
    };
  }
  
  async getCompanyStats(companyId: string): Promise<any> {
    // Use direct SQL counts for better performance
    const [totalJobsResult] = await db.select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(eq(jobs.companyId, companyId));
    
    const [activeJobsResult] = await db.select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(and(eq(jobs.companyId, companyId), eq(jobs.status, 'posted')));
    
    // Get ALL company job IDs for application stats (direct SQL, no pagination needed)
    const companyJobs = await db.select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.companyId, companyId));
    const jobIds = companyJobs.map(j => j.id);
    
    if (jobIds.length === 0) {
      return {
        totalJobs: 0,
        activeJobs: 0,
        totalApplications: 0,
        pendingApplications: 0,
        interviewsScheduled: 0,
        selectedCandidates: 0,
      };
    }
    
    const [totalAppsResult] = await db.select({ count: sql<number>`count(*)` })
      .from(applications)
      .where(inArray(applications.jobId, jobIds));
    
    const [pendingAppsResult] = await db.select({ count: sql<number>`count(*)` })
      .from(applications)
      .where(and(inArray(applications.jobId, jobIds), eq(applications.status, 'applied')));
    
    const [interviewsResult] = await db.select({ count: sql<number>`count(*)` })
      .from(applications)
      .where(and(inArray(applications.jobId, jobIds), eq(applications.status, 'interview_scheduled')));
    
    const [selectedResult] = await db.select({ count: sql<number>`count(*)` })
      .from(applications)
      .where(and(inArray(applications.jobId, jobIds), eq(applications.status, 'selected')));
    
    return {
      totalJobs: Number(totalJobsResult.count),
      activeJobs: Number(activeJobsResult.count),
      totalApplications: Number(totalAppsResult.count),
      pendingApplications: Number(pendingAppsResult.count),
      interviewsScheduled: Number(interviewsResult.count),
      selectedCandidates: Number(selectedResult.count),
    };
  }
  
  async getPlatformStats(): Promise<any> {
    // Use direct SQL counts for better performance
    const [totalUsersResult] = await db.select({ count: sql<number>`count(*)` })
      .from(users);
    
    const [candidatesResult] = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, 'candidate'));
    
    const [recruitersResult] = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.role} IN ('recruiter', 'company_admin')`);
    
    const [companiesResult] = await db.select({ count: sql<number>`count(*)` })
      .from(companies);
    
    const [totalJobsResult] = await db.select({ count: sql<number>`count(*)` })
      .from(jobs);
    
    const [activeJobsResult] = await db.select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(eq(jobs.status, 'posted'));
    
    const [totalAppsResult] = await db.select({ count: sql<number>`count(*)` })
      .from(applications);
    
    const [interviewsCompletedResult] = await db.select({ count: sql<number>`count(*)` })
      .from(applications)
      .where(eq(applications.status, 'interviewed'));
    
    return {
      totalUsers: Number(totalUsersResult.count),
      candidateCount: Number(candidatesResult.count),
      recruiterCount: Number(recruitersResult.count),
      totalCompanies: Number(companiesResult.count),
      totalJobs: Number(totalJobsResult.count),
      activeJobs: Number(activeJobsResult.count),
      totalApplications: Number(totalAppsResult.count),
      interviewsCompleted: Number(interviewsCompletedResult.count),
    };
  }
  
  // ==================== INTERVIEWS ====================
  
  async getInterviewSession(id: string): Promise<SelectInterviewSession | undefined> {
    const result = await db.select().from(interviewSessions).where(eq(interviewSessions.id, id)).limit(1);
    return result[0];
  }
  
  async createInterviewSession(session: Partial<InsertInterviewSession>): Promise<SelectInterviewSession> {
    // Check for existing interview session for this application (prevent duplicates)
    if (session.applicationId) {
      const existing = await db.select()
        .from(interviewSessions)
        .where(eq(interviewSessions.applicationId, session.applicationId))
        .limit(1);
      
      if (existing.length > 0) {
        // Update existing session instead of creating duplicate
        const updated = await db.update(interviewSessions)
          .set({ 
            ...session, 
            updatedAt: new Date() 
          })
          .where(eq(interviewSessions.id, existing[0].id))
          .returning();
        
        // Sync scheduledAt to applications.interviewScheduledAt
        if (session.scheduledAt) {
          await db.update(applications)
            .set({ interviewScheduledAt: session.scheduledAt })
            .where(eq(applications.id, session.applicationId));
        }
        
        return updated[0];
      }
    }
    
    const result = await db.insert(interviewSessions).values(session).returning();
    
    // Sync scheduledAt to applications.interviewScheduledAt
    if (session.applicationId && session.scheduledAt) {
      await db.update(applications)
        .set({ interviewScheduledAt: session.scheduledAt })
        .where(eq(applications.id, session.applicationId));
    }
    
    return result[0];
  }
  
  async updateInterviewSession(id: string, updates: Partial<InsertInterviewSession>): Promise<SelectInterviewSession | undefined> {
    const result = await db.update(interviewSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(interviewSessions.id, id))
      .returning();
    
    // Sync scheduledAt to applications.interviewScheduledAt if scheduledAt is updated
    if (result[0] && updates.scheduledAt) {
      await db.update(applications)
        .set({ interviewScheduledAt: updates.scheduledAt })
        .where(eq(applications.id, result[0].applicationId));
    }
    
    return result[0];
  }
  
  async getCandidateInterviews(candidateId: string): Promise<any[]> {
    // Get interview sessions with all related data
    const sessionResults = await db.select({
      // Interview session fields
      session: interviewSessions,
      // Application fields (includes jobApplicationId)
      application: applications,
      // Job fields
      job: jobs,
      // Company fields
      company: companies,
      // Recruiter (job creator) fields
      recruiter: users,
    })
      .from(interviewSessions)
      .leftJoin(applications, eq(interviewSessions.applicationId, applications.id))
      .leftJoin(jobs, eq(applications.jobId, jobs.id))  // Fixed: join via applications.jobId
      .leftJoin(companies, eq(jobs.companyId, companies.id))
      .leftJoin(users, eq(jobs.createdBy, users.id))
      .where(eq(interviewSessions.userId, candidateId))
      .orderBy(desc(interviewSessions.scheduledAt || interviewSessions.createdAt));

    // Flatten and return only actual interview sessions (no duplicates)
    const sessions = sessionResults.map(r => ({
      ...r.session,
      application: r.application as any,
      job: r.job as any,
      company: r.company as any,
      recruiter: r.recruiter ? {
        id: r.recruiter.id,
        firstName: r.recruiter.firstName,
        lastName: r.recruiter.lastName,
        email: r.recruiter.email,
      } : null,
    } as any));

    return sessions;
  }
  
  // ==================== NOTIFICATIONS ====================
  
  async createNotification(notification: Partial<InsertNotification>): Promise<SelectNotification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }
  
  async getUserNotifications(userId: string): Promise<SelectNotification[]> {
    return await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }
  
  async markNotificationAsRead(id: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, id));
  }

  // ==================== CANDIDATE RESUME MANAGEMENT ====================

  async getCandidateResumes(userId: string, params?: PaginationParams): Promise<PaginatedResponse<SelectCandidateResume>> {
    const { limit, offset } = normalizePagination(params);
    const [results, totalResult] = await Promise.all([
      db.select()
        .from(candidateResumes)
        .where(eq(candidateResumes.userId, userId))
        .orderBy(desc(candidateResumes.uploadedAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` })
        .from(candidateResumes)
        .where(eq(candidateResumes.userId, userId))
    ]);
    const total = totalResult[0]?.count ?? 0;
    return { data: results, total, limit, offset };
  }

  async getCandidateResume(id: string): Promise<SelectCandidateResume | undefined> {
    const result = await db.select()
      .from(candidateResumes)
      .where(eq(candidateResumes.id, id));
    return result[0];
  }

  async createCandidateResume(resume: Partial<InsertCandidateResume>): Promise<SelectCandidateResume> {
    const result = await db.insert(candidateResumes).values(resume).returning();
    return result[0];
  }

  async updateCandidateResume(id: string, updates: Partial<InsertCandidateResume>): Promise<SelectCandidateResume | undefined> {
    const result = await db.update(candidateResumes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(candidateResumes.id, id))
      .returning();
    return result[0];
  }

  async deleteCandidateResume(id: string): Promise<void> {
    await db.delete(candidateResumes).where(eq(candidateResumes.id, id));
  }
  
  // ==================== SELECTION DECISIONS ====================
  
  async createSelectionDecision(decision: Partial<InsertSelectionDecision>): Promise<SelectSelectionDecision> {
    const result = await db.insert(selectionDecisions).values(decision).returning();
    return result[0];
  }

  async getSelectionDecisionByApplication(applicationId: string): Promise<SelectSelectionDecision | undefined> {
    const result = await db.select()
      .from(selectionDecisions)
      .where(eq(selectionDecisions.applicationId, applicationId))
      .limit(1);
    return result[0];
  }
  
  // ==================== TRANSACTIONS ====================
  
  async createTransaction(transaction: Partial<InsertTransaction>): Promise<SelectTransaction> {
    const result = await db.insert(transactions).values(transaction).returning();
    return result[0];
  }
  
  // ==================== JOB PLATFORM POSTINGS ====================
  
  async getJobPlatformPostings(jobId: string): Promise<SelectJobPlatformPosting[]> {
    return await db.select()
      .from(jobPlatformPostings)
      .where(eq(jobPlatformPostings.jobId, jobId))
      .orderBy(desc(jobPlatformPostings.postedAt));
  }
  
  async getJobPlatformPostingsSummary(jobId: string): Promise<{ count: number; latestPostedAt: Date | null }> {
    const postings = await db.select()
      .from(jobPlatformPostings)
      .where(eq(jobPlatformPostings.jobId, jobId))
      .orderBy(desc(jobPlatformPostings.postedAt));
    
    return {
      count: postings.length,
      latestPostedAt: postings.length > 0 ? postings[0].postedAt : null
    };
  }
  
  async createJobPlatformPosting(posting: Partial<InsertJobPlatformPosting>): Promise<SelectJobPlatformPosting> {
    const result = await db.insert(jobPlatformPostings).values(posting).returning();
    return result[0];
  }
  
  async getJobPlatformPostingByPlatform(jobId: string, platformSlug: string): Promise<SelectJobPlatformPosting | undefined> {
    const result = await db.select()
      .from(jobPlatformPostings)
      .where(and(
        eq(jobPlatformPostings.jobId, jobId),
        eq(jobPlatformPostings.platformSlug, platformSlug)
      ))
      .limit(1);
    return result[0];
  }
}

// ==================== IN-MEMORY STORAGE (FOR TESTING) ====================

type OTPRecord = {
  id: string;
  mobileNumber: string;
  otp: string;
  purpose: string;
  attempts: number;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
};

export class MemStorage implements IStorage {
  private users: Map<string, SelectUser> = new Map();
  private usersByEmail: Map<string, string> = new Map();
  private usersByMobile: Map<string, string> = new Map();
  private otpRegistry: Map<string, OTPRecord[]> = new Map();
  private companies: Map<string, SelectCompany> = new Map();
  private jobs: Map<string, SelectJob> = new Map();
  private applications: Map<string, SelectApplication> = new Map();
  private interviews: Map<string, SelectInterviewSession> = new Map();
  private notifications: Map<string, SelectNotification> = new Map();
  private transactions: Map<string, SelectTransaction> = new Map();
  
  private getOTPKey(mobile: string, purpose: string): string {
    return `${mobile}:${purpose}`;
  }
  
  private pruneExpiredOTPs(records: OTPRecord[]): OTPRecord[] {
    const now = new Date();
    return records.filter(r => r.expiresAt > now);
  }
  
  async getUser(id: string): Promise<SelectUser | undefined> {
    return this.users.get(id);
  }
  
  async getUserById(id: string): Promise<SelectUser | undefined> {
    return this.users.get(id);
  }
  
  async getUserByEmail(email: string): Promise<SelectUser | undefined> {
    const userId = this.usersByEmail.get(email.toLowerCase());
    return userId ? this.users.get(userId) : undefined;
  }
  
  async getUserByMobile(mobile: string): Promise<SelectUser | undefined> {
    const userId = this.usersByMobile.get(mobile);
    return userId ? this.users.get(userId) : undefined;
  }
  
  async createUser(user: Partial<InsertUser>): Promise<SelectUser> {
    const id = user.id || `user_${Date.now()}`;
    const newUser: SelectUser = {
      id,
      email: user.email || null,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      profileImageUrl: user.profileImageUrl || null,
      role: user.role || 'candidate',
      companyId: user.companyId || null,
      mobileNumber: user.mobileNumber || null,
      passwordHash: user.passwordHash || null,
      authMethod: user.authMethod || 'replit',
      isEmailVerified: user.isEmailVerified || false,
      isMobileVerified: user.isMobileVerified || false,
      emailVerificationToken: user.emailVerificationToken || null,
      emailVerificationExpiry: user.emailVerificationExpiry || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: user.lastLoginAt || null,
    };
    this.users.set(id, newUser);
    if (newUser.email) {
      this.usersByEmail.set(newUser.email.toLowerCase(), id);
    }
    if (newUser.mobileNumber) {
      this.usersByMobile.set(newUser.mobileNumber, id);
    }
    return newUser;
  }
  
  async updateUser(id: string, updates: Partial<InsertUser>): Promise<SelectUser | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    if (user.email && updates.email && user.email !== updates.email) {
      this.usersByEmail.delete(user.email.toLowerCase());
    }
    if (user.mobileNumber && updates.mobileNumber && user.mobileNumber !== updates.mobileNumber) {
      this.usersByMobile.delete(user.mobileNumber);
    }
    
    const updated = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updated);
    
    if (updated.email) {
      this.usersByEmail.set(updated.email.toLowerCase(), id);
    }
    if (updated.mobileNumber) {
      this.usersByMobile.set(updated.mobileNumber, id);
    }
    
    return updated;
  }
  
  async updateLastLogin(id: string): Promise<void> {
    await this.updateUser(id, { lastLoginAt: new Date() });
  }
  
  async upsertUser(user: Partial<InsertUser>): Promise<SelectUser> {
    const id = user.id!;
    const existing = this.users.get(id);
    
    if (existing) {
      const updated = { ...existing, ...user, updatedAt: new Date() };
      this.users.set(id, updated);
      return updated;
    } else {
      return this.createUser(user);
    }
  }
  
  async createOTP(mobileNumber: string, purpose: string): Promise<string> {
    const crypto = await import('crypto');
    const otp = crypto.randomInt(100000, 999999).toString();
    const key = this.getOTPKey(mobileNumber, purpose);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    let records = this.otpRegistry.get(key) || [];
    records = this.pruneExpiredOTPs(records);
    
    records.forEach(r => r.isUsed = true);
    
    const newRecord: OTPRecord = {
      id: `otp_${Date.now()}_${Math.random()}`,
      mobileNumber,
      otp,
      purpose,
      attempts: 0,
      isUsed: false,
      expiresAt,
      createdAt: new Date(),
    };
    
    records.push(newRecord);
    this.otpRegistry.set(key, records);
    
    return otp;
  }
  
  async verifyOTP(mobileNumber: string, otp: string, purpose: string): Promise<boolean> {
    const key = this.getOTPKey(mobileNumber, purpose);
    let records = this.otpRegistry.get(key) || [];
    records = this.pruneExpiredOTPs(records);
    this.otpRegistry.set(key, records);
    
    const activeRecords = records.filter(r => !r.isUsed);
    if (activeRecords.length === 0) {
      return false;
    }
    
    const latestRecord = activeRecords[activeRecords.length - 1];
    
    const maxAttempts = 3;
    if (latestRecord.attempts >= maxAttempts) {
      return false;
    }
    
    latestRecord.attempts++;
    
    const isValid = latestRecord.otp === otp;
    
    if (isValid) {
      latestRecord.isUsed = true;
    }
    
    return isValid;
  }
  
  async markOTPAsUsed(mobileNumber: string, otp: string): Promise<void> {
    for (const [key, records] of this.otpRegistry.entries()) {
      if (key.startsWith(mobileNumber + ':')) {
        const record = records.find(r => r.otp === otp && !r.isUsed);
        if (record) {
          record.isUsed = true;
          return;
        }
      }
    }
  }
  
  async getCompany(id: string): Promise<SelectCompany | undefined> {
    return this.companies.get(id);
  }
  
  async getCompanyByCode(code: string): Promise<SelectCompany | undefined> {
    return Array.from(this.companies.values()).find(c => c.companyCode === code);
  }
  
  async createCompany(company: Partial<InsertCompany>): Promise<SelectCompany> {
    const id = company.id || `company_${Date.now()}`;
    const newCompany: SelectCompany = {
      id,
      name: company.name || '',
      domain: company.domain || null,
      logoUrl: company.logoUrl || null,
      website: company.website || null,
      industry: company.industry || null,
      size: company.size || null,
      description: company.description || null,
      companyCode: company.companyCode || null,
      subscriptionTier: company.subscriptionTier || 'trial',
      subscriptionStatus: company.subscriptionStatus || 'active',
      monthlyInterviewLimit: company.monthlyInterviewLimit || 10,
      interviewsUsedThisMonth: company.interviewsUsedThisMonth || 0,
      billingCycle: company.billingCycle || 'monthly',
      nextBillingDate: company.nextBillingDate || null,
      settings: company.settings || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.companies.set(id, newCompany);
    return newCompany;
  }
  
  async updateCompany(id: string, updates: Partial<InsertCompany>): Promise<SelectCompany | undefined> {
    const company = this.companies.get(id);
    if (!company) return undefined;
    const updated = { ...company, ...updates, updatedAt: new Date() };
    this.companies.set(id, updated);
    return updated;
  }
  
  async getJob(id: string): Promise<SelectJob | undefined> {
    return this.jobs.get(id);
  }
  
  async getJobs(companyId: string, params?: PaginationParams): Promise<PaginatedResponse<SelectJob>> {
    const { limit, offset } = normalizePagination(params);
    const allJobs = Array.from(this.jobs.values())
      .filter(j => j.companyId === companyId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    
    return {
      data: allJobs.slice(offset, offset + limit),
      total: allJobs.length,
      limit,
      offset
    };
  }
  
  async getAllJobs(params?: PaginationParams): Promise<PaginatedResponse<SelectJob>> {
    const { limit, offset } = normalizePagination(params);
    const allJobs = Array.from(this.jobs.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    
    return {
      data: allJobs.slice(offset, offset + limit),
      total: allJobs.length,
      limit,
      offset
    };
  }
  
  async getActiveJobs(companyId?: string, params?: PaginationParams): Promise<PaginatedResponse<SelectJob>> {
    const { limit, offset } = normalizePagination(params);
    let filtered = Array.from(this.jobs.values()).filter(j => j.status === 'posted');
    
    if (companyId) {
      filtered = filtered.filter(j => j.companyId === companyId);
    }
    
    const sorted = filtered.sort((a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0));
    
    return {
      data: sorted.slice(offset, offset + limit),
      total: sorted.length,
      limit,
      offset
    };
  }
  
  async createJob(job: Partial<InsertJob>): Promise<SelectJob> {
    // Get company to fetch company code
    if (!job.companyId) {
      throw new Error("companyId is required to create a job");
    }
    
    const company = await this.getCompany(job.companyId);
    if (!company) {
      throw new Error("Company not found");
    }
    
    if (!company.companyCode) {
      throw new Error("Company code is required to generate job posting ID");
    }
    
    // Generate job posting ID
    const jobPostingId = generateJobPostingId(company.companyCode);
    
    const id = job.id || `job_${Date.now()}`;
    const newJob: SelectJob = {
      id,
      jobPostingId,
      companyId: job.companyId || '',
      createdBy: job.createdBy || '',
      title: job.title || '',
      department: job.department || null,
      location: job.location || null,
      employmentType: job.employmentType || 'full_time',
      experienceLevel: job.experienceLevel || null,
      salaryMin: job.salaryMin || null,
      salaryMax: job.salaryMax || null,
      salaryCurrency: job.salaryCurrency || 'INR',
      description: job.description || '',
      responsibilities: job.responsibilities || null,
      requirements: job.requirements || null,
      niceToHave: job.niceToHave || null,
      status: job.status || 'draft',
      applicationsCount: job.applicationsCount || 0,
      interviewsScheduled: job.interviewsScheduled || 0,
      extractedSkills: job.extractedSkills || [],
      aiGeneratedQuestions: job.aiGeneratedQuestions || [],
      publishedAt: job.publishedAt || null,
      closedAt: job.closedAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      slug: job.slug || null,
    };
    this.jobs.set(id, newJob);
    return newJob;
  }
  
  async updateJob(id: string, updates: Partial<InsertJob>): Promise<SelectJob | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    const updated = { ...job, ...updates, updatedAt: new Date() };
    this.jobs.set(id, updated);
    return updated;
  }
  
  async getApplication(id: string): Promise<SelectApplication | undefined> {
    return this.applications.get(id);
  }
  
  async getJobApplications(jobId: string): Promise<SelectApplication[]> {
    return Array.from(this.applications.values())
      .filter(a => a.jobId === jobId)
      .sort((a, b) => (b.aiMatchScore || 0) - (a.aiMatchScore || 0));
  }
  
  async getCandidateApplications(candidateId: string): Promise<SelectApplication[]> {
    return Array.from(this.applications.values())
      .filter(a => a.candidateId === candidateId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }
  
  async createApplication(application: Partial<InsertApplication>): Promise<SelectApplication> {
    if (!application.jobId) {
      throw new Error("jobId is required to create an application");
    }
    
    const id = application.id || `app_${Date.now()}`;
    const newApp: SelectApplication = {
      id,
      jobId: application.jobId || '',
      candidateId: application.candidateId || '',
      resumeUrl: application.resumeUrl || null,
      coverLetter: application.coverLetter || null,
      status: application.status || 'submitted',
      aiMatchScore: application.aiMatchScore || null,
      aiRanking: application.aiRanking || null,
      resumeParsingData: application.resumeParsingData || null,
      interviewSessionId: application.interviewSessionId || null,
      interviewScheduledAt: application.interviewScheduledAt || null,
      interviewCompletedAt: application.interviewCompletedAt || null,
      recruiterNotes: application.recruiterNotes || null,
      internalRating: application.internalRating || null,
      assignedTo: application.assignedTo || null,
      source: application.source || null,
      metadata: application.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      screeningScore: application.screeningScore || null,
      screeningStatus: application.screeningStatus || null,
      screeningData: application.screeningData || null,
      interviewScore: application.interviewScore || null,
      interviewData: application.interviewData || null,
      finalRanking: application.finalRanking || null,
      finalScore: application.finalScore || null,
      finalRankingData: application.finalRankingData || null,
      workflowRunId: application.workflowRunId || null,
      currentWorkflowState: application.currentWorkflowState || null,
      workflowCompletedSteps: application.workflowCompletedSteps || [],
    };
    this.applications.set(id, newApp);
    return newApp;
  }
  
  async updateApplication(id: string, updates: Partial<InsertApplication>): Promise<SelectApplication | undefined> {
    const app = this.applications.get(id);
    if (!app) return undefined;
    const updated = { ...app, ...updates, updatedAt: new Date() };
    this.applications.set(id, updated);
    return updated;
  }

  async getApplicationsSummary(candidateId: string): Promise<any> {
    const apps = Array.from(this.applications.values()).filter(a => a.candidateId === candidateId);
    
    const summary: any = {
      total: apps.length,
      submitted: 0,
      screening: 0,
      interview_scheduled: 0,
      interviewing: 0,
      interview: 0,
      interviewed: 0,
      rejected: 0,
      selected: 0,
    };

    apps.forEach(app => {
      const status = app.status || 'applied';
      if (summary.hasOwnProperty(status)) {
        summary[status]++;
      }
    });

    return summary;
  }

  async getInterviewsSummary(candidateId: string): Promise<any> {
    const interviews = Array.from(this.interviews.values()).filter(i => i.userId === candidateId);
    
    const summary: any = {
      total: interviews.length,
      scheduled: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };

    interviews.forEach(interview => {
      const status = interview.status || 'scheduled';
      if (summary.hasOwnProperty(status)) {
        summary[status]++;
      }
    });

    return summary;
  }
  
  async deleteJob(id: string): Promise<void> {
    this.jobs.delete(id);
  }
  
  async getCompanyApplications(companyId: string, params?: PaginationParams): Promise<PaginatedResponse<SelectApplication>> {
    const { limit, offset } = normalizePagination(params);
    const companyJobIds = Array.from(this.jobs.values())
      .filter(j => j.companyId === companyId)
      .map(j => j.id);
    
    const allApplications = Array.from(this.applications.values())
      .filter(a => companyJobIds.includes(a.jobId))
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .map(app => ({
        ...app,
        job: this.jobs.get(app.jobId)
      }));
    
    return {
      data: allApplications.slice(offset, offset + limit) as SelectApplication[],
      total: allApplications.length,
      limit,
      offset
    };
  }
  
  async getAllApplications(params?: PaginationParams): Promise<PaginatedResponse<SelectApplication>> {
    const { limit, offset } = normalizePagination(params);
    const allApplications = Array.from(this.applications.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .map(app => ({
        ...app,
        job: this.jobs.get(app.jobId)
      }));
    
    return {
      data: allApplications.slice(offset, offset + limit) as SelectApplication[],
      total: allApplications.length,
      limit,
      offset
    };
  }
  
  async getAllUsers(params?: PaginationParams): Promise<PaginatedResponse<SelectUser>> {
    const { limit, offset } = normalizePagination(params);
    const allUsers = Array.from(this.users.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    
    return {
      data: allUsers.slice(offset, offset + limit),
      total: allUsers.length,
      limit,
      offset
    };
  }
  
  async getCompanyStats(companyId: string): Promise<any> {
    // Access data directly without pagination for stats
    const companyJobs = Array.from(this.jobs.values())
      .filter(j => j.companyId === companyId);
    
    const companyJobIds = companyJobs.map(j => j.id);
    const allApplications = Array.from(this.applications.values())
      .filter(a => companyJobIds.includes(a.jobId));
    
    return {
      totalJobs: companyJobs.length,
      activeJobs: companyJobs.filter(j => j.status === 'posted').length,
      totalApplications: allApplications.length,
      pendingApplications: allApplications.filter(a => a.status === 'applied').length,
      interviewsScheduled: allApplications.filter(a => a.status === 'scheduled').length,
      selectedCandidates: allApplications.filter(a => a.status === 'selected').length,
    };
  }
  
  async getPlatformStats(): Promise<any> {
    // Access data directly without pagination for stats
    const allUsers = Array.from(this.users.values());
    const allCompanies = Array.from(this.companies.values());
    const allJobs = Array.from(this.jobs.values());
    const allApplications = Array.from(this.applications.values());
    
    return {
      totalUsers: allUsers.length,
      candidateCount: allUsers.filter(u => u.role === 'candidate').length,
      recruiterCount: allUsers.filter(u => u.role === 'recruiter' || u.role === 'company_admin').length,
      totalCompanies: allCompanies.length,
      totalJobs: allJobs.length,
      activeJobs: allJobs.filter(j => j.status === 'posted').length,
      totalApplications: allApplications.length,
      interviewsCompleted: allApplications.filter(a => a.status === 'interview_complete').length,
    };
  }
  
  async getInterviewSession(id: string): Promise<SelectInterviewSession | undefined> {
    return this.interviews.get(id);
  }
  
  async createInterviewSession(session: Partial<InsertInterviewSession>): Promise<SelectInterviewSession> {
    const id = session.id || `interview_${Date.now()}`;
    const newSession: SelectInterviewSession = {
      id,
      applicationId: session.applicationId || '',
      userId: session.userId || '',
      jobId: session.jobId || '',
      interviewType: session.interviewType || 'ai_async',
      examType: session.examType || null,
      subject: session.subject || null,
      status: session.status || 'scheduled',
      scheduledAt: session.scheduledAt || null,
      startedAt: session.startedAt || null,
      completedAt: session.completedAt || null,
      duration: session.duration || null,
      totalQuestions: session.totalQuestions || 10,
      questionsAnswered: session.questionsAnswered || 0,
      videoUrls: session.videoUrls || [],
      overallScore: session.overallScore || null,
      skillScores: session.skillScores || [],
      metadata: session.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.interviews.set(id, newSession);
    return newSession;
  }
  
  async updateInterviewSession(id: string, updates: Partial<InsertInterviewSession>): Promise<SelectInterviewSession | undefined> {
    const session = this.interviews.get(id);
    if (!session) return undefined;
    const updated = { ...session, ...updates, updatedAt: new Date() };
    this.interviews.set(id, updated);
    return updated;
  }
  
  async createNotification(notification: Partial<InsertNotification>): Promise<SelectNotification> {
    const id = notification.id || `notif_${Date.now()}`;
    const newNotif: SelectNotification = {
      id,
      userId: notification.userId || '',
      type: notification.type || '',
      title: notification.title || '',
      message: notification.message || '',
      jobId: notification.jobId || null,
      applicationId: notification.applicationId || null,
      isRead: notification.isRead || false,
      readAt: notification.readAt || null,
      metadata: notification.metadata || {},
      createdAt: new Date(),
    };
    this.notifications.set(id, newNotif);
    return newNotif;
  }
  
  async getUserNotifications(userId: string): Promise<SelectNotification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, 50);
  }
  
  async markNotificationAsRead(id: string): Promise<void> {
    const notif = this.notifications.get(id);
    if (notif) {
      this.notifications.set(id, { ...notif, isRead: true, readAt: new Date() });
    }
  }
  
  async createSelectionDecision(decision: Partial<InsertSelectionDecision>): Promise<SelectSelectionDecision> {
    const id = decision.id || `dec_${Date.now()}`;
    const newDec: any = {
      id,
      applicationId: decision.applicationId || '',
      jobId: decision.jobId || '',
      candidateId: decision.candidateId || '',
      decision: decision.decision || 'selected',
      round: decision.round || 1,
      stage: decision.stage || 'screening',
      decisionMadeBy: decision.decisionMadeBy || '',
      decisionDate: decision.decisionDate || new Date(),
      reason: decision.reason || null,
      internalNotes: decision.internalNotes || null,
      interviewEvaluationId: decision.interviewEvaluationId || null,
      screeningResultId: decision.screeningResultId || null,
      offerExtended: decision.offerExtended || false,
      offerExtendedDate: decision.offerExtendedDate || null,
      offerAccepted: decision.offerAccepted || null,
      offerAcceptedDate: decision.offerAcceptedDate || null,
      offerLetter: decision.offerLetter || null,
      offeredSalary: decision.offeredSalary || null,
      offeredCurrency: decision.offeredCurrency || 'INR',
      offeredBenefits: decision.offeredBenefits || null,
      nextSteps: decision.nextSteps || null,
      followUpRequired: decision.followUpRequired || false,
      followUpDate: decision.followUpDate || null,
      metadata: decision.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return newDec;
  }

  async getSelectionDecisionByApplication(applicationId: string): Promise<SelectSelectionDecision | undefined> {
    // In-memory storage doesn't have selection decisions table
    return undefined;
  }

  async createTransaction(transaction: Partial<InsertTransaction>): Promise<SelectTransaction> {
    const id = transaction.id || `txn_${Date.now()}`;
    const newTxn: SelectTransaction = {
      id,
      companyId: transaction.companyId || '',
      userId: transaction.userId || '',
      razorpayOrderId: transaction.razorpayOrderId || null,
      razorpayPaymentId: transaction.razorpayPaymentId || null,
      razorpaySignature: transaction.razorpaySignature || null,
      amount: transaction.amount || 0,
      currency: transaction.currency || 'INR',
      status: transaction.status || 'created',
      purpose: transaction.purpose || null,
      planType: transaction.planType || null,
      interviewCount: transaction.interviewCount || null,
      metadata: transaction.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      paidAt: transaction.paidAt || null,
    };
    this.transactions.set(id, newTxn);
    return newTxn;
  }
  
  // Job Platform Postings (stub implementations for in-memory storage)
  async getJobPlatformPostings(jobId: string): Promise<SelectJobPlatformPosting[]> {
    return [];
  }
  
  async getJobPlatformPostingsSummary(jobId: string): Promise<{ count: number; latestPostedAt: Date | null }> {
    return { count: 0, latestPostedAt: null };
  }
  
  async createJobPlatformPosting(posting: Partial<InsertJobPlatformPosting>): Promise<SelectJobPlatformPosting> {
    const newPosting: any = {
      id: `posting_${Date.now()}`,
      jobId: posting.jobId || '',
      platformName: posting.platformName || '',
      platformSlug: posting.platformSlug || '',
      postedAt: new Date(),
      postedBy: posting.postedBy || null,
      externalUrl: posting.externalUrl || null,
      externalJobId: posting.externalJobId || null,
      status: posting.status || 'active',
      metadata: posting.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return newPosting;
  }
  
  async getJobPlatformPostingByPlatform(jobId: string, platformSlug: string): Promise<SelectJobPlatformPosting | undefined> {
    return undefined;
  }
}

// Export storage instance (using database storage for now)
export const storage: IStorage = new DbStorage();
