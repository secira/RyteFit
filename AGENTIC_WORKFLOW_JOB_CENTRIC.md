# Job-Centric Agentic Workflow System

## Overview
This document describes the redesigned 6-step job-centric recruitment workflow that tracks the complete hiring lifecycle from job creation to candidate selection.

## Architecture Change
**Previous Design:** Application-centric workflow starting when a candidate applies
**New Design:** Job-centric workflow starting when a recruiter creates a job posting

## 6-Step Workflow Pipeline

### Step 1: Job Creation (NEW)
**Agent:** JobCreationAgent  
**Purpose:** AI-powered job description generator  
**Features:**
- AI template library (10+ job types: Software Engineer, Data Scientist, Sales Manager, etc.)
- ChatGPT-4 powered custom job description generation
- Manual input with AI enhancement
- Job requirements extraction (skills, experience, education)
- Automatic keyword optimization for ATS compatibility

**States:**
- `job_draft` - Recruiter starts creating job
- `job_ai_generating` - AI generating description from template/prompt
- `job_created` - Job description finalized

**Workflow Trigger:** Recruiter clicks "Create New Job"

---

### Step 2: Job Posting (NEW)
**Agent:** JobPostingAgent  
**Purpose:** Distribute job postings to internal and external platforms  
**Features:**
- **Internal Posting:** Publish to company career page (auto-enabled)
- **External Job Boards:** LinkedIn, Indeed, Glassdoor integration
- Multi-platform posting with single click
- Track posting status (published, expired, closed)
- Auto-generate social media snippets

**States:**
- `job_posting_pending` - Waiting for posting approval
- `job_posting_active` - Posted and accepting applications
- `job_posting_closed` - No longer accepting applications

**Workflow Trigger:** Recruiter clicks "Publish Job"

---

### Step 3: Resume Screening (EXISTING)
**Agent:** ResumeScreenerAgent (GPT-4o)  
**Purpose:** AI-powered resume analysis and candidate filtering  
**Features:**
- Bulk resume upload (PDF, DOCX, TXT, ZIP)
- Semantic skill matching against job requirements
- Experience level assessment
- Education verification
- Automatic candidate ranking (0-100 score)
- Pass/fail threshold: 75+

**States:**
- `application_submitted` - Candidate applies
- `resume_screening` - AI analyzing resume
- `screen_passed` - Candidate qualified (score ≥ 75)
- `screen_failed` - Candidate rejected (score < 75)

**Workflow Trigger:** Candidate submits application

---

### Step 4: Interview Evaluation (EXISTING)
**Agent:** InterviewEvaluatorAgent (GPT-4o + Whisper)  
**Purpose:** AI video/audio interview transcription and scoring  
**Features:**
- Whisper API transcription (99% accuracy)
- Multi-dimensional evaluation:
  - Technical competency (40%)
  - Communication skills (30%)
  - Cultural fit (20%)
  - Confidence level (10%)
- Response quality scoring per question
- Overall interview score (0-100)

**States:**
- `interview_scheduled` - Interview invitation sent
- `interviewing` - Candidate taking interview
- `interview_completed` - Responses submitted
- `interview_evaluated` - AI scoring complete

**Workflow Trigger:** Interview completion

---

### Step 5: Candidate Ranking (EXISTING)
**Agent:** RankingAgent  
**Purpose:** Weighted candidate comparison and ranking  
**Formula:**
```
Final Score = (0.4 × Screening Score) + (0.6 × Interview Score)
```

**Features:**
- Automatic ranking updates when new candidates complete interviews
- Comparative analysis across all candidates for same job
- Real-time leaderboard
- Rank change notifications

**States:**
- `ranking_in_progress` - Calculating ranks
- `ranked` - Final ranking assigned

**Workflow Trigger:** Interview evaluation complete OR new candidate evaluated

---

### Step 6: Reporting & Notification (EXISTING)
**Agent:** NotificationAgent  
**Purpose:** Automated email notifications and reporting  
**Email Types:**
- Screening rejection (failed candidates)
- Interview invitation (qualified candidates)
- Interview reminder (24 hours before)
- Offer letter (selected candidates)
- Final rejection (not selected after interview)
- Offer acceptance confirmation

**Report Types:**
- Candidate evaluation report (PDF)
- Hiring pipeline analytics
- Time-to-hire metrics
- Source effectiveness analysis

**States:**
- `offer_sent` - Offer letter sent
- `offer_accepted` - Candidate accepted
- `offer_rejected` - Candidate declined
- `rejected` - Final rejection

**Workflow Trigger:** State transitions requiring notifications

---

## Complete State Machine Flow

```
JOB LIFECYCLE:
job_draft → job_ai_generating → job_created → job_posting_pending → job_posting_active

CANDIDATE LIFECYCLE (per application):
application_submitted → resume_screening → [screen_passed OR screen_failed]

IF screen_passed:
  → interview_scheduled → interviewing → interview_completed → interview_evaluated → ranking_in_progress → ranked → [selected OR rejected]

IF screen_failed:
  → rejected (email sent)

IF selected:
  → offer_sent → [offer_accepted OR offer_rejected]
```

