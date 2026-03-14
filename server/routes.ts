import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isRecruiter, isCompanyAdmin, isB2BUser, hashPassword, comparePassword } from "./auth";
import { workflowTrigger } from "./workflow/trigger"; // Agentic AI workflow trigger
import passport from "passport";
import { z } from "zod";
import { db } from "./db";
import { workflowRuns, workflowEvents, agentTasks, applications, users, jobs, companies, resumes, jobPlatformPostings, scoringConfigs, interviewSessions, questionBanks, interviewMessages, interviewEvaluations, selectionDecisions, screeningResults } from "@shared/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import multer from "multer";
import { ObjectStorageService } from "./objectStorage";
import { randomUUID } from "crypto";
import { DEFAULT_SCORING_WEIGHTS, DEFAULT_SCORING_WEIGHTS_SUM } from "@shared/constants/scoring";
import fs from "fs";
import path from "path";
import { uploadVideo, getVideoMeta, getVideoStreamUrl, streamLocalVideo, streamS3Video, IS_PROD } from "./fileStorage";

// ==================== REGISTER ROUTES ====================

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);

  // ==================== SESSION & AUTH SETUP ====================
  await setupAuth(app);

  // ==================== AUTH ROUTES ====================

  app.post('/api/auth/signup', async (req, res) => {
    return res.status(403).json({ 
      message: "This is a B2B platform for Company Admins and Recruiters only. Candidate signup is disabled. Please contact your company administrator for access." 
    });
  });

  // Email/password login
  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        console.error('[Auth] Login error:', err);
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        console.log('[Auth] Login failed:', info?.message);
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      // B2B: Reject candidate login
      if (user.role === 'candidate') {
        console.log('[Auth] Candidate login attempt rejected:', user.email);
        return res.status(403).json({ 
          message: "This system is for Company Admins and Recruiters only. Candidate access is disabled. Please contact your company administrator for access." 
        });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          console.error('[Auth] Session creation error:', err);
          return res.status(500).json({ message: "Login failed" });
        }
        console.log('[Auth] Login successful:', user.email, '- Role:', user.role);
        const { passwordHash, emailVerificationToken, ...safeUser } = user;
        return res.json(safeUser);
      });
    })(req, res, next);
  });

  app.post('/api/auth/otp/request', async (req, res) => {
    try {
      const { mobileNumber, purpose } = req.body;
      
      if (!mobileNumber) {
        return res.status(400).json({ message: "Mobile number is required" });
      }
      
      const otp = await storage.createOTP(mobileNumber, purpose || 'login');
      
      res.json({ message: "OTP sent successfully", expiresIn: 600 });
    } catch (error) {
      console.error("OTP request error:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post('/api/auth/otp/verify', async (req, res) => {
    try {
      const { mobileNumber, otp, purpose } = req.body;
      
      if (!mobileNumber || !otp) {
        return res.status(400).json({ message: "Mobile number and OTP are required" });
      }
      
      const isValid = await storage.verifyOTP(mobileNumber, otp, purpose || 'login');
      
      if (!isValid) {
        return res.status(401).json({ message: "Invalid or expired OTP" });
      }
      
      let user = await storage.getUserByMobile(mobileNumber);
      
      if (!user) {
        return res.status(403).json({ 
          message: "This is a B2B platform for Company Admins and Recruiters only. Please contact your company administrator for access." 
        });
      }

      // B2B: Reject candidate login
      if (user.role === 'candidate') {
        return res.status(403).json({ 
          message: "This system is for Company Admins and Recruiters only. Candidate access is disabled. Please contact your company administrator for access." 
        });
      }

      await storage.updateUser(user.id, { isMobileVerified: true });
      
      await storage.markOTPAsUsed(mobileNumber, otp);
      
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        const { passwordHash, emailVerificationToken, ...safeUser } = user;
        return res.json(safeUser);
      });
    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Also handle GET for logout (for browser compatibility)
  app.get('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/auth/user', isAuthenticated, isB2BUser, (req: any, res) => {
    const { passwordHash, emailVerificationToken, ...safeUser } = req.user as any;
    res.json(safeUser);
  });

  // ==================== USER MANAGEMENT ====================

  app.get('/api/users/me', isAuthenticated, isB2BUser, async (req: any, res) => {
    try {
      const user = req.user;
      const { passwordHash, emailVerificationToken, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  app.patch('/api/users/me', isAuthenticated, isB2BUser, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { firstName, lastName, profileImageUrl, mobileNumber } = req.body;
      
      const updated = await storage.updateUser(userId, {
        firstName,
        lastName,
        profileImageUrl,
        mobileNumber,
      });
      
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { passwordHash, emailVerificationToken, ...safeUser } = updated;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // ==================== PROFILE MANAGEMENT ====================

  // Get comprehensive user profile with company info
  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove sensitive fields
      const { passwordHash, emailVerificationToken, ...safeUser } = user;

      // Add company info if user has a company
      let profileData: any = safeUser;
      if (user.companyId) {
        const company = await storage.getCompany(user.companyId);
        if (company) {
          profileData = {
            ...safeUser,
            company,
          };
        }
      }
      
      res.json(profileData);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Update user profile (personal information)
  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { firstName, lastName, email, mobileNumber } = req.body;
      
      const updated = await storage.updateUser(userId, {
        firstName,
        lastName,
        email,
        mobileNumber,
        updatedAt: new Date(),
      });
      
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { passwordHash, emailVerificationToken, ...safeUser } = updated;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Change password
  app.put('/api/profile/password', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters" });
      }

      // Get current user
      const user = await storage.getUser(userId);
      if (!user || !user.passwordHash) {
        return res.status(404).json({ message: "User not found or password not set" });
      }

      // Verify current password
      const isValid = await comparePassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      await storage.updateUser(userId, {
        passwordHash: hashedPassword,
        updatedAt: new Date(),
      });

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Upload profile photo
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  app.post('/api/profile/photo', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No file provided" });
      }

      // Convert file to base64 data URL for direct storage
      const base64Data = file.buffer.toString('base64');
      const photoUrl = `data:${file.mimetype};base64,${base64Data}`;

      // Update user profile with the new photo URL
      const updated = await storage.updateUser(userId, {
        profileImageUrl: photoUrl,
        updatedAt: new Date(),
      });

      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      const { passwordHash, emailVerificationToken, ...safeUser } = updated;
      res.json({
        message: "Profile photo uploaded successfully",
        user: safeUser,
        photoUrl
      });
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      res.status(500).json({ message: "Failed to upload profile photo" });
    }
  });

  // ==================== SCORING CONFIGURATION ====================

  // Get scoring config for company
  app.get('/api/scoring-config', isAuthenticated, async (req: any, res) => {
    try {
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json(DEFAULT_SCORING_WEIGHTS);
      }

      const [config] = await db
        .select()
        .from(scoringConfigs)
        .where(eq(scoringConfigs.companyId, companyId));

      if (!config) {
        // Return default config if not found
        return res.json(DEFAULT_SCORING_WEIGHTS);
      }

      res.json(config);
    } catch (error) {
      console.error("Error fetching scoring config:", error);
      res.status(500).json({ message: "Failed to fetch scoring config" });
    }
  });

  // Update scoring config for company
  app.put('/api/scoring-config', isAuthenticated, async (req: any, res) => {
    try {
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(403).json({ message: "Must be part of a company to manage scoring config" });
      }

      if (req.user.role !== 'company_admin' && req.user.role !== 'recruiter') {
        return res.status(403).json({ message: "Unauthorized to update scoring config" });
      }

      // Validate request body with Zod to ensure exact type match (no coercion)
      const scoringConfigSchema = z.object({
        skillsMatch: z.number().min(0).max(100),
        experienceLevel: z.number().min(0).max(100),
        education: z.number().min(0).max(100),
        workHistoryRelevance: z.number().min(0).max(100),
        keywords: z.number().min(0).max(100),
        culturalFit: z.number().min(0).max(100),
      }).refine((data) => {
        const total = data.skillsMatch + data.experienceLevel + data.education + 
                     data.workHistoryRelevance + data.keywords + data.culturalFit;
        return Math.abs(total - 100) < 0.1;
      }, { message: "Total weightages must equal 100%" });
      
      const parseResult = scoringConfigSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errors = parseResult.error.errors.map(e => e.message).join(', ');
        console.error(`[ScoringConfig] Invalid config rejected:`, { companyId, body: req.body, errors });
        return res.status(400).json({ message: `Invalid scoring config: ${errors}` });
      }
      
      const { skillsMatch, experienceLevel, education, workHistoryRelevance, keywords, culturalFit } = parseResult.data;
      const total = skillsMatch + experienceLevel + education + workHistoryRelevance + keywords + culturalFit;
      
      console.log(`[ScoringConfig] Saving validated config:`, { companyId, skillsMatch, experienceLevel, education, workHistoryRelevance, keywords, culturalFit, total });

      // Check if config exists
      const [existing] = await db
        .select()
        .from(scoringConfigs)
        .where(eq(scoringConfigs.companyId, companyId));

      let result;
      if (existing) {
        // Update existing
        const [updated] = await db
          .update(scoringConfigs)
          .set({
            skillsMatch,
            experienceLevel,
            education,
            workHistoryRelevance,
            keywords,
            culturalFit,
            updatedAt: new Date(),
          })
          .where(eq(scoringConfigs.companyId, companyId))
          .returning();
        result = updated;
      } else {
        // Create new
        const [created] = await db
          .insert(scoringConfigs)
          .values({
            companyId,
            skillsMatch,
            experienceLevel,
            education,
            workHistoryRelevance,
            keywords,
            culturalFit,
          })
          .returning();
        result = created;
      }

      res.json(result);
    } catch (error) {
      console.error("Error updating scoring config:", error);
      res.status(500).json({ message: "Failed to update scoring config" });
    }
  });

  // ==================== COMPANY MANAGEMENT ====================

  app.get('/api/companies/me', isAuthenticated, async (req: any, res) => {
    try {
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(404).json({ message: "No company associated with this user" });
      }
      
      const company = await storage.getCompany(companyId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.patch('/api/companies/me', isAuthenticated, isCompanyAdmin, async (req: any, res) => {
    try {
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: "No company associated with this user" });
      }
      
      const { name, logoUrl, website, industry, size, description, settings } = req.body;
      
      const updated = await storage.updateCompany(companyId, {
        name,
        logoUrl,
        website,
        industry,
        size,
        description,
        settings,
      });
      
      if (!updated) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  app.put('/api/companies/update-code', isAuthenticated, isCompanyAdmin, async (req: any, res) => {
    try {
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: "No company associated with this user" });
      }
      
      const { companyCode } = req.body;
      
      // Validate company code format (4 uppercase letters)
      if (!companyCode || typeof companyCode !== 'string' || !/^[A-Z]{4}$/.test(companyCode)) {
        return res.status(400).json({ message: "Company code must be exactly 4 uppercase letters" });
      }
      
      // Check if company code is already taken by another company
      const existingCompany = await storage.getCompanyByCode(companyCode);
      if (existingCompany && existingCompany.id !== companyId) {
        return res.status(409).json({ message: "This company code is already in use by another company" });
      }
      
      // Update company code
      const updated = await storage.updateCompany(companyId, {
        companyCode,
      });
      
      if (!updated) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating company code:", error);
      res.status(500).json({ message: "Failed to update company code" });
    }
  });

  // ==================== JOB MANAGEMENT ====================

  // Get all active jobs (public - for candidates browsing)
  app.get('/api/jobs', async (req: any, res) => {
    try {
      const jobsResponse = await storage.getActiveJobs();
      
      // Enrich jobs with company and recruiter info
      const enrichedJobs = await Promise.all(
        jobsResponse.data.map(async (job) => {
          const company = await storage.getCompany(job.companyId);
          const recruiter = job.createdBy ? await storage.getUser(job.createdBy) : null;
          
          return {
            ...job,
            companyName: company?.name || 'Unknown Company',
            recruiterName: recruiter ? `${recruiter.firstName} ${recruiter.lastName}` : 'N/A',
          };
        })
      );
      
      res.json({
        ...jobsResponse,
        data: enrichedJobs,
      });
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // Get company's jobs (recruiter/company_admin only)
  app.get('/api/jobs/company', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: "No company associated with this user" });
      }
      
      const jobsResponse = await storage.getJobs(companyId);
      
      // Enrich jobs with platform posting summary
      const enrichedJobs = await Promise.all(
        jobsResponse.data.map(async (job) => {
          const postingSummary = await storage.getJobPlatformPostingsSummary(job.id);
          return {
            ...job,
            platformPostingCount: postingSummary.count,
            latestPostedAt: postingSummary.latestPostedAt,
          };
        })
      );
      
      // Return with pagination metadata preserved
      res.json({
        ...jobsResponse,
        data: enrichedJobs,
      });
    } catch (error) {
      console.error("Error fetching company jobs:", error);
      res.status(500).json({ message: "Failed to fetch company jobs" });
    }
  });

  // Get job platform postings (which platforms, dates, stats)
  app.get('/api/jobs/:jobId/platform-postings', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const { jobId } = req.params;
      const companyId = req.user.companyId;
      
      // Verify job belongs to company
      const job = await storage.getJob(jobId);
      if (!job || job.companyId !== companyId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const postings = await db.select()
        .from(jobPlatformPostings)
        .where(eq(jobPlatformPostings.jobId, jobId));
      
      res.json(postings || []);
    } catch (error) {
      console.error("Error fetching platform postings:", error);
      res.status(500).json({ message: "Failed to fetch platform postings" });
    }
  });

  // Create job platform posting (recruiter/company_admin only)
  app.post('/api/jobs/:jobId/platform-postings', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;
      const companyId = req.user.companyId;
      const { platformName, platformSlug } = req.body;
      
      // Verify job belongs to company
      const job = await storage.getJob(jobId);
      if (!job || job.companyId !== companyId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Check if job is active (only Active jobs can be posted, not Draft)
      if (job.status !== 'active') {
        return res.status(400).json({ message: "Only active jobs can be posted to platforms. Please change the job status to Active first." });
      }
      
      // Check if posting already exists for this platform
      const existingPosting = await storage.getJobPlatformPostingByPlatform(jobId, platformSlug);
      if (existingPosting) {
        return res.status(400).json({ message: `Job is already posted to ${platformName}` });
      }
      
      // Create the posting
      const posting = await storage.createJobPlatformPosting({
        jobId,
        platformName,
        platformSlug,
        postedBy: userId,
        status: 'active',
      });
      
      res.status(201).json(posting);
    } catch (error) {
      console.error("Error creating platform posting:", error);
      res.status(500).json({ message: "Failed to create platform posting" });
    }
  });

  // Get single job (public)
  app.get('/api/jobs/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const job = await storage.getJob(id);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.json(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  // Create job (recruiter/company_admin only)
  app.post('/api/jobs', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: "No company associated with this user" });
      }
      
      const jobData = {
        ...req.body,
        companyId,
        createdBy: userId,
        status: 'draft', // Jobs always start as draft - must be explicitly posted
      };
      
      const job = await storage.createJob(jobData);
      
      res.status(201).json(job);
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  // Generate job description using AI (recruiter/company_admin only)
  app.post('/api/jobs/generate-description', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const { title, experienceLevel, employmentType } = req.body;
      
      if (!title) {
        return res.status(400).json({ message: "Job title is required" });
      }

      // Check if OPENAI_API_KEY is available
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ 
          message: "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment secrets." 
        });
      }

      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = `Generate a comprehensive job description for a ${experienceLevel || 'mid'}-level ${title} position with ${employmentType || 'full-time'} employment.

Please provide:
1. A compelling job description (2-3 paragraphs) that includes:
   - Overview of the role and its impact
   - Key responsibilities
   - What makes this position exciting

2. Required qualifications and requirements:
   - Education requirements
   - Years of experience needed
   - Key skills and competencies
   - Any certifications or licenses

Format the response as JSON with "description" and "requirements" fields.`;

      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert HR professional who writes compelling job descriptions. Always respond with valid JSON containing 'description' and 'requirements' fields.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      console.log('OpenAI Response:', JSON.stringify(result, null, 2));
      
      // Handle requirements as either string or array
      let requirementsText = "";
      if (typeof result.requirements === 'string') {
        requirementsText = result.requirements;
      } else if (Array.isArray(result.requirements)) {
        requirementsText = result.requirements.join('\n');
      } else if (typeof result.requirements === 'object' && result.requirements !== null) {
        // If it's an object, try to extract meaningful text
        requirementsText = Object.values(result.requirements).join('\n');
      }
      
      res.json({
        description: result.description || "",
        requirements: requirementsText,
      });
    } catch (error: any) {
      console.error("Error generating job description:", error);
      res.status(500).json({ 
        message: "Failed to generate job description",
        error: error.message 
      });
    }
  });

  // Update job (recruiter/company_admin only)
  app.patch('/api/jobs/:id', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const companyId = req.user.companyId;
      
      const existingJob = await storage.getJob(id);
      if (!existingJob || existingJob.companyId !== companyId) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Status change validation: Draft -> Active is allowed, but Active status doesn't auto-post
      // Posting to platforms requires explicit Post action
      const updated = await storage.updateJob(id, req.body);
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating job:", error);
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  // Delete job (recruiter/company_admin only)
  app.delete('/api/jobs/:id', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const { id } = req.params;
      const companyId = req.user.companyId;
      
      const existingJob = await storage.getJob(id);
      if (!existingJob || existingJob.companyId !== companyId) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      await storage.deleteJob(id);
      res.json({ message: "Job deleted successfully" });
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Apply to job (candidate only)
  app.post('/api/jobs/:id/apply', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const candidateId = req.user.id;
      
      if (req.user.role !== 'candidate') {
        return res.status(403).json({ message: "Only candidates can apply to jobs" });
      }
      
      const job = await storage.getJob(id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Check if job is posted to platform (explicit posting required)
      const platformPosting = await storage.getJobPlatformPostingByPlatform(id, 'rytefit');
      if (!platformPosting || platformPosting.status !== 'active') {
        return res.status(404).json({ message: "Job is not currently accepting applications" });
      }
      
      const existingApplications = await storage.getCandidateApplications(candidateId);
      const alreadyApplied = existingApplications.some(app => app.jobId === id);
      
      if (alreadyApplied) {
        return res.status(400).json({ message: "You have already applied to this job" });
      }
      
      const application = await storage.createApplication({
        jobId: id,
        candidateId,
        status: 'applied', // Start in 'applied' state for workflow
        resumeUrl: req.body.resumeUrl || null,
        coverLetter: req.body.coverLetter || null,
      });
      
      // Increment applications count
      await db.update(jobs).set({
        applicationsCount: sql`${jobs.applicationsCount} + 1`
      }).where(eq(jobs.id, id));
      
      // Trigger agentic AI workflow - starts resume screening automatically
      try {
        const workflowRunId = await workflowTrigger.startApplicationWorkflow(application.id);
        console.log(`[API] Started workflow ${workflowRunId} for application ${application.id}`);
      } catch (workflowError) {
        console.error('[API] Failed to start workflow, but application created:', workflowError);
        // Continue - application is created, workflow can be triggered manually later
      }
      
      res.status(201).json(application);
    } catch (error) {
      console.error("Error applying to job:", error);
      res.status(500).json({ message: "Failed to apply to job" });
    }
  });

  // ==================== APPLICATION MANAGEMENT ====================

  // Create application with resume selection (candidate applies to job)
  app.post('/api/applications', isAuthenticated, async (req: any, res) => {
    try {
      const { jobId, resumeId } = req.body;
      const candidateId = req.user.id;

      console.log("[APPLICATION] POST /api/applications - User:", candidateId, "Job:", jobId, "Resume:", resumeId);

      if (req.user.role !== 'candidate') {
        return res.status(403).json({ message: "Only candidates can apply to jobs" });
      }

      if (!jobId || !resumeId) {
        return res.status(400).json({ message: "jobId and resumeId are required" });
      }

      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Check if job is posted to platform (explicit posting required)
      const platformPosting = await storage.getJobPlatformPostingByPlatform(jobId, 'rytefit');
      if (!platformPosting || platformPosting.status !== 'active') {
        return res.status(404).json({ message: "Job is not currently accepting applications" });
      }

      // Check if already applied
      const existingApplications = await storage.getCandidateApplications(candidateId);
      const alreadyApplied = existingApplications.some(app => app.jobId === jobId);
      if (alreadyApplied) {
        return res.status(400).json({ message: "You have already applied to this job" });
      }

      // Get the resume
      const resume = await storage.getCandidateResume(resumeId);
      if (!resume || resume.userId !== candidateId) {
        return res.status(404).json({ message: "Resume not found" });
      }

      // Create application with resume data
      const application = await storage.createApplication({
        jobId,
        candidateId,
        status: 'applied',
        resumeUrl: resumeId, // Store resume ID as reference
        coverLetter: null,
      });

      console.log("[APPLICATION] Application created:", application.id, "with resume:", resumeId);

      // Increment applications count
      await db.update(jobs).set({
        applicationsCount: sql`${jobs.applicationsCount} + 1`
      }).where(eq(jobs.id, jobId));

      // Trigger agentic AI workflow - starts resume screening automatically
      try {
        const workflowRunId = await workflowTrigger.startApplicationWorkflow(application.id);
        console.log(`[API] Started workflow ${workflowRunId} for application ${application.id}`);
      } catch (workflowError) {
        console.error('[API] Failed to start workflow, but application created:', workflowError);
      }

      res.status(201).json(application);
    } catch (error) {
      console.error("[APPLICATION] Error creating application:", error);
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  // Get applications for a job
  app.get('/api/jobs/:jobId/applications', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const { jobId } = req.params;
      const companyId = req.user.companyId;
      
      // Verify job belongs to company
      const job = await storage.getJob(jobId);
      if (!job || job.companyId !== companyId) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      const applications = await storage.getJobApplications(jobId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // Get candidate's own applications
  app.get('/api/applications/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      if (req.user.role !== 'candidate') {
        return res.status(403).json({ message: "Only candidates can access this endpoint" });
      }
      
      const applications = await storage.getCandidateApplications(userId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching candidate applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // Dashboard: Applications summary by status
  app.get('/api/dashboard/applications-summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      if (req.user.role !== 'candidate') {
        return res.status(403).json({ message: "Only candidates can access this endpoint" });
      }
      
      const summary = await storage.getApplicationsSummary(userId);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching applications summary:", error);
      res.status(500).json({ message: "Failed to fetch applications summary" });
    }
  });

  // Dashboard: Interviews summary by status
  app.get('/api/dashboard/interviews-summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      if (req.user.role !== 'candidate') {
        return res.status(403).json({ message: "Only candidates can access this endpoint" });
      }
      
      const summary = await storage.getInterviewsSummary(userId);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching interviews summary:", error);
      res.status(500).json({ message: "Failed to fetch interviews summary" });
    }
  });

  // Get all applications for company (recruiter/company_admin)
  app.get('/api/applications', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: "No company associated with this user" });
      }
      
      const applications = await storage.getCompanyApplications(companyId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching company applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // Update application status (recruiter/company_admin)
  app.patch('/api/applications/:id', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const { id } = req.params;
      const companyId = req.user.companyId;
      
      const application = await storage.getApplication(id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      const job = await storage.getJob(application.jobId);
      if (!job || job.companyId !== companyId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updated = await storage.updateApplication(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating application:", error);
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // Score application with AI using LangGraph workflow (recruiter/company_admin)
  app.post('/api/applications/:id/score', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const { id } = req.params;
      const companyId = req.user.companyId;
      
      const application = await storage.getApplication(id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      const job = await storage.getJob(application.jobId);
      if (!job || job.companyId !== companyId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ message: "OpenAI API not configured" });
      }

      const candidate = await storage.getUser(application.candidateId);
      
      // Get resume from resumes table
      const [resume] = await db
        .select()
        .from(resumes)
        .where(eq(resumes.applicationId, id));
      
      const resumeText = resume?.rawText || 'Resume data not available';
      
      // Use LangGraph workflow for multi-step analysis
      console.log(`[API] Starting LangGraph resume screening for application ${id}`);
      const { resumeScreeningGraph } = await import('./agents/resume-screening-graph');
      
      const graphResult = await resumeScreeningGraph.invoke({
        applicationId: id,
        resumeText,
        jobDescription: job.description || '',
        requiredSkills: job.extractedSkills || [],
        companyId,
      });

      // Check for errors in workflow
      if (graphResult.error) {
        throw new Error(graphResult.error);
      }

      console.log(`[API] LangGraph screening complete: Score ${graphResult.finalScore}% (${graphResult.status})`);

      // Update application with screening results
      await storage.updateApplication(id, {
        screeningScore: graphResult.finalScore,
        screeningStatus: graphResult.finalScore >= 75 ? 'passed' : graphResult.finalScore >= 50 ? 'pending' : 'failed',
        screeningData: {
          parameterScores: graphResult.parameterScores,
          matchedSkills: graphResult.matchedSkills,
          missingSkills: graphResult.missingSkills,
          experienceMatch: graphResult.experienceMatch,
          reasoning: graphResult.reasoning,
          strengths: graphResult.strengths,
          concerns: graphResult.concerns,
        } as any,
        screenedAt: new Date(),
      });

      res.json({
        applicationId: id,
        candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}`.trim() : 'Unknown',
        score: graphResult.finalScore,
        status: graphResult.status,
        parameterScores: graphResult.parameterScores,
        matchedSkills: graphResult.matchedSkills,
        missingSkills: graphResult.missingSkills,
        experienceMatch: graphResult.experienceMatch,
        reasoning: graphResult.reasoning,
        strengths: graphResult.strengths,
        concerns: graphResult.concerns,
      });
    } catch (error: any) {
      console.error("Error scoring application:", error);
      res.status(500).json({ message: error.message || "Failed to score application" });
    }
  });

  // Add recruiter score and comments (recruiter/company_admin)
  app.post('/api/applications/:id/recruiter-score', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { recruiterMatchScore, recruiterNotes, internalRating } = req.body;
      const companyId = req.user.companyId;
      
      const application = await storage.getApplication(id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      const job = await storage.getJob(application.jobId);
      if (!job || job.companyId !== companyId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updates: any = {
        updatedAt: new Date(),
      };

      if (recruiterMatchScore !== undefined) {
        updates.recruiterMatchScore = recruiterMatchScore;
      }
      if (recruiterNotes !== undefined) {
        updates.recruiterNotes = recruiterNotes;
      }
      if (internalRating !== undefined) {
        updates.internalRating = internalRating;
      }

      await storage.updateApplication(id, updates);

      res.json({
        message: "Recruiter score and comments saved successfully",
        applicationId: id,
        recruiterMatchScore: updates.recruiterMatchScore || application.recruiterMatchScore,
        recruiterNotes: updates.recruiterNotes || application.recruiterNotes,
        internalRating: updates.internalRating || application.internalRating,
      });
    } catch (error: any) {
      console.error("Error saving recruiter score:", error);
      res.status(500).json({ message: error.message || "Failed to save recruiter score" });
    }
  });

  // Helper function to send interview scheduling email
  const sendInterviewSchedulingEmail = async (candidateEmail: string, candidateName: string, jobTitle: string, interviewLink: string, companyName: string) => {
    try {
      // Get domain from environment or use default
      const appDomain = process.env.APP_DOMAIN || 'http://localhost:5000';
      const interviewUrl = `${appDomain}/interview-scheduling/${interviewLink}`;
      
      console.log(`[EMAIL] Sending interview scheduling email to ${candidateEmail}`);
      console.log(`Interview URL: ${interviewUrl}`);
      
      const emailBody = `
Dear ${candidateName},

Congratulations! You have been selected for an interview for the ${jobTitle} position at ${companyName}.

Please click the link below to schedule your interview time:
${interviewUrl}

You will be able to choose a convenient time slot for the interview. The interview will be conducted through our AI-powered interview platform.

If you have any questions, please don't hesitate to reach out to our recruiting team.

Best regards,
${companyName} Recruiting Team
      `.trim();

      // Try to send via Resend if API key is available
      if (process.env.RESEND_API_KEY) {
        try {
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);
          
          await resend.emails.send({
            to: candidateEmail,
            from: process.env.RESEND_FROM_EMAIL || 'noreply@rytefit.com',
            subject: `Interview Invitation - ${jobTitle} at ${companyName}`,
            text: emailBody,
            html: emailBody.replace(/\n/g, '<br>'),
          });
          
          console.log(`[EMAIL] Interview scheduling email sent successfully to ${candidateEmail}`);
          return true;
        } catch (resendError) {
          console.error('[EMAIL] Resend error:', resendError);
          // Fall through to logging
        }
      }
      
      // Fallback: just log the email (for development/testing)
      console.log('[EMAIL] Email would be sent (Resend not configured):');
      console.log(`To: ${candidateEmail}`);
      console.log(`Subject: Interview Invitation - ${jobTitle} at ${companyName}`);
      console.log(`Body:\n${emailBody}`);
      return true;
      
    } catch (error) {
      console.error('[EMAIL] Error in email sending:', error);
      return false;
    }
  };

  // Select candidate for interview (recruiter/company_admin)
  // FOR TESTING: Sends interview email directly, skipping scheduling step
  app.post('/api/applications/:id/select-interview', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const { id } = req.params;
      const companyId = req.user.companyId;
      
      const application = await storage.getApplication(id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      const job = await storage.getJob(application.jobId);
      if (!job || job.companyId !== companyId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Get company details for email
      const company = await storage.getCompany(companyId);
      const APP_DOMAIN = process.env.APP_DOMAIN || 'https://rytefit.com';

      console.log('[SELECT-INTERVIEW] Creating interview session and sending interview link email directly');
      
      // Create interview session immediately
      const interviewToken = randomUUID();
      
      const session = await storage.createInterviewSession({
        applicationId: application.id,
        userId: application.candidateId || null,
        jobId: application.jobId,
        interviewType: 'ai_async',
        status: 'scheduled',
        scheduledAt: new Date(),
        totalQuestions: 10,
      });

      console.log('[SELECT-INTERVIEW] Interview session created:', { sessionId: session?.id, interviewToken });

      // Store interview token in metadata
      if (session) {
        try {
          const currentMetadata = (session?.metadata as any) || {};
          const updatedMetadata = { ...currentMetadata, interviewToken };
          
          await db.update(interviewSessions)
            .set({ metadata: updatedMetadata })
            .where(eq(interviewSessions.id, session.id));
          
          console.log('[SELECT-INTERVIEW] Interview token stored in metadata:', { interviewToken, sessionId: session.id });
        } catch (metadataError) {
          console.warn('[SELECT-INTERVIEW] Warning: Could not store token in metadata:', metadataError);
        }
      }

      // Update application to scheduled status
      await storage.updateApplication(id, {
        status: 'scheduled',
        interviewScheduledAt: new Date(),
        updatedAt: new Date(),
      });

      console.log('[SELECT-INTERVIEW] Application updated to scheduled status');

      const interviewUrl = `${APP_DOMAIN}/public/interview/${interviewToken}`;
      
      // Send interview link email directly (for testing)
      if (application.candidateEmail && application.candidateName && company) {
        const emailBody = `
Hello ${application.candidateName},

Your interview for the position of ${job.title} at ${company.name} is ready!

Click the link below to start your interview:
${interviewUrl}

This link will be active for 30 days.

Best regards,
${company.name}`;

        try {
          if (process.env.RESEND_API_KEY) {
            const { Resend } = await import('resend');
            const resend = new Resend(process.env.RESEND_API_KEY);
            
            await resend.emails.send({
              from: 'noreply@rytefit.com',
              to: application.candidateEmail,
              subject: `Interview Ready - ${job.title} at ${company.name}`,
              html: emailBody.replace(/\n/g, '<br>'),
            });
            
            console.log(`[EMAIL] Interview link email sent successfully to ${application.candidateEmail}`);
          } else {
            console.log('[EMAIL] Interview link email (Resend not configured):');
            console.log(`To: ${application.candidateEmail}`);
            console.log(`Subject: Interview Ready - ${job.title} at ${company.name}`);
            console.log(`Body:\n${emailBody}`);
          }
        } catch (emailError) {
          console.error('[EMAIL] Error sending interview email:', emailError);
        }
      }
      
      res.json({
        message: "Interview session created and email sent to candidate",
        applicationId: id,
        status: 'scheduled',
        interviewUrl,
        sessionId: session?.id,
      });
    } catch (error: any) {
      console.error("Error selecting for interview:", error);
      res.status(500).json({ message: error.message || "Failed to select for interview" });
    }
  });

  // Multer middleware for resume uploads
  const resumeUpload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  // Bulk upload and parse resumes (recruiter/company_admin)
  app.post('/api/resumes/bulk-upload', isAuthenticated, isRecruiter, resumeUpload.array('resumes', 100), async (req: any, res) => {
    try {
      const { jobPostingId } = req.body;
      const companyId = req.user.companyId;
      const files = (req as any).files || [];

      if (!jobPostingId) {
        return res.status(400).json({ message: "Job posting ID is required" });
      }

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files provided" });
      }

      // Find the job by jobPostingId
      const jobsResult = await db.select()
        .from(jobs)
        .where(and(eq(jobs.jobPostingId, jobPostingId), eq(jobs.companyId, companyId)))
        .limit(1);

      if (!jobsResult || jobsResult.length === 0) {
        return res.status(404).json({ message: "Job not found" });
      }

      const job = jobsResult[0];
      const successfulUploads = [];
      const failedUploads = [];

      // Process each file
      for (const file of files) {
        const processingStartTime = Date.now();
        try {
          console.log(`\n========== STARTING RESUME PROCESSING ==========`);
          console.log(`[STEP 1] File received: ${file.originalname}`);
          console.log(`[STEP 1] File size: ${file.size} bytes, MIME type: ${file.mimetype}`);
          
          let resumeText = '';
          const originalName = file.originalname?.toLowerCase() || '';
          const mimeType = file.mimetype?.toLowerCase() || '';
          
          // Extract text based on file type
          if (originalName.endsWith('.pdf') || mimeType.includes('pdf')) {
            console.log(`[STEP 2] Detected PDF file - starting extraction`);
            
            // Handle PDF files using pdfjs-dist
            // Setup polyfills for Node.js
            if (typeof globalThis !== 'undefined' && !globalThis.DOMMatrix) {
              globalThis.DOMMatrix = class DOMMatrix {
                constructor(t?: any) {}
                static fromMatrix(m: any) { return new DOMMatrix(); }
                static fromFloat32Array(array: any) { return new DOMMatrix(); }
                static fromFloat64Array(array: any) { return new DOMMatrix(); }
              } as any;
            }
            if (typeof globalThis !== 'undefined' && !globalThis.ReadableStream) {
              globalThis.ReadableStream = class ReadableStream {
                constructor(t?: any) {}
              } as any;
            }

            try {
              console.log(`[STEP 2.1] Importing pdfjs-dist...`);
              const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.min.mjs');
              const pdf = (pdfjsLib as any).default || pdfjsLib;
              console.log(`[STEP 2.2] pdfjs-dist imported successfully`);
              
              console.log(`[STEP 2.3] Loading PDF document...`);
              const pdfDoc = await pdf.getDocument({ data: new Uint8Array(file.buffer) }).promise;
              console.log(`[STEP 2.4] PDF loaded - ${pdfDoc.numPages} pages detected`);
              
              console.log(`[STEP 2.5] Extracting text from pages...`);
              for (let i = 1; i <= Math.min(pdfDoc.numPages, 50); i++) {
                try {
                  const page = await pdfDoc.getPage(i);
                  const textContent = await page.getTextContent();
                  const pageText = (textContent.items as any[]).map((item: any) => item.str || '').join(' ');
                  resumeText += pageText + '\n';
                  console.log(`[STEP 2.5] Page ${i}: extracted ${pageText.length} characters`);
                } catch (e) {
                  console.warn(`[STEP 2.5] Warning: Could not extract page ${i} - ${(e as any).message}`);
                }
              }
              console.log(`[STEP 2.6] PDF extraction complete - ${resumeText.length} total characters`);
            } catch (pdfErr) {
              console.error(`[STEP 2] ERROR: PDF parsing failed:`, (pdfErr as any).message);
              throw pdfErr;
            }
            
            if (!resumeText.trim()) {
              console.log(`[STEP 2] WARNING: No text extracted, using placeholder`);
              resumeText = `[Resume PDF: ${file.originalname}]`;
            }
          } else if (originalName.endsWith('.docx') || mimeType.includes('word') || mimeType.includes('document')) {
            console.log(`[STEP 2] Detected Word (.docx) file - starting extraction`);
            
            // Handle Word documents (.docx) using Mammoth
            const fs = (await import('fs')).promises;
            const path = (await import('path')).default;
            const os = (await import('os')).default;
            const mammothLib = await import('mammoth');
            const mammoth = mammothLib.default || mammothLib;
            
            // Write file to temporary location
            const tempDir = os.tmpdir();
            const tempFilePath = path.join(tempDir, `resume-${Date.now()}-${Math.random()}.docx`);
            console.log(`[STEP 2.1] Writing to temp file: ${tempFilePath}`);
            await fs.writeFile(tempFilePath, file.buffer);
            console.log(`[STEP 2.2] Temp file written successfully`);
            
            try {
              console.log(`[STEP 2.3] Extracting text using Mammoth...`);
              const result = await mammoth.extractRawText({ path: tempFilePath });
              resumeText = result.value;
              console.log(`[STEP 2.4] Word extraction complete - ${resumeText.length} characters`);
            } catch (mammothErr) {
              console.error(`[STEP 2] ERROR: Mammoth extraction failed:`, (mammothErr as any).message);
              throw mammothErr;
            } finally {
              // Clean up temp file
              console.log(`[STEP 2.5] Cleaning up temp file...`);
              await fs.unlink(tempFilePath).catch(() => {});
            }
          } else {
            const err = `Unsupported file type: ${originalName}. Please upload PDF or Word (.docx) files.`;
            console.log(`[STEP 2] ERROR: ${err}`);
            throw new Error(err);
          }

          console.log(`[STEP 3] Text extraction complete: ${resumeText.length} characters`);
          console.log(`[STEP 3] First 200 chars: ${resumeText.substring(0, 200)}`);

          // Use OpenAI to parse resume and extract candidate info
          console.log(`[STEP 4] Initializing OpenAI client...`);
          const OpenAI = (await import('openai')).default;
          const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          console.log(`[STEP 4] OpenAI client ready`);

          console.log(`[STEP 5] Sending to GPT-4o for candidate data extraction...`);
          const parseResponse = await client.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: `You are an expert resume parser. Your task is to extract candidate contact information and professional details. Return ONLY a valid JSON object (no markdown, no code blocks, no extra text).

IMPORTANT EXTRACTION RULES:
1. firstName: First name of the candidate. Extract from the name at the top of the resume.
2. lastName: Last name/surname of the candidate. Extract from the name at the top of the resume.
3. email: Email address. Look for patterns like name@example.com or similar. Must contain @ symbol.
4. phone: Phone number in any format (including +, -, spaces, parentheses). Common formats: +1 (555) 123-4567, 555-123-4567, +91 98765 43210, etc.
5. location: City, state/country or full location. Extract from header, contact info, or after "Location:" or "Based in:".
6. skills: Array of professional skills mentioned in resume. Extract actual skills, not just headings.
7. experience: Summary of work experience and roles held.
8. education: Educational background, degrees, institutions.

JSON Structure (strict format):
{
  "firstName": "string or null",
  "lastName": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "location": "string or null",
  "skills": ["string"],
  "experience": "string or null",
  "education": "string or null"
}

Output ONLY the JSON object. No other text, no markdown, no code blocks.`
              },
              {
                role: 'user',
                content: `Extract candidate information from this resume:\n\n${resumeText}`
              }
            ],
            temperature: 0.3,
          });

          console.log(`[STEP 5] GPT-4o response received`);
          const parseContent = parseResponse.choices[0].message.content;
          console.log(`[STEP 5.1] Raw response (first 300 chars):`, parseContent?.substring(0, 300));
          
          // Strip markdown code blocks if present
          console.log(`[STEP 6] Parsing JSON response...`);
          let jsonString = parseContent || '';
          const hasMarkdown = jsonString.includes('```');
          console.log(`[STEP 6.1] Response has markdown: ${hasMarkdown}`);
          
          if (jsonString.includes('```json')) {
            jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            console.log('[STEP 6.2] Stripped markdown (```json variant)');
          } else if (jsonString.includes('```')) {
            jsonString = jsonString.replace(/```\n?/g, '');
            console.log('[STEP 6.2] Stripped markdown (``` variant)');
          }
          jsonString = jsonString.trim();
          console.log(`[STEP 6.3] JSON string after cleanup (first 300 chars):`, jsonString.substring(0, 300));
          
          console.log(`[STEP 6.4] Attempting to parse JSON...`);
          const candidateData = JSON.parse(jsonString);
          console.log(`[STEP 6.5] JSON parsed successfully`);
          console.log(`[STEP 6.6] Candidate data:`, JSON.stringify(candidateData));

          // Helper function to sanitize UTF-8 strings (remove null bytes and invalid sequences)
          const sanitizeUtf8 = (str: string): string => {
            if (!str) return '';
            // Remove null bytes and control characters that cause UTF-8 encoding issues
            return str
              .replace(/\0/g, '') // Remove null bytes
              .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove other control characters
              .replace(/\uFFFD/g, ''); // Remove replacement characters
          };

          // Create application entry
          const candidateName = `${candidateData.firstName || ''} ${candidateData.lastName || ''}`.trim() || 'Unknown Candidate';
          const candidateEmail = candidateData.email || `candidate${Date.now()}@example.com`;
          const candidatePhone = candidateData.phone || '';
          const candidateLocation = candidateData.location || '';
          const sanitizedResumeText = sanitizeUtf8(resumeText.substring(0, 10000));

          console.log(`[STEP 7] Creating application entry...`);
          console.log(`[STEP 7.1] Candidate name: ${candidateName}`);
          console.log(`[STEP 7.2] Candidate email: ${candidateEmail}`);
          console.log(`[STEP 7.3] Job ID: ${job.id}, Job Posting ID: ${jobPostingId}`);
          
          const application = await storage.createApplication({
            jobId: job.id,
            jobPostingId,
            candidateName,
            candidateEmail,
            candidatePhone,
            candidateLocation,
            status: 'applied',
            resumeText: sanitizedResumeText, // Store sanitized first 10k chars
          } as any);

          console.log(`[STEP 7.4] Application created successfully with ID: ${application.id}`);

          // Fetch scoring config for the company
          console.log(`[STEP 8] Fetching scoring parameters...`);
          const scoringConfigResult = await db.select()
            .from(scoringConfigs)
            .where(eq(scoringConfigs.companyId, companyId));
          
          // Use centralized default weights from shared constants
          const rawConfig = scoringConfigResult[0];
          
          // Helper to validate a weight value
          const isValidWeight = (val: any): boolean => {
            const num = Number(val);
            return Number.isFinite(num) && num >= 0 && num <= 100;
          };
          
          let weights: typeof DEFAULT_SCORING_WEIGHTS;
          let totalWeight: number;
          
          if (rawConfig) {
            // Validate each stored config field individually - hard fail with specific field info
            const fieldValidation = {
              skillsMatch: isValidWeight(rawConfig.skillsMatch),
              experienceLevel: isValidWeight(rawConfig.experienceLevel),
              education: isValidWeight(rawConfig.education),
              workHistoryRelevance: isValidWeight(rawConfig.workHistoryRelevance),
              keywords: isValidWeight(rawConfig.keywords),
              culturalFit: isValidWeight(rawConfig.culturalFit)
            };
            
            const invalidFields = Object.entries(fieldValidation)
              .filter(([_, valid]) => !valid)
              .map(([field]) => field);
            
            const storedValues = [
              rawConfig.skillsMatch, rawConfig.experienceLevel, rawConfig.education,
              rawConfig.workHistoryRelevance, rawConfig.keywords, rawConfig.culturalFit
            ];
            const storedTotal = storedValues.reduce((a, b) => Number(a) + Number(b), 0);
            
            if (invalidFields.length > 0 || Math.abs(storedTotal - 100) > 0.1) {
              console.error(`[Scoring] INVALID stored config detected - scoring halted`, {
                companyId,
                rawConfig,
                storedTotal,
                invalidFields,
                fieldValidation
              });
              const errorMsg = invalidFields.length > 0 
                ? `Invalid scoring fields: ${invalidFields.join(', ')}. Please update in Settings.`
                : `Scoring weights total ${storedTotal}% (must equal 100%). Please update in Settings.`;
              throw new Error(errorMsg);
            }
            
            // Config is valid - use stored values
            weights = {
              skillsMatch: Number(rawConfig.skillsMatch),
              experienceLevel: Number(rawConfig.experienceLevel),
              education: Number(rawConfig.education),
              workHistoryRelevance: Number(rawConfig.workHistoryRelevance),
              keywords: Number(rawConfig.keywords),
              culturalFit: Number(rawConfig.culturalFit)
            };
            totalWeight = storedTotal;
            console.log(`[Scoring] Using company config:`, { companyId, weights, totalWeight });
          } else {
            // No config exists - use defaults (valid case)
            weights = { ...DEFAULT_SCORING_WEIGHTS };
            totalWeight = DEFAULT_SCORING_WEIGHTS_SUM;
            console.log(`[Scoring] No config found, using defaults:`, { companyId, weights, totalWeight });
          }
          
          console.log(`[STEP 8.1] Weights: ${JSON.stringify(weights)}, Total: ${totalWeight}`);

          // Score the resume with detailed parameters
          console.log(`[STEP 8.2] Sending to GPT-4o for detailed scoring...`);
          const scoreResponse = await client.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: `You are an expert recruiter evaluating candidates against job requirements. Score the resume across these specific categories on a scale of 0-100 each:

1. **Skills Match** (Weight: ${weights.skillsMatch}%): Technical skills, soft skills, tools, and technologies mentioned in job description vs resume.
2. **Experience Level** (Weight: ${weights.experienceLevel}%): Years of experience, seniority level match, industry experience.
3. **Education** (Weight: ${weights.education}%): Educational background, degrees, certifications, relevance to role.
4. **Work History Relevance** (Weight: ${weights.workHistoryRelevance}%): Previous roles, companies, achievements, career progression.
5. **Keywords** (Weight: ${weights.keywords}%): Specific keywords from job description found in resume.
6. **Cultural Fit** (Weight: ${weights.culturalFit}%): Values, work style, team dynamics, company culture alignment (inferred from resume).

Return ONLY a valid JSON object with the following structure:
{
  "skillsScore": <0-100>,
  "experienceScore": <0-100>,
  "educationScore": <0-100>,
  "workHistoryScore": <0-100>,
  "keywordsScore": <0-100>,
  "culturalFitScore": <0-100>,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "strengths": ["strength1", "strength2"],
  "concerns": ["concern1", "concern2"],
  "reasoning": "Brief overall assessment"
}`
              },
              {
                role: 'user',
                content: `Job Description:\n${job.description}\n\nCandidate Resume:\n${resumeText.substring(0, 6000)}`
              }
            ],
            temperature: 0.3,
          });

          console.log(`[STEP 8.3] Scoring response received`);
          const scoreContent = scoreResponse.choices[0].message.content;
          console.log(`[STEP 8.4] Raw score response (first 400 chars):`, scoreContent?.substring(0, 400));
          
          // Strip markdown code blocks if present
          console.log('[STEP 8.5] Parsing score JSON...');
          let scoreJsonString = scoreContent || '';
          if (scoreJsonString.includes('```json')) {
            scoreJsonString = scoreJsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '');
          } else if (scoreJsonString.includes('```')) {
            scoreJsonString = scoreJsonString.replace(/```\n?/g, '');
          }
          scoreJsonString = scoreJsonString.trim();
          
          console.log(`[STEP 8.6] Parsing detailed score JSON...`);
          const scoreData = JSON.parse(scoreJsonString);
          console.log(`[STEP 8.7] Detailed scores:`, scoreData);

          // Calculate weighted final score based on scoring config weights
          const skillsScore = Math.min(100, Math.max(0, scoreData.skillsScore || 0));
          const experienceScore = Math.min(100, Math.max(0, scoreData.experienceScore || 0));
          const educationScore = Math.min(100, Math.max(0, scoreData.educationScore || 0));
          const workHistoryScore = Math.min(100, Math.max(0, scoreData.workHistoryScore || 0));
          const keywordsScore = Math.min(100, Math.max(0, scoreData.keywordsScore || 0));
          const culturalFitScore = Math.min(100, Math.max(0, scoreData.culturalFitScore || 0));

          // Calculate weighted score with proper normalization (weights defined earlier)
          const calculateScore = (w: typeof weights, total: number) => {
            return (skillsScore * w.skillsMatch +
               experienceScore * w.experienceLevel +
               educationScore * w.education +
               workHistoryScore * w.workHistoryRelevance +
               keywordsScore * w.keywords +
               culturalFitScore * w.culturalFit) / (total > 0 ? total : 100);
          };
          
          let rawScore = calculateScore(weights, totalWeight);
          
          // If primary score is invalid (due to GPT response issues), log and use 0
          if (!Number.isFinite(rawScore)) {
            console.warn(`[Scoring] Primary score invalid (GPT response issue), using 0`, { companyId, invalidScore: rawScore, weights, totalWeight });
            rawScore = 0;
          }
          
          // Final score clamped to 0-100, with absolute fallback to 0
          const aiScore = Number.isFinite(rawScore) ? Math.min(100, Math.max(0, Math.round(rawScore))) : 0;
          console.log(`[STEP 8.8] Weighted final score: ${aiScore} (raw: ${rawScore}, totalWeight: ${totalWeight})`);
          
          // Validate all scores before persistence
          const validateScores = () => {
            const scores = [skillsScore, experienceScore, educationScore, workHistoryScore, keywordsScore, culturalFitScore, aiScore];
            return scores.every(s => Number.isFinite(s) && s >= 0 && s <= 100);
          };
          
          if (!validateScores()) {
            console.error(`[STEP 8.8.1] WARNING: Some scores are invalid, check data integrity`);
          }
          
          // Log applied weights for auditing before persistence
          console.log(`[STEP 8.9] Applied scoring weights:`, { 
            companyId, 
            weights,
            totalWeight,
            usingDefaults: JSON.stringify(weights) === JSON.stringify(DEFAULT_SCORING_WEIGHTS)
          });

          // Prepare detailed screening data for storage
          const screeningData = {
            skillsScore,
            experienceScore,
            educationScore,
            workHistoryScore,
            keywordsScore,
            culturalFitScore,
            matchedSkills: scoreData.matchedSkills || [],
            missingSkills: scoreData.missingSkills || [],
            strengths: scoreData.strengths || [],
            concerns: scoreData.concerns || [],
            reasoning: scoreData.reasoning || '',
            scoringWeights: weights,
            evaluatedAt: new Date().toISOString()
          };

          // Invariant check: weights are guaranteed valid at this point (either from validated config or defaults)
          // This assertion documents the guarantee and will catch any logic errors
          const weightsSum = weights.skillsMatch + weights.experienceLevel + weights.education +
                            weights.workHistoryRelevance + weights.keywords + weights.culturalFit;
          if (Math.abs(weightsSum - 100) > 0.1) {
            console.error(`[Scoring] FATAL: Weight invariant violated after validation`, {
              companyId,
              applicationId: application.id,
              weights,
              weightsSum
            });
            throw new Error(`Internal error: scoring weights don't sum to 100% (${weightsSum}%)`);
          }
          
          // Validate and log before persistence
          console.info(`[Scoring] Persisting screening data`, { 
            companyId, 
            applicationId: application.id,
            finalScore: aiScore,
            weights,
            totalWeight,
            usingDefaults: !rawConfig
          });
          
          // Update application with detailed score and screening data
          console.log(`[STEP 9] Updating application with detailed scores...`);
          await storage.updateApplication(application.id, {
            aiScore,
            screeningScore: aiScore,
            screeningStatus: aiScore >= 60 ? 'passed' : 'failed',
            screeningData
          } as any);
          console.log(`[STEP 9.1] Application updated with detailed screening data - weights stored for audit: ${JSON.stringify(screeningData.scoringWeights)}`);

          // Insert into screening_results table for detailed tracking
          console.log(`[STEP 9.2] Saving to screening_results table...`);
          const recommendation = aiScore >= 70 ? 'strong_match' : aiScore >= 60 ? 'good_match' : aiScore >= 50 ? 'potential_match' : aiScore >= 30 ? 'weak_match' : 'no_match';
          try {
            await db.insert(screeningResults).values({
              applicationId: application.id,
              jobId: job.id,
              candidateId: null, // B2B system - candidates don't have user accounts
              overallScore: aiScore,
              recommendation,
              skillsMatchScore: skillsScore,
              experienceMatchScore: experienceScore,
              educationMatchScore: educationScore,
              culturalFitScore: culturalFitScore,
              skillsAnalysis: (scoreData.matchedSkills || []).map((skill: string) => ({
                requiredSkill: skill,
                candidateHas: true,
                matched: true
              })).concat((scoreData.missingSkills || []).map((skill: string) => ({
                requiredSkill: skill,
                candidateHas: false,
                matched: false
              }))),
              experienceAnalysis: {
                totalYears: candidateInfo?.yearsOfExperience || 0,
                relevantYears: candidateInfo?.yearsOfExperience || 0,
                industryMatch: experienceScore >= 60,
                roleMatch: experienceScore >= 50,
                seniorityMatch: true
              },
              strengths: screeningData.strengths || [],
              concerns: screeningData.concerns || [],
              keyHighlights: (screeningData.strengths || []).join('; '),
              aiSummary: screeningData.reasoning || `Candidate scored ${aiScore}% overall with ${skillsScore}% skills match.`,
              resumeQualityScore: keywordsScore,
              resumeCompleteness: (candidateInfo?.skills?.length > 0 ? 25 : 0) + 
                                  (candidateInfo?.education ? 25 : 0) + 
                                  (candidateInfo?.experience ? 25 : 0) + 
                                  (candidateEmail ? 25 : 0),
              screenedBy: 'ai',
              aiModel: 'gpt-4o',
              processingTime: Date.now() - processingStartTime
            }).onConflictDoUpdate({
              target: screeningResults.applicationId,
              set: {
                overallScore: aiScore,
                recommendation,
                skillsMatchScore: skillsScore,
                experienceMatchScore: experienceScore,
                educationMatchScore: educationScore,
                culturalFitScore: culturalFitScore,
                updatedAt: new Date()
              }
            });
            console.log(`[STEP 9.3] Screening result saved successfully for application ${application.id}`);
          } catch (screeningError: any) {
            console.error(`[STEP 9.3] Failed to save screening result:`, screeningError.message);
            // Don't fail the whole upload if screening_results insert fails
          }

          successfulUploads.push({
            candidateName,
            email: candidateEmail,
            score: aiScore,
            applicationId: application.id,
          });
          
          console.log(`========== RESUME PROCESSING COMPLETE ==========\n`);
        } catch (error: any) {
          console.error(`\n========== ERROR PROCESSING FILE ==========`);
          console.error(`File: ${file.originalname}`);
          console.error(`Error type: ${(error as any).constructor.name}`);
          console.error(`Error message: ${error.message}`);
          console.error(`Full error:`, error);
          console.error(`========== END ERROR ==========\n`);
          
          failedUploads.push({
            fileName: file.originalname,
            error: error.message || "Failed to process resume",
          });
        }
      }

      res.json({
        message: "Resume upload completed",
        successful: successfulUploads.length,
        failed: failedUploads.length,
        uploads: successfulUploads,
        errors: failedUploads.length > 0 ? failedUploads : undefined,
      });
    } catch (error: any) {
      console.error("Error uploading resumes:", error);
      res.status(500).json({ message: error.message || "Failed to upload resumes" });
    }
  });

  // Bulk send offers to multiple candidates (recruiter/company_admin)
  app.post('/api/applications/bulk/send-offers', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const { applicationIds, offeredSalary, offeredCurrency = 'INR', offeredBenefits, offerLetter } = req.body;
      const companyId = req.user.companyId;
      const recruiterId = req.user.id;
      
      console.log('Bulk send offers started:', { applicationIds, offeredSalary, companyId });
      
      if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
        return res.status(400).json({ message: "No applications selected" });
      }

      const results = [];
      const errors = [];

      for (const appId of applicationIds) {
        try {
          const application = await storage.getApplication(appId);
          console.log(`Processing application ${appId}:`, { status: application?.status });
          
          if (!application) {
            errors.push({ appId, error: "Application not found" });
            continue;
          }
          
          const job = await storage.getJob(application.jobId);
          if (!job || job.companyId !== companyId) {
            errors.push({ appId, error: "Unauthorized" });
            continue;
          }

          // Get all applications for this job with their evaluations to calculate ranking
          const jobApplications = await storage.getCompanyApplications(companyId);
          const jobApps = jobApplications.data.filter((app: any) => app.jobId === application.jobId);
          
          // Calculate ranking: sort by overall score (descending) and find candidate's rank
          const rankedApps = jobApps
            .filter((app: any) => app.evaluation?.overallScore)
            .sort((a: any, b: any) => (b.evaluation?.overallScore || 0) - (a.evaluation?.overallScore || 0));
          
          const candidateRank = rankedApps.findIndex((app: any) => app.id === appId) + 1 || null;
          const evaluation = application.evaluation;
          const rankingScore = evaluation?.overallScore || null;

          // Update application status with rank and score
          const updated = await storage.updateApplication(appId, {
            status: 'offer_extended',
            finalRank: candidateRank,
            rankingScore: rankingScore,
            updatedAt: new Date(),
          });
          console.log(`Updated application ${appId}:`, { newStatus: updated?.status, finalRank: candidateRank, rankingScore });

          // Create selection decision record
          await storage.createSelectionDecision({
            applicationId: appId,
            jobId: application.jobId,
            candidateId: application.candidateId,
            decision: 'selected',
            stage: 'offer',
            decisionMadeBy: recruiterId,
            decisionDate: new Date(),
            offerExtended: true,
            offerExtendedDate: new Date(),
            offeredSalary: offeredSalary || null,
            offeredCurrency,
            offeredBenefits: offeredBenefits || null,
            offerLetter: offerLetter || null,
          });

          results.push({
            applicationId: appId,
            status: 'success',
            offeredSalary,
            offeredCurrency,
          });
        } catch (error: any) {
          console.error(`Error processing application ${appId}:`, error);
          errors.push({ appId, error: error.message });
        }
      }

      console.log('Bulk send offers completed:', { successful: results.length, failed: errors.length });
      
      res.json({
        message: `Offers sent to ${results.length} candidates`,
        successful: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error: any) {
      console.error("Error sending bulk offers:", error);
      res.status(500).json({ message: error.message || "Failed to send bulk offers" });
    }
  });

  // Add single candidate to shortlist
  app.post('/api/shortlist/add', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const { applicationId, recommendation, notes } = req.body;
      const recruiterId = req.user.id;
      const companyId = req.user.companyId;

      if (!applicationId) {
        return res.status(400).json({ message: "Application ID is required" });
      }

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const job = await storage.getJob(application.jobId);
      if (!job || job.companyId !== companyId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Get all applications for this job to calculate ranking
      const jobApplications = await storage.getCompanyApplications(companyId);
      const jobApps = jobApplications.data.filter((app: any) => app.jobId === application.jobId);
      
      // Calculate ranking: sort by overall score (descending) and find candidate's rank
      const rankedApps = jobApps
        .filter((app: any) => app.evaluation?.overallScore)
        .sort((a: any, b: any) => (b.evaluation?.overallScore || 0) - (a.evaluation?.overallScore || 0));
      
      const candidateRank = rankedApps.findIndex((app: any) => app.id === applicationId) + 1 || null;
      const evaluation = application.evaluation;

      // Update application status and rank
      await storage.updateApplication(applicationId, {
        status: recommendation === 'selected' ? 'shortlisted' : 'on_hold',
        finalRank: candidateRank,
        rankingScore: evaluation?.overallScore || null,
        updatedAt: new Date(),
      });

      // Create or update selection decision record
      const decision = recommendation === 'selected' ? 'selected' : 'waitlisted';
      
      // Check if a decision already exists for this application at this stage
      const existingDecisions = await db.select()
        .from(selectionDecisions)
        .where(and(
          eq(selectionDecisions.applicationId, applicationId),
          eq(selectionDecisions.stage, 'shortlist')
        ));

      if (existingDecisions.length > 0) {
        // Update existing decision
        await db.update(selectionDecisions)
          .set({
            decision,
            reason: notes || null,
            decisionMadeBy: recruiterId,
            decisionDate: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(selectionDecisions.id, existingDecisions[0].id));
        console.log(`[SHORTLIST] Updated existing decision for ${application.candidateName}`);
      } else {
        // Create new selection decision - candidateId is nullable for B2B
        const selectionData: any = {
          applicationId,
          jobId: application.jobId,
          decision,
          stage: 'shortlist',
          round: 1,
          decisionMadeBy: recruiterId,
          decisionDate: new Date(),
          reason: notes || null,
        };
        
        // Only include candidateId if it exists
        if (application.candidateId) {
          selectionData.candidateId = application.candidateId;
        }
        
        const result = await db.insert(selectionDecisions).values(selectionData).returning();
        console.log(`[SHORTLIST] Created new decision for ${application.candidateName}:`, result[0]?.id);
      }

      console.log(`[SHORTLIST] Added ${application.candidateName} to shortlist:`, { decision, rank: candidateRank });

      res.json({
        message: "Candidate added to shortlist",
        applicationId,
        recommendation,
        rank: candidateRank,
      });
    } catch (error: any) {
      console.error("Error adding to shortlist:", error);
      res.status(500).json({ message: error.message || "Failed to add to shortlist" });
    }
  });

  // Bulk add candidates to shortlist
  app.post('/api/shortlist/bulk-add', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const { applicationIds, recommendation, notes } = req.body;
      const recruiterId = req.user.id;
      const companyId = req.user.companyId;

      if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
        return res.status(400).json({ message: "No applications selected" });
      }

      const results = [];
      const errors = [];

      for (const appId of applicationIds) {
        try {
          const application = await storage.getApplication(appId);
          if (!application) {
            errors.push({ appId, error: "Application not found" });
            continue;
          }

          const job = await storage.getJob(application.jobId);
          if (!job || job.companyId !== companyId) {
            errors.push({ appId, error: "Unauthorized" });
            continue;
          }

          // Get all applications for this job to calculate ranking
          const jobApplications = await storage.getCompanyApplications(companyId);
          const jobApps = jobApplications.data.filter((app: any) => app.jobId === application.jobId);
          
          // Calculate ranking
          const rankedApps = jobApps
            .filter((app: any) => app.evaluation?.overallScore)
            .sort((a: any, b: any) => (b.evaluation?.overallScore || 0) - (a.evaluation?.overallScore || 0));
          
          const candidateRank = rankedApps.findIndex((app: any) => app.id === appId) + 1 || null;
          const evaluation = application.evaluation;

          // Update application status and rank
          await storage.updateApplication(appId, {
            status: recommendation === 'selected' ? 'shortlisted' : 'on_hold',
            finalRank: candidateRank,
            rankingScore: evaluation?.overallScore || null,
            updatedAt: new Date(),
          });

          // Create selection decision record
          const decision = recommendation === 'selected' ? 'selected' : 'waitlisted';
          
          // Check if a decision already exists
          const existingDecisions = await db.select()
            .from(selectionDecisions)
            .where(and(
              eq(selectionDecisions.applicationId, appId),
              eq(selectionDecisions.stage, 'shortlist')
            ));

          if (existingDecisions.length > 0) {
            await db.update(selectionDecisions)
              .set({
                decision,
                reason: notes || null,
                decisionMadeBy: recruiterId,
                decisionDate: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(selectionDecisions.id, existingDecisions[0].id));
            console.log(`[SHORTLIST-BULK] Updated decision for ${application.candidateName}`);
          } else {
            // Create new selection decision - candidateId is nullable for B2B
            const selectionData: any = {
              applicationId: appId,
              jobId: application.jobId,
              decision,
              stage: 'shortlist',
              round: 1,
              decisionMadeBy: recruiterId,
              decisionDate: new Date(),
              reason: notes || null,
            };
            
            // Only include candidateId if it exists
            if (application.candidateId) {
              selectionData.candidateId = application.candidateId;
            }
            
            const insertResult = await db.insert(selectionDecisions).values(selectionData).returning();
            console.log(`[SHORTLIST-BULK] Created decision for ${application.candidateName}:`, insertResult[0]?.id);
          }

          results.push({
            applicationId: appId,
            status: 'success',
            rank: candidateRank,
          });
        } catch (error: any) {
          console.error(`Error processing application ${appId}:`, error);
          errors.push({ appId, error: error.message });
        }
      }

      console.log('[SHORTLIST] Bulk add completed:', { successful: results.length, failed: errors.length });

      res.json({
        message: `${results.length} candidates added to shortlist`,
        successful: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error: any) {
      console.error("Error in bulk shortlist:", error);
      res.status(500).json({ message: error.message || "Failed to add to shortlist" });
    }
  });

  // Get Selection Report for a job
  app.get('/api/selection-report/:jobId', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const { jobId } = req.params;
      const companyId = req.user.companyId;

      const job = await storage.getJob(jobId);
      if (!job || job.companyId !== companyId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Get all selection decisions for this job
      const decisions = await db.select({
        decision: selectionDecisions,
        application: applications,
      })
        .from(selectionDecisions)
        .leftJoin(applications, eq(selectionDecisions.applicationId, applications.id))
        .where(eq(selectionDecisions.jobId, jobId))
        .orderBy(desc(selectionDecisions.decisionDate));

      // Get screening results for applications
      const applicationIds = decisions.map(d => d.application?.id).filter(Boolean) as string[];
      const screeningData = applicationIds.length > 0 
        ? await db.select().from(screeningResults).where(inArray(screeningResults.applicationId, applicationIds))
        : [];

      // Get interview evaluations
      const evaluations = applicationIds.length > 0
        ? await db.select({
            evaluation: interviewEvaluations,
            session: interviewSessions,
          })
          .from(interviewEvaluations)
          .leftJoin(interviewSessions, eq(interviewEvaluations.sessionId, interviewSessions.id))
          .where(inArray(interviewSessions.applicationId, applicationIds))
        : [];

      // Build the report
      const report = decisions.map(d => {
        const screening = screeningData.find(s => s.applicationId === d.application?.id);
        const evaluation = evaluations.find(e => e.session?.applicationId === d.application?.id);
        
        return {
          candidateName: d.application?.candidateName || 'Unknown',
          candidateEmail: d.application?.candidateEmail || '',
          candidatePhone: d.application?.candidatePhone || '',
          jobTitle: job.title,
          jobPostingId: job.jobPostingId,
          resumeScreeningScore: screening?.overallScore || d.application?.screeningScore || null,
          interviewScore: evaluation?.evaluation?.overallScore || null,
          technicalScore: evaluation?.evaluation?.technicalScore || null,
          communicationScore: evaluation?.evaluation?.communicationScore || null,
          rank: d.application?.finalRank || null,
          recommendation: d.decision.decision === 'selected' ? 'Selected' : 
                         d.decision.decision === 'waitlisted' ? 'Maybe' : 
                         d.decision.decision,
          stage: d.decision.stage,
          decisionDate: d.decision.decisionDate,
          notes: d.decision.reason,
          applicationId: d.application?.id,
        };
      });

      res.json({
        job: {
          id: job.id,
          title: job.title,
          jobPostingId: job.jobPostingId,
          department: job.department,
          location: job.location,
          employmentType: job.employmentType,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
        },
        candidates: report,
        totalCandidates: report.length,
        selected: report.filter(r => r.recommendation === 'Selected').length,
        maybe: report.filter(r => r.recommendation === 'Maybe').length,
      });
    } catch (error: any) {
      console.error("Error fetching selection report:", error);
      res.status(500).json({ message: error.message || "Failed to fetch selection report" });
    }
  });

  // Get all selection reports (summary for all jobs)
  app.get('/api/selection-report', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const companyId = req.user.companyId;

      // Get all jobs with selection decisions
      const jobsWithDecisions = await db.selectDistinct({ jobId: selectionDecisions.jobId })
        .from(selectionDecisions)
        .leftJoin(jobs, eq(selectionDecisions.jobId, jobs.id))
        .where(eq(jobs.companyId, companyId));

      const reports = [];
      
      for (const { jobId } of jobsWithDecisions) {
        if (!jobId) continue;
        
        const job = await storage.getJob(jobId);
        if (!job) continue;

        const decisions = await db.select()
          .from(selectionDecisions)
          .where(eq(selectionDecisions.jobId, jobId));

        reports.push({
          jobId: job.id,
          jobTitle: job.title,
          jobPostingId: job.jobPostingId,
          department: job.department,
          totalShortlisted: decisions.length,
          selected: decisions.filter(d => d.decision === 'selected').length,
          waitlisted: decisions.filter(d => d.decision === 'waitlisted').length,
          lastUpdated: decisions.length > 0 
            ? Math.max(...decisions.map(d => new Date(d.decisionDate || d.createdAt || 0).getTime()))
            : null,
        });
      }

      res.json({
        reports,
        totalJobs: reports.length,
      });
    } catch (error: any) {
      console.error("Error fetching selection reports:", error);
      res.status(500).json({ message: error.message || "Failed to fetch selection reports" });
    }
  });

  // Get all interview sessions for the company (for reports)
  app.get('/api/interview-sessions', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const companyId = req.user.companyId;
      const { interviewSessions } = await import("@shared/schema");
      
      // Get all interview sessions for jobs belonging to this company
      const sessions = await db.select({
        id: interviewSessions.id,
        applicationId: interviewSessions.applicationId,
        jobId: interviewSessions.jobId,
        status: interviewSessions.status,
        startedAt: interviewSessions.startedAt,
        completedAt: interviewSessions.completedAt,
      })
        .from(interviewSessions)
        .leftJoin(jobs, eq(interviewSessions.jobId, jobs.id))
        .where(eq(jobs.companyId, companyId));
      
      res.json({ data: sessions });
    } catch (error: any) {
      console.error("Error fetching interview sessions:", error);
      res.status(500).json({ message: error.message || "Failed to fetch interview sessions" });
    }
  });

  // Get all selection decisions for the company (for reports)
  app.get('/api/selection-decisions', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const companyId = req.user.companyId;
      
      // Get all selection decisions for jobs belonging to this company
      const decisions = await db.select()
        .from(selectionDecisions)
        .leftJoin(jobs, eq(selectionDecisions.jobId, jobs.id))
        .where(eq(jobs.companyId, companyId));
      
      // Flatten the response to return just decision data with jobId
      const flatDecisions = decisions.map(d => ({
        ...d.selection_decisions,
        jobId: d.selection_decisions.jobId
      }));
      
      res.json(flatDecisions);
    } catch (error: any) {
      console.error("Error fetching selection decisions:", error);
      res.status(500).json({ message: error.message || "Failed to fetch selection decisions" });
    }
  });

  // Send selection report via email
  app.post('/api/selection-report/send-email', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const { recipientEmail, jobId } = req.body;
      const companyId = req.user.companyId;

      if (!recipientEmail || !jobId) {
        return res.status(400).json({ message: "Recipient email and job ID are required" });
      }

      const job = await storage.getJob(jobId);
      if (!job || job.companyId !== companyId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Get selection decisions for this job
      const decisions = await db.select({
        decision: selectionDecisions,
        application: applications,
      })
        .from(selectionDecisions)
        .leftJoin(applications, eq(selectionDecisions.applicationId, applications.id))
        .where(eq(selectionDecisions.jobId, jobId))
        .orderBy(desc(selectionDecisions.decisionDate));

      // Build email content
      const selectedCandidates = decisions.filter(d => d.decision.decision === 'selected');
      const maybeCandidates = decisions.filter(d => d.decision.decision === 'waitlisted');

      let emailContent = `
        <h2>Selection Report - ${job.title}</h2>
        <p><strong>Job ID:</strong> ${job.jobPostingId}</p>
        <p><strong>Department:</strong> ${job.department || 'N/A'}</p>
        <p><strong>Location:</strong> ${job.location || 'N/A'}</p>
        
        <h3>Summary</h3>
        <ul>
          <li>Total Shortlisted: ${decisions.length}</li>
          <li>Selected: ${selectedCandidates.length}</li>
          <li>Maybe: ${maybeCandidates.length}</li>
        </ul>
        
        <h3>Selected Candidates</h3>
        <table border="1" cellpadding="5" style="border-collapse: collapse;">
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Recommendation</th>
          </tr>
          ${selectedCandidates.map(d => `
            <tr>
              <td>${d.application?.finalRank || '-'}</td>
              <td>${d.application?.candidateName || 'Unknown'}</td>
              <td>${d.application?.candidateEmail || '-'}</td>
              <td>${d.application?.candidatePhone || '-'}</td>
              <td>Selected</td>
            </tr>
          `).join('')}
        </table>
        
        ${maybeCandidates.length > 0 ? `
          <h3>Maybe Candidates</h3>
          <table border="1" cellpadding="5" style="border-collapse: collapse;">
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Recommendation</th>
            </tr>
            ${maybeCandidates.map(d => `
              <tr>
                <td>${d.application?.finalRank || '-'}</td>
                <td>${d.application?.candidateName || 'Unknown'}</td>
                <td>${d.application?.candidateEmail || '-'}</td>
                <td>${d.application?.candidatePhone || '-'}</td>
                <td>Maybe</td>
              </tr>
            `).join('')}
          </table>
        ` : ''}
        
        <p style="margin-top: 20px; color: #666;">
          This report was generated by RyteFit on ${new Date().toLocaleDateString('en-IN')}.
        </p>
      `;

      // Send email using Resend
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'noreply@rytefit.com',
        to: recipientEmail,
        subject: `Selection Report - ${job.title} (${job.jobPostingId})`,
        html: emailContent,
      });

      console.log(`[EMAIL] Selection report sent to ${recipientEmail} for job ${job.jobPostingId}`);

      res.json({ message: "Selection report sent successfully" });
    } catch (error: any) {
      console.error("Error sending selection report email:", error);
      res.status(500).json({ message: error.message || "Failed to send email" });
    }
  });

  // Send generic report via email (Job Summary or Job Details)
  app.post('/api/reports/send-email', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const { recipientEmail, reportType, reportData, jobPostingId } = req.body;
      const companyId = req.user.companyId;

      if (!recipientEmail || !reportType || !reportData) {
        return res.status(400).json({ message: "Recipient email, report type, and report data are required" });
      }

      let emailContent = '';
      let subject = '';

      if (reportType === 'job_summary') {
        subject = `Job Summary Report - RyteFit`;
        emailContent = `
          <h2>Job Summary Report</h2>
          <p>Generated on: ${new Date().toLocaleDateString('en-IN')}</p>
          
          <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%;">
            <tr style="background-color: #f3f4f6;">
              <th>Job ID</th>
              <th>Job Title</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Applied</th>
              <th>Interviewed</th>
              <th>Selected</th>
              <th>Platforms</th>
            </tr>
            ${reportData.map((job: any) => `
              <tr>
                <td>${job.jobPostingId}</td>
                <td>${job.title}</td>
                <td>${job.startDate ? new Date(job.startDate).toLocaleDateString('en-IN') : '-'}</td>
                <td>${job.endDate ? new Date(job.endDate).toLocaleDateString('en-IN') : '-'}</td>
                <td style="text-align: center;">${job.candidatesApplied}</td>
                <td style="text-align: center;">${job.candidatesInterviewed}</td>
                <td style="text-align: center;">${job.candidatesSelected}</td>
                <td>${job.platforms?.join(', ') || 'RyteFit'}</td>
              </tr>
            `).join('')}
          </table>
          
          <p style="margin-top: 20px; color: #666;">
            This report was generated by RyteFit on ${new Date().toLocaleDateString('en-IN')}.
          </p>
        `;
      } else if (reportType === 'job_details') {
        subject = `Job Details Report - ${jobPostingId || 'RyteFit'}`;
        emailContent = `
          <h2>Job Details Report${jobPostingId ? ` - ${jobPostingId}` : ''}</h2>
          <p>Generated on: ${new Date().toLocaleDateString('en-IN')}</p>
          
          <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%;">
            <tr style="background-color: #f3f4f6;">
              <th>Candidate Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Interview Date</th>
              <th>Questions Asked</th>
              <th>Questions Answered</th>
              <th>Wrong</th>
              <th>AI Ranking</th>
              <th>Our Ranking</th>
              <th>Status</th>
            </tr>
            ${reportData.map((c: any) => `
              <tr>
                <td>${c.candidateName}</td>
                <td>${c.email}</td>
                <td>${c.phone}</td>
                <td>${c.interviewDate}</td>
                <td style="text-align: center;">${c.questionsAsked}</td>
                <td style="text-align: center;">${c.questionsAnswered}</td>
                <td style="text-align: center;">${c.wrongQuestions}</td>
                <td style="text-align: center;">#${c.aiRanking}</td>
                <td style="text-align: center;">#${c.ourRanking}</td>
                <td>${c.status}</td>
              </tr>
            `).join('')}
          </table>
          
          <p style="margin-top: 20px; color: #666;">
            This report was generated by RyteFit on ${new Date().toLocaleDateString('en-IN')}.
          </p>
        `;
      } else {
        return res.status(400).json({ message: "Invalid report type" });
      }

      // Send email using Resend
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'noreply@rytefit.com',
        to: recipientEmail,
        subject: subject,
        html: emailContent,
      });

      console.log(`[EMAIL] ${reportType} report sent to ${recipientEmail}`);

      res.json({ message: "Report sent successfully" });
    } catch (error: any) {
      console.error("Error sending report email:", error);
      res.status(500).json({ message: error.message || "Failed to send email" });
    }
  });

  // Make offer to candidate (recruiter/company_admin)
  app.post('/api/applications/:id/offer', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { offeredSalary, offeredCurrency = 'INR', offeredBenefits, offerLetter } = req.body;
      const companyId = req.user.companyId;
      const recruiterId = req.user.id;
      
      const application = await storage.getApplication(id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      const job = await storage.getJob(application.jobId);
      if (!job || job.companyId !== companyId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Get all applications for this job with their evaluations to calculate ranking
      const jobApplications = await storage.getCompanyApplications(companyId);
      const jobApps = jobApplications.data.filter((app: any) => app.jobId === application.jobId);
      
      // Calculate ranking: sort by overall score (descending) and find candidate's rank
      const rankedApps = jobApps
        .filter((app: any) => app.evaluation?.overallScore)
        .sort((a: any, b: any) => (b.evaluation?.overallScore || 0) - (a.evaluation?.overallScore || 0));
      
      const candidateRank = rankedApps.findIndex((app: any) => app.id === id) + 1 || null;
      const evaluation = application.evaluation;
      const rankingScore = evaluation?.overallScore || null;

      // Update application status with rank and score
      await storage.updateApplication(id, {
        status: 'offer_extended',
        finalRank: candidateRank,
        rankingScore: rankingScore,
        updatedAt: new Date(),
      });

      // Create selection decision record
      await storage.createSelectionDecision({
        applicationId: id,
        jobId: application.jobId,
        candidateId: application.candidateId,
        decision: 'selected',
        stage: 'offer',
        decisionMadeBy: recruiterId,
        decisionDate: new Date(),
        offerExtended: true,
        offerExtendedDate: new Date(),
        offeredSalary: offeredSalary || null,
        offeredCurrency,
        offeredBenefits: offeredBenefits || null,
        offerLetter: offerLetter || null,
      });

      res.json({
        message: "Offer extended successfully",
        applicationId: id,
        status: 'offer_extended',
        offeredSalary,
        offeredCurrency,
      });
    } catch (error: any) {
      console.error("Error making offer:", error);
      res.status(500).json({ message: error.message || "Failed to make offer" });
    }
  });

  // Reject candidate (recruiter/company_admin)
  app.post('/api/applications/:id/reject', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;
      const companyId = req.user.companyId;
      const recruiterId = req.user.id;
      
      const application = await storage.getApplication(id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      const job = await storage.getJob(application.jobId);
      if (!job || job.companyId !== companyId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updates: any = {
        status: 'rejected',
        updatedAt: new Date(),
      };

      // Store rejection reason in recruiter notes if provided
      if (rejectionReason) {
        updates.recruiterNotes = rejectionReason;
      }

      await storage.updateApplication(id, updates);

      // Create selection decision record for rejection
      await storage.createSelectionDecision({
        applicationId: id,
        jobId: application.jobId,
        candidateId: application.candidateId,
        decision: 'rejected',
        stage: 'screening',
        decisionMadeBy: recruiterId,
        decisionDate: new Date(),
        reason: rejectionReason || null,
      });

      res.json({
        message: "Candidate rejected",
        applicationId: id,
        status: 'rejected',
      });
    } catch (error: any) {
      console.error("Error rejecting candidate:", error);
      res.status(500).json({ message: error.message || "Failed to reject candidate" });
    }
  });

  // Delete candidate application (recruiter/company_admin)
  app.delete('/api/applications/:id', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const { id } = req.params;
      const companyId = req.user.companyId;
      
      const application = await storage.getApplication(id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      const job = await storage.getJob(application.jobId);
      if (!job || job.companyId !== companyId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await storage.deleteApplication(id);

      res.json({
        message: "Candidate application deleted successfully",
        applicationId: id,
      });
    } catch (error: any) {
      console.error("Error deleting application:", error);
      res.status(500).json({ message: error.message || "Failed to delete application" });
    }
  });

  // Batch score all unscored applications for a job (recruiter/company_admin)
  app.post('/api/jobs/:jobId/score-batch', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const { jobId } = req.params;
      const companyId = req.user.companyId;
      
      const job = await storage.getJob(jobId);
      if (!job || job.companyId !== companyId) {
        return res.status(404).json({ message: "Job not found" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ message: "OpenAI API not configured" });
      }

      // Get all applications for this job that haven't been scored
      const allAppsForJob = await storage.getJobApplications(jobId);
      const unscoredApps = allAppsForJob.filter((app: any) => !app.screeningScore || app.screeningScore === 0);
      
      if (unscoredApps.length === 0) {
        return res.json({ 
          message: "No unscored applications found",
          scored: 0,
          total: allAppsForJob.length,
        });
      }

      const { ResumeScreenerAgent } = await import('./agents/resume-screener');
      const screener = new ResumeScreenerAgent();

      const scoredResults = [];
      const errors = [];

      // Score each application sequentially to avoid rate limits
      for (const application of unscoredApps) {
        try {
          const [resume] = await db
            .select()
            .from(resumes)
            .where(eq(resumes.applicationId, application.id));
          
          const resumeText = resume?.rawText || 'Resume data not available';
          
          const screeningResult = await screener.screenResume({
            applicationId: application.id,
            resumeText,
            jobDescription: job.description || '',
            requiredSkills: job.extractedSkills || [],
            companyId,
          });

          await storage.updateApplication(application.id, {
            screeningScore: screeningResult.score,
            screeningStatus: screeningResult.score >= 75 ? 'passed' : screeningResult.score >= 50 ? 'pending' : 'failed',
            screeningData: {
              matchedSkills: screeningResult.matchedSkills,
              missingSkills: screeningResult.missingSkills,
              experienceMatch: screeningResult.experienceMatch,
              reasoning: screeningResult.reasoning,
              strengths: screeningResult.strengths,
              concerns: screeningResult.concerns,
            } as any,
            screenedAt: new Date(),
          });

          scoredResults.push({
            applicationId: application.id,
            candidateName: application.candidateName,
            score: screeningResult.score,
            status: screeningResult.score >= 75 ? 'passed' : screeningResult.score >= 50 ? 'pending' : 'failed',
          });
        } catch (error: any) {
          errors.push({
            applicationId: application.id,
            candidateName: application.candidateName,
            error: error.message,
          });
        }
      }

      res.json({
        message: `Scored ${scoredResults.length} applications successfully`,
        scored: scoredResults.length,
        total: allAppsForJob.length,
        results: scoredResults,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error: any) {
      console.error("Error batch scoring applications:", error);
      res.status(500).json({ message: error.message || "Failed to batch score applications" });
    }
  });

  // ==================== INTERVIEW MANAGEMENT ====================

  // Schedule interview for application
  app.post('/api/applications/:applicationId/schedule-interview', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const { applicationId } = req.params;
      const { scheduledAt, interviewType } = req.body;
      
      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      const session = await storage.createInterviewSession({
        applicationId,
        userId: application.candidateId,
        jobId: application.jobId,
        interviewType: interviewType || 'ai_async',
        status: 'scheduled',
        scheduledAt: new Date(scheduledAt),
      });
      
      // Update application with interview link if not already set
      let interviewLink = application.interviewLink;
      if (!interviewLink) {
        const { generateInterviewLink } = await import('./utils/interviewLink');
        interviewLink = generateInterviewLink(applicationId);
      }

      await storage.updateApplication(applicationId, {
        status: 'interview_scheduled',
        interviewLink,
      });
      
      // Increment interviews scheduled count
      await db.update(jobs).set({
        interviewsScheduled: sql`${jobs.interviewsScheduled} + 1`
      }).where(eq(jobs.id, application.jobId));
      
      // Get job and company details for email
      const job = await storage.getJob(application.jobId);
      const company = job ? await storage.getCompany(job.companyId) : null;
      
      // Send interview scheduling email
      if (application.candidateEmail && application.candidateName && job && company) {
        await sendInterviewSchedulingEmail(
          application.candidateEmail,
          application.candidateName,
          job.title,
          interviewLink,
          company.name
        );
      }
      
      // Notify candidate
      await storage.createNotification({
        userId: application.candidateId,
        type: 'interview_scheduled',
        title: 'Interview Scheduled',
        message: `Your interview has been scheduled. Check your email for the interview link.`,
        jobId: application.jobId,
        applicationId: application.id,
      });
      
      res.status(201).json(session);
    } catch (error) {
      console.error("Error scheduling interview:", error);
      res.status(500).json({ message: "Failed to schedule interview" });
    }
  });

  // Candidate schedules their interview time - creates or updates interview session
  app.post('/api/applications/:id/my-schedule-interview', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { scheduledAt } = req.body;
      const userId = (req.user as any).id;
      
      const application = await storage.getApplication(id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Verify this is the candidate's application
      if (application.candidateId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Get job details for interview
      const job = await storage.getJob(application.jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Check if interview session already exists for this application
      const { interviewSessions } = await import("@shared/schema");
      const existingSessions = await db
        .select()
        .from(interviewSessions)
        .where(eq(interviewSessions.applicationId, id))
        .limit(1);
      
      let session;
      if (existingSessions.length > 0) {
        // Update existing session
        session = await storage.updateInterviewSession(existingSessions[0].id, {
          scheduledAt: new Date(scheduledAt),
          status: 'scheduled',
        });
      } else {
        // Create new interview session with candidate's chosen time
        session = await storage.createInterviewSession({
          applicationId: id,
          userId,
          jobId: application.jobId,
          interviewType: 'ai_async',
          status: 'scheduled',
          scheduledAt: new Date(scheduledAt),
        });
      }
      
      // Update application
      await storage.updateApplication(id, {
        interviewScheduledAt: new Date(scheduledAt),
        status: 'interview_scheduled',
      });
      
      res.status(200).json(session);
    } catch (error) {
      console.error("Error scheduling interview time:", error);
      res.status(500).json({ message: "Failed to schedule interview" });
    }
  });


  // Get interview session
  app.get('/api/interviews/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const session = await storage.getInterviewSession(id);
      
      if (!session) {
        return res.status(404).json({ message: "Interview not found" });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error fetching interview:", error);
      res.status(500).json({ message: "Failed to fetch interview" });
    }
  });

  // Update interview session (for progress tracking)
  app.patch('/api/interviews/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updated = await storage.updateInterviewSession(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating interview:", error);
      res.status(500).json({ message: "Failed to update interview" });
    }
  });

  // Get candidate's interviews with full details (job, company, recruiter)
  app.get('/api/interviews/my/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const userRole = (req.user as any).role;
      
      if (userRole !== 'candidate') {
        return res.status(403).json({ message: "Only candidates can access this endpoint" });
      }
      
      const interviews = await storage.getCandidateInterviews(userId);
      res.json(interviews);
    } catch (error) {
      console.error("Error fetching candidate interviews:", error);
      res.status(500).json({ message: "Failed to fetch interviews" });
    }
  });

  // Get or create interview session for an application
  app.get('/api/interviews/application/:applicationId', isAuthenticated, async (req: any, res) => {
    try {
      const { applicationId } = req.params;
      const userId = (req.user as any).id;
      const userRole = (req.user as any).role;
      
      // Get the application
      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Only the candidate who owns the application can access this
      if (userRole === 'candidate' && application.candidateId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Check if interview session already exists
      const { interviewSessions } = await import("@shared/schema");
      const existingSessions = await db
        .select()
        .from(interviewSessions)
        .where(eq(interviewSessions.applicationId, applicationId))
        .limit(1);
      
      if (existingSessions.length > 0) {
        return res.json(existingSessions[0]);
      }
      
      // If no session exists, create one
      const newSession = await storage.createInterviewSession({
        applicationId,
        jobId: application.jobId,
        status: 'scheduled',
        startedAt: null,
        completedAt: null,
      });
      
      res.json(newSession);
    } catch (error) {
      console.error("Error getting/creating interview session:", error);
      res.status(500).json({ message: "Failed to get interview session" });
    }
  });

  // Get interview evaluation by ID
  // Get video metadata for application (for recruiter viewing)
  app.get('/api/applications/:applicationId/interview-video', isAuthenticated, async (req: any, res) => {
    try {
      const { applicationId } = req.params;

      // Find interview session for this application
      const sessions = await db.select()
        .from(interviewSessions)
        .where(eq(interviewSessions.applicationId, applicationId));

      if (sessions.length === 0) {
        return res.status(404).json({ message: "No interview session found" });
      }

      const session = sessions[0];
      const metadata = (session.metadata as any) || {};
      const videoPath = session.videoPath;
      
      // Check if video exists (local or S3)
      let hasVideo = false;
      let videoUrl: string | null = null;
      
      if (videoPath) {
        const meta = await getVideoMeta(videoPath);
        hasVideo = meta.exists;
        if (hasVideo) {
          console.log(`[VIDEO-FETCH] Video available (${meta.isS3 ? 'S3' : 'local'}):`, videoPath);
          videoUrl = await getVideoStreamUrl(videoPath, applicationId);
        }
      }

      res.json({
        sessionId: session.id,
        status: session.status,
        completedAt: session.completedAt,
        hasVideo: hasVideo,
        videoFileName: videoPath ? path.basename(videoPath.replace('s3:', '')) : null,
        videoUploadedAt: session.completedAt,
        videoUrl,
        answers: metadata.answers || [],
      });
    } catch (error: any) {
      console.error("Error fetching interview video:", error);
      res.status(500).json({ message: "Failed to fetch interview video" });
    }
  });

  // Stream video file directly for playback
  app.get('/api/applications/:applicationId/interview-video/stream', isAuthenticated, async (req: any, res) => {
    try {
      const { applicationId } = req.params;

      // Find interview session for this application
      const sessions = await db.select()
        .from(interviewSessions)
        .where(eq(interviewSessions.applicationId, applicationId));

      if (sessions.length === 0) {
        return res.status(404).json({ message: "No interview session found" });
      }

      const session = sessions[0];
      const videoPath = session.videoPath;
      
      if (!videoPath) {
        return res.status(404).json({ message: "No video available" });
      }

      // In PROD mode, S3 paths are served via pre-signed URLs (redirect)
      // In TEST mode, stream directly from local disk
      if (videoPath.startsWith("s3:")) {
        const signedUrl = await getVideoStreamUrl(videoPath, applicationId as string);
        if (!signedUrl) {
          return res.status(404).json({ message: "Video not accessible" });
        }
        return res.redirect(302, signedUrl);
      }

      streamLocalVideo(videoPath, req.headers.range, res);
    } catch (error: any) {
      console.error("Error streaming interview video:", error);
      res.status(500).json({ message: "Failed to stream interview video" });
    }
  });

  // Get all interview evaluations for company (for reports)
  app.get('/api/interview-evaluations', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const companyId = req.user.companyId;
      
      // Get all evaluations for jobs belonging to this company
      const evaluations = await db.select({
        id: interviewEvaluations.id,
        sessionId: interviewEvaluations.sessionId,
        overallScore: interviewEvaluations.overallScore,
        technicalScore: interviewEvaluations.technicalScore,
        communicationScore: interviewEvaluations.communicationScore,
        problemSolvingScore: interviewEvaluations.problemSolvingScore,
        confidenceScore: interviewEvaluations.confidenceScore,
        recommendation: interviewEvaluations.recommendation,
        applicationId: interviewSessions.applicationId,
        jobId: interviewSessions.jobId,
      })
        .from(interviewEvaluations)
        .leftJoin(interviewSessions, eq(interviewEvaluations.sessionId, interviewSessions.id))
        .leftJoin(jobs, eq(interviewSessions.jobId, jobs.id))
        .where(eq(jobs.companyId, companyId));
      
      // Get question counts from interview_messages for each session
      const sessionIds = evaluations.map(e => e.sessionId).filter(Boolean) as string[];
      
      let messageCounts: Record<string, { questionsAsked: number; questionsAnswered: number }> = {};
      
      if (sessionIds.length > 0) {
        const messages = await db.select({
          sessionId: interviewMessages.sessionId,
          role: interviewMessages.role,
        })
          .from(interviewMessages)
          .where(inArray(interviewMessages.sessionId, sessionIds));
        
        // Count questions and answers per session
        messages.forEach(msg => {
          if (!msg.sessionId) return;
          if (!messageCounts[msg.sessionId]) {
            messageCounts[msg.sessionId] = { questionsAsked: 0, questionsAnswered: 0 };
          }
          if (msg.role === 'interviewer') {
            messageCounts[msg.sessionId].questionsAsked++;
          } else if (msg.role === 'candidate') {
            messageCounts[msg.sessionId].questionsAnswered++;
          }
        });
      }
      
      // Build response with question counts
      const data = evaluations.map(ev => ({
        ...ev,
        questionsAsked: messageCounts[ev.sessionId || '']?.questionsAsked || 0,
        questionsAnswered: messageCounts[ev.sessionId || '']?.questionsAnswered || 0,
        wrongQuestions: Math.max(0, (messageCounts[ev.sessionId || '']?.questionsAsked || 0) - (messageCounts[ev.sessionId || '']?.questionsAnswered || 0)),
      }));
      
      res.json({
        data,
        total: data.length,
        limit: data.length,
        offset: 0,
      });
    } catch (error: any) {
      console.error("Error fetching interview evaluations:", error);
      res.status(500).json({ message: error.message || "Failed to fetch interview evaluations" });
    }
  });

  app.get('/api/interview-evaluations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { interviewEvaluations, interviewSessions } = await import("@shared/schema");
      
      const evaluation = await db
        .select()
        .from(interviewEvaluations)
        .where(eq(interviewEvaluations.id, id))
        .leftJoin(interviewSessions, eq(interviewEvaluations.sessionId, interviewSessions.id))
        .leftJoin(applications, eq(interviewSessions.applicationId, applications.id))
        .leftJoin(users, eq(applications.candidateId, users.id))
        .leftJoin(jobs, eq(applications.jobId, jobs.id))
        .limit(1);
      
      if (!evaluation || evaluation.length === 0) {
        return res.status(404).json({ message: "Evaluation not found" });
      }
      
      const result = {
        ...evaluation[0].interview_evaluations,
        session: {
          ...evaluation[0].interview_sessions,
          application: {
            ...evaluation[0].applications,
            candidate: evaluation[0].users ? {
              id: evaluation[0].users.id,
              firstName: evaluation[0].users.firstName,
              lastName: evaluation[0].users.lastName,
              email: evaluation[0].users.email,
            } : null,
            job: evaluation[0].jobs ? {
              id: evaluation[0].jobs.id,
              title: evaluation[0].jobs.title,
              department: evaluation[0].jobs.department,
              experienceLevel: evaluation[0].jobs.experienceLevel,
            } : null,
          },
        },
      };
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching interview evaluation:", error);
      res.status(500).json({ message: "Failed to fetch interview evaluation" });
    }
  });

  // ==================== COMPANY STATS ====================

  app.get('/api/company/stats', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: "No company associated with this user" });
      }
      
      const stats = await storage.getCompanyStats(companyId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching company stats:", error);
      res.status(500).json({ message: "Failed to fetch company stats" });
    }
  });

  // ==================== ADMIN ENDPOINTS ====================

  // Middleware for admin-only routes
  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Get all users (admin only)
  app.get('/api/users', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const usersResponse = await storage.getAllUsers();
      const safeUsers = usersResponse.data.map(({ passwordHash, emailVerificationToken, ...user }) => user);
      res.json({
        ...usersResponse,
        data: safeUsers,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get platform stats (admin only)
  app.get('/api/admin/stats', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getPlatformStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching platform stats:", error);
      res.status(500).json({ message: "Failed to fetch platform stats" });
    }
  });

  // ==================== WORKFLOW MANAGEMENT ====================

  // Get all workflow runs for a specific job (recruiter/admin)
  app.get('/api/workflows/job/:jobId', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const { jobId } = req.params;
      
      const runs = await db
        .select({
          id: workflowRuns.id,
          applicationId: workflowRuns.applicationId,
          currentState: workflowRuns.currentState,
          status: workflowRuns.status,
          startedAt: workflowRuns.startedAt,
          completedAt: workflowRuns.completedAt,
          candidateName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
          jobTitle: jobs.title,
        })
        .from(workflowRuns)
        .innerJoin(applications, eq(workflowRuns.applicationId, applications.id))
        .innerJoin(users, eq(applications.candidateId, users.id))
        .innerJoin(jobs, eq(applications.jobId, jobs.id))
        .where(eq(applications.jobId, jobId))
        .orderBy(desc(workflowRuns.startedAt));
      
      res.json(runs);
    } catch (error) {
      console.error("Error fetching workflow runs:", error);
      res.status(500).json({ message: "Failed to fetch workflow runs" });
    }
  });

  // Get all active workflows (dashboard overview) - MUST come before /:id route
  app.get('/api/workflows/active', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: "No company associated with this user" });
      }
      
      const activeRuns = await db
        .select({
          id: workflowRuns.id,
          applicationId: workflowRuns.applicationId,
          currentState: workflowRuns.currentState,
          status: workflowRuns.status,
          startedAt: workflowRuns.startedAt,
          firstName: users.firstName,
          lastName: users.lastName,
          jobTitle: jobs.title,
          jobId: jobs.id,
        })
        .from(workflowRuns)
        .innerJoin(applications, eq(workflowRuns.applicationId, applications.id))
        .innerJoin(users, eq(applications.candidateId, users.id))
        .innerJoin(jobs, eq(applications.jobId, jobs.id))
        .where(
          and(
            eq(jobs.companyId, companyId),
            sql`${workflowRuns.status} != 'completed'`
          )
        )
        .orderBy(desc(workflowRuns.startedAt))
        .limit(50);
      
      // Format the response with concatenated candidate name
      const formattedRuns = activeRuns.map(run => ({
        id: run.id,
        applicationId: run.applicationId,
        currentState: run.currentState,
        status: run.status,
        startedAt: run.startedAt,
        candidateName: `${run.firstName || ''} ${run.lastName || ''}`.trim(),
        jobTitle: run.jobTitle,
        jobId: run.jobId,
      }));
      
      res.json(formattedRuns);
    } catch (error) {
      console.error("Error fetching active workflows:", error);
      res.status(500).json({ message: "Failed to fetch active workflows" });
    }
  });

  // Get workflow run details with all events
  app.get('/api/workflows/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Get workflow run
      const [run] = await db
        .select()
        .from(workflowRuns)
        .where(eq(workflowRuns.id, id));
      
      if (!run) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      // Get all events for this workflow
      const events = await db
        .select()
        .from(workflowEvents)
        .where(eq(workflowEvents.workflowRunId, id))
        .orderBy(workflowEvents.timestamp);
      
      // Get agent tasks
      const tasks = await db
        .select()
        .from(agentTasks)
        .where(eq(agentTasks.workflowRunId, id))
        .orderBy(agentTasks.createdAt);
      
      res.json({
        workflow: run,
        events,
        tasks,
      });
    } catch (error) {
      console.error("Error fetching workflow details:", error);
      res.status(500).json({ message: "Failed to fetch workflow details" });
    }
  });

  // Get workflow events for an application
  app.get('/api/workflows/application/:applicationId/events', isAuthenticated, async (req: any, res) => {
    try {
      const { applicationId } = req.params;
      
      const events = await db
        .select()
        .from(workflowEvents)
        .where(eq(workflowEvents.applicationId, applicationId))
        .orderBy(desc(workflowEvents.timestamp));
      
      res.json(events);
    } catch (error) {
      console.error("Error fetching workflow events:", error);
      res.status(500).json({ message: "Failed to fetch workflow events" });
    }
  });

  // Trigger workflow for an application (for testing/manual retry)
  app.post('/api/workflows/trigger/:applicationId', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const { applicationId } = req.params;
      
      // Check if application exists
      const [application] = await db
        .select()
        .from(applications)
        .where(eq(applications.id, applicationId));
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Start workflow
      const workflowRunId = await workflowTrigger.startApplicationWorkflow(applicationId);
      
      res.json({
        message: "Workflow triggered successfully",
        workflowRunId,
        applicationId,
      });
    } catch (error) {
      console.error("Error triggering workflow:", error);
      res.status(500).json({ message: "Failed to trigger workflow" });
    }
  });

  // REMOVED: Demo endpoint removed for production safety
  // Recruiters should use the actual application flow to trigger workflows
  // If testing is needed, use the /api/workflows/trigger/:applicationId endpoint on existing applications

  // ==================== NOTIFICATIONS ====================

  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // ==================== OFFER LETTER GENERATION ====================

  app.post('/api/offer-letter', isAuthenticated, async (req: any, res) => {
    try {
      const { candidateName, designation, salary, startDate, benefits } = req.body;
      const userId = req.user.id;
      
      if (!candidateName || !designation || !salary || !startDate) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Fetch user's company information
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user || !user[0] || !user[0].companyId) {
        return res.status(400).json({ message: "User company information not found" });
      }

      const company = await db
        .select()
        .from(companies)
        .where(eq(companies.id, user[0].companyId))
        .limit(1);

      if (!company || !company[0]) {
        return res.status(400).json({ message: "Company information not found" });
      }

      const companyName = company[0].name;
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      // AI-generated offer letter template with actual details
      const offerLetter = `
FORMAL JOB OFFER LETTER

Date: ${formattedDate}

Dear ${candidateName},

We are pleased to offer you the position of ${designation} at ${companyName}.

OFFER DETAILS:
================================================================================

Position: ${designation}
Annual Salary (CTC): ₹${salary}
Expected Start Date: ${new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
${benefits ? `Benefits & Perks:\n${benefits}` : ''}

TERMS & CONDITIONS:
================================================================================

1. This offer is contingent upon successful background verification and clearance.

2. You will be required to sign a standard employment agreement containing terms 
   related to confidentiality, intellectual property, and non-compete clauses.

3. Your employment will initially be on a probationary period of 3 months, during 
   which either party may terminate employment with immediate effect.

4. This offer is valid for 7 days from the date of this letter. Please confirm 
   your acceptance by signing and returning this offer letter.

5. All company policies and procedures must be adhered to during your tenure.

NEXT STEPS:
================================================================================

Please confirm your acceptance of this offer by:
- Signing this offer letter
- Submitting the signed copy to our HR department
- Completing the onboarding documentation

We look forward to welcoming you to the ${companyName} team!

For any queries, please contact our HR department.

Warm regards,

${companyName}
Human Resources Department

---

Candidate Acknowledgment:

I, ${candidateName}, hereby accept the job offer for the position of ${designation} 
with an annual salary of ₹${salary} and an expected start date of 
${new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.

Candidate Signature: ________________________    Date: ____________

Name (Print): ______________________________
      `.trim();

      res.json({ offerLetter });
    } catch (error) {
      console.error("Error generating offer letter:", error);
      res.status(500).json({ message: "Failed to generate offer letter" });
    }
  });

  // ==================== CANDIDATE RESUME MANAGEMENT ====================

  // Get all resumes for the authenticated candidate
  app.get('/api/resumes/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const offset = Math.max(parseInt(req.query.offset) || 0, 0);

      const resumes = await storage.getCandidateResumes(userId, { limit, offset });
      res.json(resumes);
    } catch (error) {
      console.error("Error fetching candidate resumes:", error);
      res.status(500).json({ message: "Failed to fetch resumes" });
    }
  });

  // Upload a new resume
  app.post('/api/resumes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      console.log("[RESUME UPLOAD] POST /api/resumes - User ID:", userId, "User object:", req.user);
      
      if (!userId) {
        console.error("[RESUME UPLOAD] No user ID found");
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { slotNumber, typeName, fileData, fileName, fileType, fileSize } = req.body;
      console.log("[RESUME UPLOAD] Request body - Slot:", slotNumber, "Type:", typeName, "File:", fileName, "DataLength:", fileData?.length);

      // Validate required fields
      if (!slotNumber || !typeName) {
        return res.status(400).json({ message: "Missing slotNumber or typeName" });
      }

      // Validate slot number (1-5)
      if (slotNumber < 1 || slotNumber > 5) {
        return res.status(400).json({ message: "Slot number must be between 1 and 5" });
      }

      // Validate file data if provided
      if (fileData && (!fileName || !fileType)) {
        return res.status(400).json({ message: "If uploading file, fileName and fileType are required" });
      }

      // Create or update the resume slot
      console.log("[RESUME UPLOAD] Creating resume with userId:", userId);
      const resume = await storage.createCandidateResume({
        userId,
        slotNumber,
        typeName,
        fileData: fileData || null,
        fileName: fileName || null,
        fileType: fileType || null,
        fileSize: fileSize || 0,
        uploadedAt: fileData ? new Date() : null,
      });

      console.log("[RESUME UPLOAD] ✅ Resume created successfully:", resume?.id);
      res.status(201).json(resume);
    } catch (error: any) {
      console.error("[RESUME UPLOAD] ❌ Error uploading resume:", error);
      if (error.message?.includes('unique constraint')) {
        return res.status(400).json({ message: "This resume slot is already in use." });
      }
      res.status(500).json({ message: "Failed to save resume" });
    }
  });

  // Get a specific resume
  app.get('/api/resumes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const resume = await storage.getCandidateResume(req.params.id);

      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }

      if (resume.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      res.json(resume);
    } catch (error) {
      console.error("Error fetching resume:", error);
      res.status(500).json({ message: "Failed to fetch resume" });
    }
  });

  // Update a resume
  app.patch('/api/resumes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const existingResume = await storage.getCandidateResume(req.params.id);

      if (!existingResume) {
        return res.status(404).json({ message: "Resume not found" });
      }

      if (existingResume.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { typeName, fileData, fileName, fileType, fileSize } = req.body;
      const updates: any = {};

      if (typeName !== undefined) updates.typeName = typeName;
      if (fileData !== undefined) updates.fileData = fileData;
      if (fileName !== undefined) updates.fileName = fileName;
      if (fileType !== undefined) updates.fileType = fileType;
      if (fileSize !== undefined) updates.fileSize = fileSize;

      const updatedResume = await storage.updateCandidateResume(req.params.id, updates);
      res.json(updatedResume);
    } catch (error) {
      console.error("Error updating resume:", error);
      res.status(500).json({ message: "Failed to update resume" });
    }
  });

  // Delete a resume
  app.delete('/api/resumes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const resume = await storage.getCandidateResume(req.params.id);

      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }

      if (resume.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await storage.deleteCandidateResume(req.params.id);
      res.json({ message: "Resume deleted successfully" });
    } catch (error) {
      console.error("Error deleting resume:", error);
      res.status(500).json({ message: "Failed to delete resume" });
    }
  });

  // ==================== PUBLIC INTERVIEW ENDPOINTS (NO AUTH REQUIRED) ====================

  // Get scheduling information via public token
  app.get('/api/public/interview-scheduling/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      // Find application by interview link token
      const application = await db.select()
        .from(applications)
        .leftJoin(jobs, eq(applications.jobId, jobs.id))
        .leftJoin(companies, eq(jobs.companyId, companies.id))
        .leftJoin(users, eq(jobs.createdBy, users.id))
        .where(eq(applications.interviewLink, token))
        .limit(1);

      if (!application || application.length === 0) {
        return res.status(404).json({ message: "Invalid scheduling link" });
      }

      const app = application[0];
      res.json({
        applicationId: app.applications.id,
        job: {
          id: app.jobs?.id,
          title: app.jobs?.title,
          location: app.jobs?.location,
          description: app.jobs?.description,
        },
        company: {
          id: app.companies?.id,
          name: app.companies?.name,
        },
        recruiter: app.users ? {
          id: app.users.id,
          firstName: app.users.firstName,
          lastName: app.users.lastName,
          mobileNumber: app.users.mobileNumber,
        } : null,
      });
    } catch (error) {
      console.error("Error fetching scheduling info:", error);
      res.status(500).json({ message: "Failed to fetch scheduling information" });
    }
  });

  // Schedule interview date/time
  app.post('/api/public/interview-scheduling/:token', async (req, res) => {
    console.log('[INTERVIEW-SCHEDULING] POST endpoint hit with token:', req.params.token);
    console.log('[INTERVIEW-SCHEDULING] Request body:', req.body);
    try {
      const { token } = req.params;
      const { interviewDate, interviewTime } = req.body;

      console.log('[INTERVIEW-SCHEDULING] POST request received:', { token, interviewDate, interviewTime });

      if (!interviewDate || !interviewTime) {
        return res.status(400).json({ message: "Date and time are required" });
      }

      // Find application by interview link token
      const appResult = await db.select()
        .from(applications)
        .where(eq(applications.interviewLink, token))
        .limit(1);

      if (!appResult || appResult.length === 0) {
        console.log('[INTERVIEW-SCHEDULING] Application not found for token:', token);
        return res.status(404).json({ message: "Invalid scheduling link" });
      }

      const application = appResult[0];
      console.log('[INTERVIEW-SCHEDULING] Application found:', { applicationId: application.id, candidateEmail: application.candidateEmail });
      const scheduledDateTime = new Date(`${interviewDate}T${interviewTime}`);

      // Update application with scheduled interview date
      const updatedApp = await storage.updateApplication(application.id, {
        interviewScheduledAt: scheduledDateTime,
        status: 'interview_scheduled',
      });

      console.log('[INTERVIEW-SCHEDULING] Application updated with scheduled date');

      // Create interview session
      const interviewToken = randomUUID();
      console.log('[INTERVIEW-SCHEDULING] About to create session with:', {
        applicationId: application.id,
        userId: application.candidateId,
        jobId: application.jobId,
        scheduledAt: scheduledDateTime,
      });

      let session;
      try {
        session = await storage.createInterviewSession({
          applicationId: application.id,
          userId: application.candidateId || null, // Nullable for resume-only workflow
          jobId: application.jobId,
          interviewType: 'ai_async',
          status: 'scheduled',
          scheduledAt: scheduledDateTime,
          totalQuestions: 10,
        });
        console.log('[INTERVIEW-SCHEDULING] Interview session created successfully:', { sessionId: session?.id, interviewToken });
      } catch (sessionError: any) {
        console.error('[INTERVIEW-SCHEDULING] Error creating session:', sessionError);
        console.error('[INTERVIEW-SCHEDULING] Session error details:', {
          message: sessionError?.message,
          code: sessionError?.code,
        });
        throw sessionError;
      }

      // Store interview token for later use - use sql() for JSONB update
      if (session) {
        try {
          await db.update(interviewSessions)
            .set({ metadata: sql`jsonb_set(metadata, '{interviewToken}', '"' || ${interviewToken} || '"')` })
            .where(eq(interviewSessions.id, session.id));
          
          console.log('[INTERVIEW-SCHEDULING] Interview token stored in metadata');
        } catch (metadataError) {
          console.warn('[INTERVIEW-SCHEDULING] Warning: Could not store token in metadata:', metadataError);
          // Continue anyway - the email will still be sent with the token
        }
      }

      // Send interview link email to candidate immediately after scheduling
      console.log('[INTERVIEW-SCHEDULING] Fetching job details for email...');
      const jobDetails = await db.select()
        .from(jobs)
        .leftJoin(companies, eq(jobs.companyId, companies.id))
        .where(eq(jobs.id, application.jobId))
        .limit(1);

      if (jobDetails && jobDetails.length > 0) {
        const jobInfo = jobDetails[0];
        const jobTitle = jobInfo.jobs?.title || 'Interview';
        const companyName = jobInfo.companies?.name || 'Our Company';
        
        console.log('[INTERVIEW-SCHEDULING] Sending interview email to:', application.candidateEmail);
        const emailSent = await sendInterviewSchedulingEmail(
          application.candidateEmail!,
          application.candidateName!,
          jobTitle,
          interviewToken,
          companyName
        );
        console.log('[INTERVIEW-SCHEDULING] Email send result:', emailSent);
      } else {
        console.log('[INTERVIEW-SCHEDULING] Job details not found');
      }

      console.log('[INTERVIEW-SCHEDULING] Request completed successfully');
      res.json({
        message: "Interview scheduled successfully",
        interviewToken: interviewToken,
        scheduledAt: scheduledDateTime,
      });
    } catch (error: any) {
      console.error("[INTERVIEW-SCHEDULING] Error scheduling interview:", error);
      console.error("[INTERVIEW-SCHEDULING] Error stack:", error?.stack);
      console.error("[INTERVIEW-SCHEDULING] Error details:", {
        message: error?.message,
        code: error?.code,
        name: error?.name,
      });
      res.status(500).json({ message: "Failed to schedule interview", error: error?.message });
    }
  });

  // Get interview details via public token
  app.get('/api/public/interview/:token', async (req, res) => {
    try {
      const { token } = req.params;

      console.log('[PUBLIC-INTERVIEW] Looking for token:', token);

      // Find interview session by token in metadata
      const sessions = await db.select()
        .from(interviewSessions)
        .leftJoin(jobs, eq(interviewSessions.jobId, jobs.id))
        .leftJoin(companies, eq(jobs.companyId, companies.id));

      console.log('[PUBLIC-INTERVIEW] Total sessions in DB:', sessions.length);

      // Find the matching session by checking metadata in JavaScript
      const matchingSession = sessions.find((s) => {
        const metadata = s.interview_sessions.metadata as any;
        const storedToken = metadata?.interviewToken;
        console.log('[PUBLIC-INTERVIEW] Checking session:', { 
          sessionId: s.interview_sessions.id, 
          storedToken,
          tokenMatches: storedToken === token
        });
        return storedToken === token;
      });

      if (!matchingSession) {
        console.log('[PUBLIC-INTERVIEW] No session found for token:', token);
        return res.status(404).json({ message: "Invalid interview link" });
      }

      const session = matchingSession.interview_sessions;
      const job = matchingSession.jobs;
      const company = matchingSession.companies;

      console.log('[PUBLIC-INTERVIEW] Found session:', { sessionId: session.id, token });
      
      res.json({
        sessionId: session.id,
        applicationId: session.applicationId,
        job: {
          id: job?.id,
          title: job?.title,
          location: job?.location,
        },
        company: {
          id: company?.id,
          name: company?.name,
        },
        totalQuestions: session.totalQuestions,
        scheduledAt: session.scheduledAt,
      });
    } catch (error) {
      console.error("Error fetching interview details:", error);
      res.status(500).json({ message: "Failed to fetch interview details" });
    }
  });

  // Start interview
  app.post('/api/public/interview/:token/start', async (req, res) => {
    try {
      const { token } = req.params;

      console.log('[PUBLIC-INTERVIEW-START] Starting interview for token:', token);

      // Find interview session by token in metadata
      const sessions = await db.select()
        .from(interviewSessions);

      // Find the matching session by checking metadata in JavaScript
      const matchingSession = sessions.find((s) => {
        const metadata = s.metadata as any;
        const storedToken = metadata?.interviewToken;
        return storedToken === token;
      });

      console.log('[PUBLIC-INTERVIEW-START] Query result:', matchingSession ? 'found' : 'not found');

      if (!matchingSession) {
        console.log('[PUBLIC-INTERVIEW-START] No session found for token:', token);
        return res.status(404).json({ message: "Invalid interview link" });
      }

      const sessionId = matchingSession.id;
      const applicationId = matchingSession.applicationId;

      console.log('[PUBLIC-INTERVIEW-START] Found session:', { sessionId, applicationId });

      // Update session status to in_progress
      await db.update(interviewSessions)
        .set({ 
          status: 'in_progress',
          startedAt: new Date(),
        })
        .where(eq(interviewSessions.id, sessionId));

      // Update application status to 'scheduled' (interview in progress)
      await storage.updateApplication(applicationId, {
        status: 'scheduled',
      });

      console.log('[PUBLIC-INTERVIEW-START] Interview started successfully');

      res.json({
        message: "Interview started",
        sessionId: sessionId,
      });
    } catch (error: any) {
      console.error("Error starting interview:", error);
      res.status(500).json({ message: "Failed to start interview" });
    }
  });

  // Fetch interview questions - dynamically generated by AI with de-duplication and concept coverage
  app.get('/api/public/interview/:token/questions', async (req, res) => {
    try {
      const { token } = req.params;

      // Find interview session by token
      const sessions = await db.select()
        .from(interviewSessions)
        .leftJoin(jobs, eq(interviewSessions.jobId, jobs.id))
        .leftJoin(applications, eq(interviewSessions.applicationId, applications.id));

      const matchingSession = sessions.find((s) => {
        const metadata = s.interview_sessions?.metadata as any;
        return metadata?.interviewToken === token;
      });

      if (!matchingSession) {
        return res.status(404).json({ message: "Invalid interview link" });
      }

      const job = matchingSession.jobs;
      const application = matchingSession.applications;
      const session = matchingSession.interview_sessions;

      // Check if questions were already generated for this session
      const sessionMetadata = session.metadata as any;
      if (sessionMetadata?.generatedQuestions) {
        console.log('[INTERVIEW-QUESTIONS] Returning cached questions');
        return res.json({ 
          questions: sessionMetadata.generatedQuestions,
          conceptCoverage: sessionMetadata.conceptCoverage || null,
        });
      }

      // Generate questions dynamically using GPT-4o
      const jobTitle = job?.title || 'General Position';
      const jobDescription = job?.description || '';
      const requirements = job?.requirements || [];
      const extractedSkills = job?.extractedSkills || [];
      const candidateName = application?.candidateName || 'Candidate';

      console.log('[INTERVIEW-QUESTIONS] Generating AI questions for:', jobTitle);

      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      // Skills/concepts to cover
      const skillsList = Array.isArray(extractedSkills) && extractedSkills.length > 0
        ? extractedSkills
        : (Array.isArray(requirements) ? requirements : [requirements]).filter(Boolean);
      
      const conceptsSection = skillsList.length > 0
        ? `\n\nKEY CONCEPTS/SKILLS TO COVER (aim for minimum 60% coverage):
${skillsList.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}`
        : '';

      const prompt = `You are an expert interviewer. Generate comprehensive interview questions for a candidate applying for the position of "${jobTitle}".

Job Description: ${jobDescription}
Required Skills: ${Array.isArray(requirements) ? requirements.join(', ') : requirements}
${conceptsSection}

Generate an appropriate number of questions based on job complexity:
- Entry-level roles: 8-12 questions
- Mid-level roles: 12-18 questions  
- Senior/Lead roles: 15-25 questions
- Executive roles: 20-30 questions

Include a balanced mix of:
- Subject/Technical questions specific to the role (40%)
- Behavioral questions using STAR format (25%)
- Problem-solving/Coding questions if applicable (20%)
- Team management/Cultural fit questions (15%)

Each question should:
- Be clear and concise
- Take 2-3 minutes to answer verbally
- Be appropriate for a video interview setting
- The entire interview should complete within 60 minutes total
- Map to one or more concepts/skills from the list above

IMPORTANT: For each question, include a "conceptsCovered" array listing which concepts/skills from the job requirements this question tests.

Return as a JSON object with this structure:
{
  "questions": [
    {"id": "q1", "question": "Question text here", "category": "subject", "type": "subject", "conceptsCovered": ["Java", "OOP"]},
    {"id": "q2", "question": "Question text here", "category": "behavioral", "type": "behavioral", "conceptsCovered": ["Communication", "Teamwork"]},
    ...
  ],
  "conceptCoverage": {
    "totalConcepts": 10,
    "conceptsCovered": ["Java", "Spring Boot", "REST APIs", "Problem Solving", "Communication", "Leadership"],
    "coveragePercentage": 75,
    "coverageByCategory": {
      "Technical": {"covered": 5, "total": 7, "percentage": 71},
      "Soft Skills": {"covered": 3, "total": 3, "percentage": 100}
    }
  }
}

Categories: subject, behavioral, coding, team_management
Ensure coverage percentage is at least 60%. If not possible, generate additional questions to increase coverage.`;

      console.log('[INTERVIEW-QUESTIONS] Sending request to GPT-4o...');
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 4000,
      });
      console.log('[INTERVIEW-QUESTIONS] GPT-4o response received');

      let questions;
      let conceptCoverage = null;
      try {
        const content = response.choices[0].message.content || '{}';
        const parsed = JSON.parse(content);
        questions = parsed.questions || parsed;
        conceptCoverage = parsed.conceptCoverage || null;
        if (!Array.isArray(questions)) {
          questions = Object.values(parsed).flat().filter((q: any) => q && q.question);
        }
      } catch (parseError) {
        console.error('[INTERVIEW-QUESTIONS] Parse error:', parseError);
        // Fallback questions if AI fails
        questions = [
          { id: 'q1', question: `Tell me about your experience relevant to the ${jobTitle} position.`, category: 'subject', type: 'subject', conceptsCovered: ['Experience'] },
          { id: 'q2', question: 'Describe a challenging project you worked on and how you overcame obstacles.', category: 'behavioral', type: 'behavioral', conceptsCovered: ['Problem Solving'] },
          { id: 'q3', question: 'What technical skills do you bring to this role?', category: 'subject', type: 'subject', conceptsCovered: ['Technical Skills'] },
          { id: 'q4', question: 'Tell me about a time you had to work with a difficult team member.', category: 'behavioral', type: 'behavioral', conceptsCovered: ['Teamwork'] },
          { id: 'q5', question: 'Walk me through your problem-solving approach.', category: 'coding', type: 'coding', conceptsCovered: ['Problem Solving'] },
          { id: 'q6', question: 'How do you stay updated with industry trends?', category: 'subject', type: 'subject', conceptsCovered: ['Learning'] },
          { id: 'q7', question: 'Describe your ideal work environment.', category: 'team_management', type: 'team_management', conceptsCovered: ['Culture Fit'] },
          { id: 'q8', question: 'How do you handle tight deadlines?', category: 'behavioral', type: 'behavioral', conceptsCovered: ['Time Management'] },
          { id: 'q9', question: 'What motivates you in your work?', category: 'team_management', type: 'team_management', conceptsCovered: ['Motivation'] },
          { id: 'q10', question: 'Where do you see yourself in 5 years?', category: 'behavioral', type: 'behavioral', conceptsCovered: ['Career Goals'] },
        ];
        // Default concept coverage for fallback
        conceptCoverage = {
          totalConcepts: 10,
          conceptsCovered: ['Experience', 'Problem Solving', 'Technical Skills', 'Teamwork', 'Learning', 'Culture Fit', 'Time Management', 'Motivation', 'Career Goals'],
          coveragePercentage: 90,
        };
      }

      // Ensure proper structure for all questions
      questions = questions.map((q: any, idx: number) => ({
        id: q.id || `q${idx + 1}`,
        question: q.question,
        category: q.category || 'subject',
        type: q.type || 'subject',
        conceptsCovered: q.conceptsCovered || [],
      }));

      // Validate minimum 60% coverage - log warning if below threshold
      if (conceptCoverage && conceptCoverage.coveragePercentage < 60) {
        console.warn('[INTERVIEW-QUESTIONS] Coverage below 60% threshold:', conceptCoverage.coveragePercentage + '%');
      }

      // Cache questions and concept coverage in session metadata
      await db.update(interviewSessions)
        .set({
          metadata: {
            ...sessionMetadata,
            generatedQuestions: questions,
            conceptCoverage: conceptCoverage,
            questionsGeneratedAt: new Date().toISOString(),
          },
        })
        .where(eq(interviewSessions.id, session.id));

      console.log('[INTERVIEW-QUESTIONS] Generated', questions.length, 'questions with', 
        conceptCoverage?.coveragePercentage || 'N/A', '% concept coverage');
      res.json({ questions, conceptCoverage });
    } catch (error: any) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Generate TTS audio for a question - streams raw audio binary
  app.post('/api/public/interview/:token/tts', async (req, res) => {
    try {
      const { token } = req.params;
      const { text, questionId, format } = req.body;

      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      // Verify token is valid
      const sessions = await db.select()
        .from(interviewSessions);

      const matchingSession = sessions.find((s) => {
        const metadata = s.metadata as any;
        return metadata?.interviewToken === token;
      });

      if (!matchingSession) {
        return res.status(404).json({ message: "Invalid interview link" });
      }

      console.log('[TTS] Generating speech for question:', questionId);

      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: text,
        response_format: 'mp3',
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      console.log('[TTS] Generated audio, size:', buffer.length, 'bytes');

      // Stream raw binary audio for better browser compatibility
      if (format === 'stream') {
        res.set('Content-Type', 'audio/mpeg');
        res.set('Content-Length', buffer.length.toString());
        res.set('Cache-Control', 'no-cache');
        return res.send(buffer);
      }

      // Default: return base64 JSON (legacy)
      const base64Audio = buffer.toString('base64');
      res.json({ 
        audio: base64Audio,
        format: 'mp3',
      });
    } catch (error: any) {
      console.error("Error generating TTS:", error);
      res.status(500).json({ message: "Failed to generate speech" });
    }
  });

  // Transcribe voice answer using Whisper
  app.post('/api/public/interview/:token/transcribe', async (req, res) => {
    try {
      const { token } = req.params;
      const { audio } = req.body; // Base64 encoded audio

      if (!audio) {
        return res.status(400).json({ message: "Audio is required" });
      }

      // Verify token is valid
      const sessions = await db.select()
        .from(interviewSessions);

      const matchingSession = sessions.find((s) => {
        const metadata = s.metadata as any;
        return metadata?.interviewToken === token;
      });

      if (!matchingSession) {
        return res.status(404).json({ message: "Invalid interview link" });
      }

      console.log('[TRANSCRIBE] Processing audio...');

      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audio, 'base64');
      
      // Create a file-like object for the API
      const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
      const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });

      const transcription = await openai.audio.transcriptions.create({
        model: 'whisper-1',
        file: audioFile,
        language: 'en',
      });

      console.log('[TRANSCRIBE] Transcription complete:', transcription.text.substring(0, 100) + '...');

      res.json({ 
        text: transcription.text,
      });
    } catch (error: any) {
      console.error("Error transcribing audio:", error);
      res.status(500).json({ message: "Failed to transcribe audio" });
    }
  });

  // Submit interview with video (high limit for video uploads)
  const largeBodyParser = express.json({ limit: '200mb' });
  app.post('/api/public/interview/:token/submit', largeBodyParser, async (req, res) => {
    try {
      const { token } = req.params;
      const { answers, videoBlob } = req.body;

      // Find interview session by token with job details
      const sessions = await db.select()
        .from(interviewSessions)
        .leftJoin(jobs, eq(interviewSessions.jobId, jobs.id));

      const matchingSession = sessions.find((s) => {
        const metadata = s.interview_sessions.metadata as any;
        return metadata?.interviewToken === token;
      });

      if (!matchingSession) {
        return res.status(404).json({ message: "Invalid interview link" });
      }

      const session = matchingSession.interview_sessions;
      const job = matchingSession.jobs;
      const sessionId = session.id;
      const applicationId = session.applicationId;
      const sessionMetadata = (session.metadata as any) || {};
      const questions = sessionMetadata.questions || [];
      const completedAt = new Date();

      console.log('[INTERVIEW-SUBMIT] Processing interview submission:', {
        sessionId,
        applicationId,
        questionsCount: questions.length,
        answersCount: answers?.length || 0,
      });

      // Store video (locally in TEST mode, S3 in PROD mode)
      let videoUrls: string[] = [];
      let videoPath: string | null = null;
      if (videoBlob) {
        try {
          console.log(`[INTERVIEW-SUBMIT] Saving video (APP_ENV=${process.env.APP_ENV || 'TEST'})...`);
          
          const videoFileName = `interview-video-${sessionId}-${Date.now()}.webm`;
          const videoBuffer = Buffer.from(videoBlob, 'base64');
          
          const result = await uploadVideo(videoBuffer, videoFileName);
          videoPath = result.path;
          videoUrls = [videoFileName];
          
          console.log(`[INTERVIEW-SUBMIT] Video saved (${result.isS3 ? 'S3' : 'local'}): ${videoPath} (${Math.round(videoBuffer.length / 1024 / 1024 * 100) / 100} MB)`);
        } catch (uploadError: any) {
          console.error('[INTERVIEW-SUBMIT] Error saving video:', uploadError);
          videoPath = null;
        }
      }

      // ============ STEP 1: Store Q&A in interview_messages table ============
      console.log('[INTERVIEW-SUBMIT] Storing Q&A in interview_messages...');
      const answersArray = answers || [];
      
      // Build Q&A pairs from answers array (which contains question info) or fallback to session questions
      const qaPairs: { question: string; answer: string; type: string; topic: string; }[] = [];
      
      if (answersArray.length > 0) {
        // Extract Q&A pairs from the answers array (each answer object may contain the question)
        answersArray.forEach((answerData: any, i: number) => {
          const questionFromAnswer = answerData?.question || answerData?.questionText;
          const questionFromSession = questions[i];
          const questionText = questionFromAnswer || questionFromSession?.text || questionFromSession?.question || `Question ${i + 1}`;
          const answerText = typeof answerData === 'string' 
            ? answerData 
            : (answerData?.answer || answerData?.text || 'No answer provided');
          const questionType = answerData?.type || questionFromSession?.type || 'general';
          const topic = answerData?.topic || questionFromSession?.topic || 'Interview';
          
          qaPairs.push({
            question: questionText,
            answer: answerText,
            type: questionType,
            topic: topic,
          });
        });
      } else if (questions.length > 0) {
        // Fallback: Use questions from session metadata
        questions.forEach((q: any, i: number) => {
          qaPairs.push({
            question: q.text || q.question || `Question ${i + 1}`,
            answer: 'No answer provided',
            type: q.type || 'general',
            topic: q.topic || 'Interview',
          });
        });
      }
      
      // Store each Q&A pair in interview_messages
      for (const qa of qaPairs) {
        // Store the question (interviewer role)
        await db.insert(interviewMessages).values({
          sessionId: sessionId,
          role: 'interviewer',
          messageType: 'text',
          content: qa.question,
          metadata: {
            questionType: qa.type,
            topic: qa.topic,
          },
        });
        
        // Store the answer (candidate role)
        await db.insert(interviewMessages).values({
          sessionId: sessionId,
          role: 'candidate',
          messageType: 'text',
          content: qa.answer,
          metadata: {
            questionType: qa.type,
            topic: qa.topic,
          },
        });
      }
      console.log('[INTERVIEW-SUBMIT] Stored', qaPairs.length * 2, 'messages (Q&A pairs)');

      // ============ STEP 2: Update interview session immediately ============
      await db.update(interviewSessions)
        .set({
          status: 'completed',
          completedAt: completedAt,
          videoUrls: videoUrls,
          videoPath: videoPath,
          metadata: {
            ...sessionMetadata,
            answers: answersArray,
            completedAt: completedAt.toISOString(),
            evaluationPending: true,
          },
        })
        .where(eq(interviewSessions.id, sessionId));

      // ============ STEP 3: Update application status immediately ============
      await storage.updateApplication(applicationId, {
        status: 'interview_complete',
        updatedAt: completedAt,
      });

      console.log('[INTERVIEW-SUBMIT] Interview submitted successfully, evaluation will run in background');

      // ============ RESPOND IMMEDIATELY ============
      res.json({
        message: "Interview submitted successfully! AI evaluation is processing in the background.",
        sessionId,
        videoPath,
      });

      // ============ STEP 4: Run AI Evaluation in Background (after response) ============
      (async () => {
        try {
          console.log('[INTERVIEW-EVAL-BACKGROUND] Starting AI evaluation...');
          
          const jobTitle = job?.title || 'Position';
          let totalScore = 50;
          let technicalScore = 50;
          let communicationScore = 50;
          let problemSolvingScore = 50;
          let confidenceScore = 50;
          const questionScores: { questionId: string; question: string; answer: string; score: number; feedback: string; }[] = [];
          const strengths: string[] = [];
          const weaknesses: string[] = [];
          
          // Evaluate Q&A pairs using AI
          const { OpenAI } = await import('openai');
          const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
          
          if (openai && qaPairs.length > 0) {
            const qaContent = qaPairs.map((qa, i) => {
              return `Question ${i + 1} (${qa.type}): ${qa.question}\nAnswer: ${qa.answer}`;
            }).join('\n\n');
            
            try {
              const evaluationPrompt = `You are an expert interview evaluator. Evaluate this candidate's interview for a ${jobTitle} position.

${qaContent}

Provide a comprehensive evaluation in the following JSON format:
{
  "overallScore": <0-100 overall interview score>,
  "technicalScore": <0-100 technical competency score>,
  "communicationScore": <0-100 clarity and articulation score>,
  "problemSolvingScore": <0-100 analytical thinking score>,
  "confidenceScore": <0-100 candidate confidence level>,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "questionScores": [
    {"questionId": "q1", "score": <0-100>, "feedback": "brief feedback"},
    ...for each question
  ],
  "summary": "Brief 2-3 sentence summary of candidate performance"
}

Score objectively based on answer quality, relevance, depth, and communication. Be fair but thorough.`;

              const completion = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                  { role: 'system', content: 'You are an expert interview evaluator. Return only valid JSON.' },
                  { role: 'user', content: evaluationPrompt }
                ],
                response_format: { type: 'json_object' },
                max_tokens: 2000,
              });

              const evalResult = JSON.parse(completion.choices[0].message.content || '{}');
              
              totalScore = evalResult.overallScore || 50;
              technicalScore = evalResult.technicalScore || 50;
              communicationScore = evalResult.communicationScore || 50;
              problemSolvingScore = evalResult.problemSolvingScore || 50;
              confidenceScore = evalResult.confidenceScore || 50;
              
              if (evalResult.strengths) strengths.push(...evalResult.strengths);
              if (evalResult.weaknesses) weaknesses.push(...evalResult.weaknesses);
              
              if (evalResult.questionScores) {
                evalResult.questionScores.forEach((qs: any, i: number) => {
                  const qa = qaPairs[i];
                  if (qa) {
                    questionScores.push({
                      questionId: `q${i + 1}`,
                      question: qa.question,
                      answer: qa.answer,
                      score: qs.score || 50,
                      feedback: qs.feedback || 'Evaluated',
                    });
                  }
                });
              }
              
              console.log('[INTERVIEW-EVAL-BACKGROUND] AI Evaluation complete:', { overallScore: totalScore });
            } catch (evalError: any) {
              console.error('[INTERVIEW-EVAL-BACKGROUND] AI Evaluation error:', evalError.message);
            }
          }

          // Determine recommendation
          let recommendation: string;
          let interviewOutcome: string;
          
          if (totalScore >= 70) {
            recommendation = 'strong_hire';
            interviewOutcome = 'cleared';
          } else if (totalScore >= 50) {
            recommendation = 'maybe';
            interviewOutcome = 'on_hold';
          } else {
            recommendation = 'no_hire';
            interviewOutcome = 'rejected';
          }

          // Create or update evaluation record (upsert to avoid duplicates)
          const existingEval = await db.select().from(interviewEvaluations).where(eq(interviewEvaluations.sessionId, sessionId)).limit(1);
          
          if (existingEval.length > 0) {
            await db.update(interviewEvaluations)
              .set({
                overallScore: totalScore,
                recommendation: recommendation,
                technicalScore: technicalScore,
                communicationScore: communicationScore,
                problemSolvingScore: problemSolvingScore,
                confidenceScore: confidenceScore,
                strengths: strengths,
                weaknesses: weaknesses,
                questionScores: questionScores,
                transcriptSummary: `Interview completed with ${qaPairs.length} questions. Overall score: ${totalScore}%.`,
                updatedAt: new Date(),
              })
              .where(eq(interviewEvaluations.sessionId, sessionId));
          } else {
            await db.insert(interviewEvaluations).values({
              sessionId: sessionId,
              overallScore: totalScore,
              recommendation: recommendation,
              technicalScore: technicalScore,
              communicationScore: communicationScore,
              problemSolvingScore: problemSolvingScore,
              confidenceScore: confidenceScore,
              strengths: strengths,
              weaknesses: weaknesses,
              questionScores: questionScores,
              transcriptSummary: `Interview completed with ${qaPairs.length} questions. Overall score: ${totalScore}%.`,
              createdAt: completedAt,
              updatedAt: completedAt,
            });
          }

          // Update session with evaluation results
          await db.update(interviewSessions)
            .set({
              metadata: {
                ...sessionMetadata,
                answers: answersArray,
                completedAt: completedAt.toISOString(),
                evaluationScore: totalScore,
                recommendation: recommendation,
                evaluationPending: false,
              },
            })
            .where(eq(interviewSessions.id, sessionId));

          // Update application with evaluation results
          await storage.updateApplication(applicationId, {
            evaluationScore: totalScore,
            evaluatedAt: completedAt,
            interviewOutcome: interviewOutcome,
            updatedAt: new Date(),
          });

          // Update job timestamp
          if (job?.id) {
            await db.update(jobs)
              .set({ updatedAt: new Date() })
              .where(eq(jobs.id, job.id));
          }

          console.log('[INTERVIEW-EVAL-BACKGROUND] Background evaluation completed:', {
            sessionId,
            overallScore: totalScore,
            recommendation,
            interviewOutcome,
          });
        } catch (bgError: any) {
          console.error('[INTERVIEW-EVAL-BACKGROUND] Background evaluation error:', bgError.message);
        }
      })();
    } catch (error: any) {
      console.error("Error submitting interview:", error);
      res.status(500).json({ message: "Failed to submit interview" });
    }
  });

  // Retrieve video from interview session
  app.get('/api/public/interview/:token/video/:fileName', async (req, res) => {
    try {
      const { token, fileName } = req.params;

      // Find interview session by token
      const sessions = await db.select()
        .from(interviewSessions);

      const matchingSession = sessions.find((s) => {
        const metadata = s.metadata as any;
        return metadata?.interviewToken === token;
      });

      if (!matchingSession) {
        return res.status(404).json({ message: "Invalid interview link" });
      }

      // Check if video file exists (local or S3)
      const videoPath = matchingSession.videoPath;
      if (videoPath) {
        const meta = await getVideoMeta(videoPath);
        if (meta.exists) {
          if (videoPath.startsWith("s3:")) {
            const signedUrl = await getVideoStreamUrl(videoPath, "");
            if (signedUrl) return res.redirect(302, signedUrl);
          } else {
            res.set('Content-Type', 'video/webm');
            res.set('Content-Disposition', `inline; filename="${fileName}"`);
            return fs.createReadStream(meta.localPath!).pipe(res);
          }
        }
      }

      // Fallback: Check legacy base64 in metadata
      const metadata = (matchingSession.metadata as any) || {};
      const videoData = metadata.videoData;

      if (videoData && videoData.data) {
        res.set('Content-Type', 'video/webm');
        res.set('Content-Disposition', `inline; filename="${fileName}"`);
        const buffer = Buffer.from(videoData.data, 'base64');
        return res.send(buffer);
      }

      // If videoData doesn't exist, check in videoUrls
      if (matchingSession.videoUrls?.includes(fileName)) {
        return res.status(202).json({ 
          message: "Video is being processed",
          fileName: fileName,
          status: "processing"
        });
      }

      return res.status(404).json({ message: "Video not found" });
    } catch (error: any) {
      console.error("Error retrieving video:", error);
      res.status(500).json({ message: "Failed to retrieve video" });
    }
  });

  // Serve uploaded videos directory (TEST/local mode only)
  if (!IS_PROD) {
    const videoDir = path.resolve(process.cwd(), 'uploads', 'videos');
    fs.mkdirSync(videoDir, { recursive: true });
    app.use('/uploads/videos', express.static(videoDir));
  }

  // Get interview session with video info
  app.get('/api/public/interview/:token/video-info', async (req, res) => {
    try {
      const { token } = req.params;

      const sessions = await db.select()
        .from(interviewSessions);

      const matchingSession = sessions.find((s) => {
        const metadata = s.metadata as any;
        return metadata?.interviewToken === token;
      });

      if (!matchingSession) {
        return res.status(404).json({ message: "Invalid interview link" });
      }

      const metadata = (matchingSession.metadata as any) || {};
      const videoData = metadata.videoData;

      res.json({
        sessionId: matchingSession.id,
        status: matchingSession.status,
        completedAt: matchingSession.completedAt,
        hasVideo: !!videoData,
        videoFileName: videoData?.fileName,
        videoUploadedAt: videoData?.uploadedAt,
        downloadUrl: videoData ? `/api/public/interview/${token}/video/${videoData.fileName}` : null,
        answers: metadata.answers || [],
      });
    } catch (error: any) {
      console.error("Error fetching video info:", error);
      res.status(500).json({ message: "Failed to fetch video info" });
    }
  });

  // Helper function to map category to type
  function mapCategory(category: string): string {
    switch (category) {
      case 'technical':
        return 'subject';
      case 'behavioral':
        return 'behavioral';
      case 'situational':
        return 'team_management';
      default:
        return 'subject';
    }
  }

  // ==================== INTERVIEW MODULE (STANDALONE, PARALLEL-CAPABLE) ====================

  // Create interview session from Resume Screening (starts immediately for testing)
  app.post('/api/applications/:applicationId/create-interview', isAuthenticated, isRecruiter, async (req: any, res) => {
    try {
      const { applicationId } = req.params;
      const recruiterId = (req.user as any).id;

      // Get application with job details
      const appData = await db.select()
        .from(applications)
        .leftJoin(jobs, eq(applications.jobId, jobs.id))
        .where(eq(applications.id, applicationId));

      if (!appData || appData.length === 0) {
        return res.status(404).json({ message: "Application not found" });
      }

      const app = appData[0];
      const job = app.jobs;

      // Generate unique interview token for this session
      const interviewToken = `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      // Update application status and set interview scheduled date FIRST
      await storage.updateApplication(applicationId, {
        status: 'interview_scheduled',
        interviewScheduledAt: now
      });

      // Create interview session with scheduledAt
      const session = await storage.createInterviewSession({
        applicationId,
        userId: app.applications?.candidateId,
        jobId: job?.id,
        interviewType: 'ai_async',
        status: 'scheduled',
        scheduledAt: now,
        metadata: {
          interviewToken,
          createdBy: recruiterId,
          createdAt: new Date().toISOString(),
        },
      });

      res.status(201).json({
        message: "Interview session created",
        sessionId: session.id,
        interviewToken,
      });
    } catch (error) {
      console.error("Error creating interview session:", error);
      res.status(500).json({ message: "Failed to create interview session" });
    }
  });

  // Create a simulated interview session for candidates to test the interview process
  app.post('/api/interviews/simulate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const userRole = (req.user as any).role;

      if (userRole !== 'candidate') {
        return res.status(403).json({ message: "Only candidates can simulate interviews" });
      }

      // Create a mock/test interview session
      const mockJobId = 'test-job-simulation';
      const simulationToken = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const session = await storage.createInterviewSession({
        applicationId: null as any, // No real application for simulation
        userId,
        jobId: mockJobId,
        interviewType: 'ai_async',
        status: 'scheduled',
        metadata: {
          isSimulation: true,
          interviewToken: simulationToken,
          simulationStartedAt: new Date().toISOString(),
        },
      });

      res.status(201).json({
        message: "Simulation interview session created",
        sessionId: session.id,
        interviewToken: simulationToken,
      });
    } catch (error) {
      console.error("Error creating simulation interview:", error);
      res.status(500).json({ message: "Failed to create simulation interview" });
    }
  });

  // ==================== PUBLIC JOB API (FOR RESUME SITE) ====================

  // Get all publicly posted jobs (public API for Resume site)
  // Only returns jobs that have active platform postings on RyteFit Career Site
  app.get('/api/public/jobs', async (req: any, res) => {
    try {
      // Get jobs that are posted to RyteFit platform (explicit posting required)
      const postedJobs = await db.select({
        job: jobs,
        posting: jobPlatformPostings,
      })
        .from(jobPlatformPostings)
        .innerJoin(jobs, eq(jobs.id, jobPlatformPostings.jobId))
        .where(and(
          eq(jobPlatformPostings.platformSlug, 'rytefit'),
          eq(jobPlatformPostings.status, 'active')
        ))
        .orderBy(desc(jobPlatformPostings.postedAt));
      
      // Enrich jobs with company info and recruiter contact
      const enrichedJobs = await Promise.all(
        postedJobs.map(async ({ job, posting }) => {
          const company = await storage.getCompany(job.companyId);
          
          // Get recruiter (job creator) contact info
          let recruiterContact = {
            name: null as string | null,
            email: null as string | null,
            phone: null as string | null,
          };
          
          if (job.createdBy) {
            const recruiter = await storage.getUser(job.createdBy);
            if (recruiter) {
              const fullName = [recruiter.firstName, recruiter.lastName]
                .filter(Boolean)
                .join(' ') || null;
              recruiterContact = {
                name: fullName,
                email: recruiter.email || null,
                phone: recruiter.mobileNumber || null,
              };
            }
          }
          
          return {
            id: job.id,
            jobPostingId: job.jobPostingId,
            title: job.title,
            description: job.description,
            responsibilities: job.responsibilities,
            requirements: job.requirements,
            department: job.department,
            location: job.location,
            employmentType: job.employmentType,
            experienceLevel: job.experienceLevel,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            salaryCurrency: job.salaryCurrency,
            companyName: company?.name || 'Unknown Company',
            companyId: job.companyId,
            status: job.status,
            postedAt: posting.postedAt, // When job was posted to platform
            extractedSkills: job.extractedSkills,
            // Recruiter contact info for external candidates
            recruiterContact,
          };
        })
      );
      
      res.json({
        data: enrichedJobs,
        total: postedJobs.length,
        limit: 100,
        offset: 0,
      });
    } catch (error) {
      console.error("Error fetching public jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // Submit application from external Resume site
  app.post('/api/public/applications', resumeUpload.single('resume'), async (req: any, res) => {
    try {
      const { jobId, candidateName, email, phone, location } = req.body;

      if (!jobId || !candidateName || !email) {
        return res.status(400).json({ message: "jobId, candidateName, and email are required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Resume file is required" });
      }

      // Verify job exists and is posted to RyteFit platform
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Check if job is posted to RyteFit platform (explicit posting required)
      const platformPosting = await storage.getJobPlatformPostingByPlatform(jobId, 'rytefit');
      if (!platformPosting || platformPosting.status !== 'active') {
        return res.status(404).json({ message: "Job is not currently accepting applications" });
      }

      // Check for duplicate applications (same email and job)
      const allApplications = await db.select()
        .from(applications)
        .where(eq(applications.jobId, jobId));
      
      const alreadyApplied = allApplications.some(app => {
        const appData = (app.metadata as any) || {};
        return appData.candidateEmail === email;
      });

      if (alreadyApplied) {
        return res.status(400).json({ message: "This email has already applied to this job" });
      }

      // Parse resume file
      let resumeContent = '';
      let resumeFileName = req.file.originalname;
      try {
        if (req.file.originalname.endsWith('.pdf')) {
          const pdfParse = (await import('pdf-parse')).default;
          const data = await pdfParse(req.file.buffer);
          resumeContent = data.text;
        } else if (req.file.originalname.endsWith('.docx')) {
          const mammoth = (await import('mammoth')).default;
          const result = await mammoth.extractRawText({ buffer: req.file.buffer });
          resumeContent = result.value;
        } else {
          resumeContent = req.file.buffer.toString('utf8');
        }
      } catch (parseError) {
        console.error("Error parsing resume:", parseError);
        resumeContent = req.file.buffer.toString('utf8');
      }

      // Create application (resume-only workflow)
      const application = await storage.createApplication({
        jobId,
        candidateId: null, // No user for external applicants
        status: 'applied',
        resumeUrl: resumeFileName,
        coverLetter: null,
        metadata: {
          candidateName,
          candidateEmail: email,
          candidatePhone: phone,
          candidateLocation: location,
          externalApplication: true,
          resumeContent: resumeContent,
          uploadedAt: new Date().toISOString(),
        },
      });

      // Increment applications count
      await db.update(jobs).set({
        applicationsCount: sql`${jobs.applicationsCount} + 1`
      }).where(eq(jobs.id, jobId));

      // Trigger agentic AI workflow - starts resume screening automatically
      try {
        const workflowRunId = await workflowTrigger.startApplicationWorkflow(application.id);
        console.log(`[PUBLIC-API] Started workflow ${workflowRunId} for application ${application.id}`);
      } catch (workflowError) {
        console.error('[PUBLIC-API] Failed to start workflow, but application created:', workflowError);
      }

      res.status(201).json({
        message: "Application submitted successfully",
        applicationId: application.id,
        jobPostingId: job.jobPostingId,
      });
    } catch (error) {
      console.error("[PUBLIC-API] Error submitting application:", error);
      res.status(500).json({ message: "Failed to submit application" });
    }
  });

  // ==================== MOBILE & PWA API ====================

  // Health check for PWA offline detection
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'RyteFit Platform', timestamp: Date.now() });
  });

  // Get VAPID public key for push notifications
  app.get('/api/mobile/vapid-public-key', (req, res) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    if (!publicKey) {
      return res.status(503).json({ message: 'Push notifications not configured' });
    }
    res.json({ publicKey });
  });

  // Register push subscription
  app.post('/api/mobile/push-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const subscription = req.body;

      if (!subscription?.endpoint) {
        return res.status(400).json({ message: 'Invalid subscription data' });
      }

      // Import the schema
      const { mobileDevices } = await import('@shared/schema');

      // Check if device already exists
      const existingDevices = await db.select()
        .from(mobileDevices)
        .where(and(
          eq(mobileDevices.userId, userId),
          eq(mobileDevices.pushToken, subscription.endpoint)
        ));

      if (existingDevices.length > 0) {
        // Update existing device
        await db.update(mobileDevices)
          .set({
            pushSubscription: subscription,
            lastActiveAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(mobileDevices.id, existingDevices[0].id));

        return res.json({ message: 'Subscription updated', deviceId: existingDevices[0].id });
      }

      // Create new device record
      const [device] = await db.insert(mobileDevices)
        .values({
          userId,
          deviceType: 'web',
          deviceName: req.headers['user-agent']?.substring(0, 100) || 'Web Browser',
          pushToken: subscription.endpoint,
          pushSubscription: subscription,
          isActive: true,
          lastActiveAt: new Date(),
          notificationsEnabled: true,
        })
        .returning();

      res.status(201).json({ message: 'Subscription registered', deviceId: device.id });
    } catch (error) {
      console.error('Error registering push subscription:', error);
      res.status(500).json({ message: 'Failed to register subscription' });
    }
  });

  // Unregister push subscription
  app.delete('/api/mobile/push-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { endpoint } = req.body;

      if (!endpoint) {
        return res.status(400).json({ message: 'Endpoint required' });
      }

      const { mobileDevices } = await import('@shared/schema');

      await db.update(mobileDevices)
        .set({ isActive: false, notificationsEnabled: false, updatedAt: new Date() })
        .where(and(
          eq(mobileDevices.userId, userId),
          eq(mobileDevices.pushToken, endpoint)
        ));

      res.json({ message: 'Subscription removed' });
    } catch (error) {
      console.error('Error removing push subscription:', error);
      res.status(500).json({ message: 'Failed to remove subscription' });
    }
  });

  // Register mobile device (for native apps)
  app.post('/api/mobile/devices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { deviceType, deviceName, deviceFingerprint, pushToken } = req.body;

      if (!deviceType || !['ios', 'android', 'web'].includes(deviceType)) {
        return res.status(400).json({ message: 'Invalid device type' });
      }

      const { mobileDevices } = await import('@shared/schema');

      // Check for existing device by fingerprint
      if (deviceFingerprint) {
        const existing = await db.select()
          .from(mobileDevices)
          .where(and(
            eq(mobileDevices.userId, userId),
            eq(mobileDevices.deviceFingerprint, deviceFingerprint)
          ));

        if (existing.length > 0) {
          // Update existing device
          const [updated] = await db.update(mobileDevices)
            .set({
              deviceName,
              pushToken,
              isActive: true,
              lastActiveAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(mobileDevices.id, existing[0].id))
            .returning();

          return res.json({ message: 'Device updated', device: updated });
        }
      }

      // Create new device
      const [device] = await db.insert(mobileDevices)
        .values({
          userId,
          deviceType,
          deviceName: deviceName || `${deviceType} Device`,
          deviceFingerprint,
          pushToken,
          isActive: true,
          lastActiveAt: new Date(),
          notificationsEnabled: true,
        })
        .returning();

      res.status(201).json({ message: 'Device registered', device });
    } catch (error) {
      console.error('Error registering device:', error);
      res.status(500).json({ message: 'Failed to register device' });
    }
  });

  // Get user's registered devices
  app.get('/api/mobile/devices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { mobileDevices } = await import('@shared/schema');

      const devices = await db.select()
        .from(mobileDevices)
        .where(and(
          eq(mobileDevices.userId, userId),
          eq(mobileDevices.isActive, true)
        ))
        .orderBy(desc(mobileDevices.lastActiveAt));

      res.json(devices);
    } catch (error) {
      console.error('Error fetching devices:', error);
      res.status(500).json({ message: 'Failed to fetch devices' });
    }
  });

  // Update notification preferences
  app.patch('/api/mobile/devices/:deviceId/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { deviceId } = req.params;
      const { notificationsEnabled, notificationPreferences } = req.body;

      const { mobileDevices } = await import('@shared/schema');

      // Verify device belongs to user
      const [device] = await db.select()
        .from(mobileDevices)
        .where(and(
          eq(mobileDevices.id, deviceId),
          eq(mobileDevices.userId, userId)
        ));

      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      const [updated] = await db.update(mobileDevices)
        .set({
          notificationsEnabled: notificationsEnabled ?? device.notificationsEnabled,
          notificationPreferences: notificationPreferences ?? device.notificationPreferences,
          updatedAt: new Date(),
        })
        .where(eq(mobileDevices.id, deviceId))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error('Error updating preferences:', error);
      res.status(500).json({ message: 'Failed to update preferences' });
    }
  });

  // Delete device
  app.delete('/api/mobile/devices/:deviceId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { deviceId } = req.params;

      const { mobileDevices } = await import('@shared/schema');

      // Verify device belongs to user then deactivate
      const result = await db.update(mobileDevices)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(
          eq(mobileDevices.id, deviceId),
          eq(mobileDevices.userId, userId)
        ));

      res.json({ message: 'Device removed' });
    } catch (error) {
      console.error('Error removing device:', error);
      res.status(500).json({ message: 'Failed to remove device' });
    }
  });

  // Mobile JWT authentication - Login endpoint
  app.post('/api/mobile/auth/login', async (req, res) => {
    try {
      const { email, password, deviceInfo } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }

      // Get user by email
      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // B2B check - reject candidates
      if (user.role === 'candidate') {
        return res.status(403).json({ message: 'Mobile access is for Company Admins and Recruiters only' });
      }

      // Verify password
      const isValid = await comparePassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT tokens
      const crypto = await import('crypto');
      const accessTokenId = crypto.randomUUID();
      const refreshTokenId = crypto.randomUUID();

      // Token expiry times
      const accessTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create simple tokens (in production, use proper JWT library)
      const accessToken = Buffer.from(JSON.stringify({
        jti: accessTokenId,
        sub: user.id,
        role: user.role,
        companyId: user.companyId,
        exp: accessTokenExpiry.getTime(),
        type: 'access'
      })).toString('base64');

      const refreshToken = Buffer.from(JSON.stringify({
        jti: refreshTokenId,
        sub: user.id,
        exp: refreshTokenExpiry.getTime(),
        type: 'refresh'
      })).toString('base64');

      // Store tokens for revocation capability
      const { mobileApiTokens } = await import('@shared/schema');
      
      await db.insert(mobileApiTokens).values([
        {
          userId: user.id,
          tokenHash: crypto.createHash('sha256').update(accessTokenId).digest('hex'),
          tokenType: 'access',
          expiresAt: accessTokenExpiry,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
        {
          userId: user.id,
          tokenHash: crypto.createHash('sha256').update(refreshTokenId).digest('hex'),
          tokenType: 'refresh',
          expiresAt: refreshTokenExpiry,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }
      ]);

      // Register device if info provided
      if (deviceInfo?.deviceType) {
        const { mobileDevices } = await import('@shared/schema');
        await db.insert(mobileDevices)
          .values({
            userId: user.id,
            deviceType: deviceInfo.deviceType,
            deviceName: deviceInfo.deviceName || 'Mobile Device',
            deviceFingerprint: deviceInfo.deviceFingerprint,
            pushToken: deviceInfo.pushToken,
            isActive: true,
            lastActiveAt: new Date(),
            notificationsEnabled: true,
          })
          .onConflictDoNothing();
      }

      const { passwordHash, emailVerificationToken, ...safeUser } = user;

      res.json({
        accessToken,
        refreshToken,
        expiresIn: 15 * 60, // 15 minutes in seconds
        user: safeUser,
      });
    } catch (error) {
      console.error('Mobile login error:', error);
      res.status(500).json({ message: 'Authentication failed' });
    }
  });

  // Mobile JWT refresh
  app.post('/api/mobile/auth/refresh', async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token required' });
      }

      // Decode and validate refresh token
      let tokenData;
      try {
        tokenData = JSON.parse(Buffer.from(refreshToken, 'base64').toString());
      } catch {
        return res.status(401).json({ message: 'Invalid token format' });
      }

      if (tokenData.type !== 'refresh' || tokenData.exp < Date.now()) {
        return res.status(401).json({ message: 'Token expired or invalid' });
      }

      // Verify token not revoked
      const { mobileApiTokens } = await import('@shared/schema');
      const crypto = await import('crypto');
      const tokenHash = crypto.createHash('sha256').update(tokenData.jti).digest('hex');

      const [storedToken] = await db.select()
        .from(mobileApiTokens)
        .where(and(
          eq(mobileApiTokens.tokenHash, tokenHash),
          eq(mobileApiTokens.userId, tokenData.sub)
        ));

      if (!storedToken || storedToken.revokedAt) {
        return res.status(401).json({ message: 'Token revoked' });
      }

      // Get user
      const user = await storage.getUser(tokenData.sub);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Generate new access token
      const newAccessTokenId = crypto.randomUUID();
      const newAccessTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

      const newAccessToken = Buffer.from(JSON.stringify({
        jti: newAccessTokenId,
        sub: user.id,
        role: user.role,
        companyId: user.companyId,
        exp: newAccessTokenExpiry.getTime(),
        type: 'access'
      })).toString('base64');

      // Store new access token
      await db.insert(mobileApiTokens).values({
        userId: user.id,
        tokenHash: crypto.createHash('sha256').update(newAccessTokenId).digest('hex'),
        tokenType: 'access',
        expiresAt: newAccessTokenExpiry,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        accessToken: newAccessToken,
        expiresIn: 15 * 60,
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({ message: 'Token refresh failed' });
    }
  });

  // Mobile logout - revoke tokens
  app.post('/api/mobile/auth/logout', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.json({ message: 'Logged out' });
      }

      const token = authHeader.substring(7);
      let tokenData;
      try {
        tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
      } catch {
        return res.json({ message: 'Logged out' });
      }

      // Revoke all tokens for this user
      const { mobileApiTokens } = await import('@shared/schema');
      
      await db.update(mobileApiTokens)
        .set({ revokedAt: new Date() })
        .where(eq(mobileApiTokens.userId, tokenData.sub));

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Mobile logout error:', error);
      res.json({ message: 'Logged out' });
    }
  });

  // Mobile-friendly data endpoints
  app.get('/api/mobile/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const companyId = req.user.companyId;

      if (!companyId) {
        return res.status(403).json({ message: 'No company associated' });
      }

      // Get summary data for mobile dashboard
      const [jobsData, applicationsData] = await Promise.all([
        storage.getJobs(companyId, { limit: 5 }),
        storage.getApplications(companyId, { limit: 10 }),
      ]);

      // Get counts
      const activeJobsCount = jobsData.data.filter(j => j.status === 'active').length;
      const pendingApplicationsCount = applicationsData.data.filter(a => a.status === 'applied').length;
      const scheduledInterviewsCount = applicationsData.data.filter(a => a.status === 'scheduled').length;

      res.json({
        summary: {
          activeJobs: activeJobsCount,
          pendingApplications: pendingApplicationsCount,
          scheduledInterviews: scheduledInterviewsCount,
          totalApplications: applicationsData.total,
        },
        recentJobs: jobsData.data.slice(0, 5),
        recentApplications: applicationsData.data.slice(0, 10),
      });
    } catch (error) {
      console.error('Mobile dashboard error:', error);
      res.status(500).json({ message: 'Failed to load dashboard' });
    }
  });

  return server;
}