---

## Multi-Tenant Data Isolation

### Job-Level Tracking
- Every job has unique ID (`jobs.id`)
- Every workflow run tracks `jobId` (not just applicationId)
- Company-level isolation via `companyId` foreign key

### Database Schema Changes Required
```typescript
// workflow_runs table UPDATE
workflow_runs {
  id: varchar (primary key)
  jobId: varchar (NEW - foreign key to jobs.id)
  applicationId: varchar (nullable - only for candidate workflows)
  currentState: workflow_state
  status: 'active' | 'paused' | 'completed' | 'failed'
  // ... rest of fields
}
```

### Data Access Rules
```sql
-- Recruiters can only see jobs from their company
SELECT * FROM jobs WHERE companyId = :recruiterCompanyId

-- Workflows are company-isolated
SELECT wr.* FROM workflow_runs wr
JOIN jobs j ON wr.jobId = j.id
WHERE j.companyId = :companyId

-- Candidates can only see their own applications
SELECT * FROM applications WHERE candidateId = :userId
```

---

## New Agent Implementations

### JobCreationAgent
**File:** `server/agents/job-creator.ts`  
**Model:** GPT-4o  
**Input:**
- Job role/title
- Template selection OR custom prompt
- Company context (industry, size, culture)

**Output:**
- Complete job description (markdown)
- Required skills list
- Experience requirements
- Education requirements
- Salary range (optional)

**Example Templates:**
1. Software Engineer - Full Stack
2. Data Scientist - ML/AI
3. Product Manager
4. Sales Manager
5. Marketing Specialist
6. Customer Success Manager
7. DevOps Engineer
8. UX Designer
9. HR Manager
10. Finance Analyst

---

### JobPostingAgent
**File:** `server/agents/job-poster.ts`  
**Integrations:**
- LinkedIn Jobs API (OAuth)
- Indeed API
- Glassdoor API
- Internal career page (auto-enabled)

**Features:**
- Single-click multi-platform posting
- Auto-generate social media posts
- Track application sources
- Auto-close after 30 days (configurable)

---

## UI Components Needed

### 1. Job Creation Wizard (`/jobs/create`)
- Step 1: Choose template or custom
- Step 2: AI generates description (with loading state)
- Step 3: Review and edit
- Step 4: Add requirements and details
- Step 5: Preview and create

### 2. Job Posting Manager (`/jobs/:id/post`)
- Internal posting (always on)
- External platforms (checkboxes)
- Social media snippets
- Posting status dashboard

### 3. Job-Centric Workflow Dashboard (`/workflows`)
- Filter by job ID
- Show all candidates per job
- Workflow progress visualization
- Real-time status updates

---

## Event Types Additions

```typescript
// Job creation events
JOB_DRAFT_CREATED: 'job_draft_created'
JOB_AI_GENERATION_STARTED: 'job_ai_generation_started'
JOB_AI_GENERATION_COMPLETED: 'job_ai_generation_completed'
JOB_CREATED: 'job_created'

// Job posting events
JOB_POSTING_STARTED: 'job_posting_started'
JOB_POSTED_INTERNAL: 'job_posted_internal'
JOB_POSTED_LINKEDIN: 'job_posted_linkedin'
JOB_POSTED_INDEED: 'job_posted_indeed'
JOB_POSTING_COMPLETED: 'job_posting_completed'
JOB_CLOSED: 'job_closed'
```

---

## Agent Types Additions

```typescript
JOB_CREATOR: 'job_creator'
JOB_POSTER: 'job_poster'
```

---

## Task Types Additions

```typescript
CREATE_JOB_DESCRIPTION: 'create_job_description'
POST_JOB_INTERNAL: 'post_job_internal'
POST_JOB_LINKEDIN: 'post_job_linkedin'
POST_JOB_INDEED: 'post_job_indeed'
```

---

## Implementation Priority

1. ✅ Update event types and state definitions
2. ✅ Add `jobId` to `workflow_runs` schema
3. ✅ Create JobCreationAgent with template library
4. ✅ Create JobPostingAgent (internal first, external later)
5. ✅ Build Job Creation UI wizard
6. ✅ Build Job Posting UI dashboard
7. ✅ Update Workflow Dashboard to show job-centric view
8. ✅ Integrate existing agents into job-centric flow
9. ✅ Testing with multi-tenant data isolation

---

## Success Metrics

- **Job Creation Time:** < 5 minutes (with AI templates)
- **Posting Distribution:** 3+ platforms with one click
- **Resume Screening:** 100+ resumes/minute
- **Interview Evaluation:** 15-minute interviews scored in < 2 minutes
- **End-to-End Hiring:** 7-14 days (from job creation to offer)

---

## Future Enhancements

- Auto-generate interview questions based on job description
- AI-powered salary benchmarking
- Candidate sourcing recommendations
- Automated reference checking
- Video interview scheduling with calendar integration
- SMS notifications via Twilio
- WhatsApp notifications
