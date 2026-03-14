# RyteFit Platform Documentation

## Platform Overview

RyteFit is a B2B AI-powered recruitment platform designed exclusively for SMBs (Small and Medium Businesses). It streamlines the hiring process through AI-driven resume screening, intelligent interview automation, and data-driven candidate evaluation. The platform is restricted to Company Admins and Recruiters only - candidate login/signup is disabled.

---

## 1. Core Features

### A. Job Management

| Feature | Description |
|---------|-------------|
| Job Creation | Create job postings with title, department, location, salary range (INR), requirements |
| AI Description Generator | GPT-4 powered job description generation |
| Three-State Workflow | Draft → Active → Posted lifecycle |
| Multi-Platform Posting | Post to RyteFit Career Site, LinkedIn, Indeed, Naukri, and other platforms |
| Unique Job IDs | Format: `{CompanyCode}{Date}{Sequence}` (e.g., SCTE20241120001) |
| Skill Extraction | AI automatically extracts required skills from job descriptions |

### B. Resume Screening System

| Feature | Description |
|---------|-------------|
| Bulk Upload | Upload multiple resumes (PDF, DOCX) at once |
| AI Parsing | GPT-4o extracts candidate data, skills, experience |
| 7-Parameter Weighted Scoring | Skills Match (35%), Experience (25%), Work History (20%), Education (15%), Keywords (5%), Cultural Fit (5%), Overall Score |
| Candidate Ranking | Automatic ranking based on AI scores |
| Duplicate Prevention | Detects duplicate applications per job |

### C. AI Interview System

| Feature | Description |
|---------|-------------|
| Dynamic Question Generation | 8-30 questions based on job complexity (Claude 3.5 Sonnet) |
| Question De-duplication | Avoids repeating questions asked in last 30 days for same job |
| Concept Coverage Analysis | Shows candidates what % of job concepts are covered (min 60%) |
| Text-to-Speech (TTS) | Questions read aloud using OpenAI TTS-1 |
| Voice Recognition | Whisper-1 for speech-to-text transcription |
| Unified Text Input | Single editable textarea for voice + typed answers |
| Continuous Video Recording | 320x240, 10-15 FPS, WebM (VP9/Opus) |
| 60-Minute Time Limit | Overall interview limit with 5-minute warning, auto-submit |
| No Per-Question Limits | Candidates manage their own time |

### D. Interview Evaluation

| Feature | Description |
|---------|-------------|
| Multi-Dimensional Scoring | Overall, Technical, Communication, Problem-Solving, Confidence scores |
| AI Recommendations | Strong Hire, Maybe, No Hire classifications |
| Comparative Analysis | Side-by-side candidate comparison |
| Video Replay | Review recorded interview sessions |
| Exportable Reports | Generate selection reports |

### E. Candidate Management

| Feature | Description |
|---------|-------------|
| Application Tracking | Applied → Screened → Interview Scheduled → Completed → Decision |
| Selection Decisions | Shortlist, Reject, Offer with notes |
| Interview Scheduling | Send interview links via email (Resend) |
| Email Notifications | Automated emails from noreply@rytefit.com |

---

## 2. System Architecture

### Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI |
| **Backend** | Node.js, Express.js, TypeScript (ES Modules) |
| **Database** | PostgreSQL (Neon Serverless), Drizzle ORM |
| **Authentication** | OpenID Connect (Replit Auth), Passport.js, Express Sessions |
| **AI/ML** | OpenAI GPT-4/4o, Claude 3.5 Sonnet, Whisper-1, TTS-1, LangGraph |
| **Storage** | Google Cloud Storage (video recordings) |
| **Email** | Resend API |
| **WebSockets** | Real-time interview communication |

### Database Schema (Key Tables)

```
companies              - Organization profiles & subscriptions
users                  - Admins, recruiters (no candidates)
jobs                   - Job postings with AI-extracted skills
jobPlatformPostings    - Multi-platform posting tracking
applications           - Candidate submissions
resumes                - Parsed resume data
screeningResults       - AI scoring results
interviewSessions      - Interview scheduling & status
interviewMessages      - Q&A pairs from interviews
interviewEvaluations   - AI interview assessments
selectionDecisions     - Final hiring decisions
workflowRuns           - Agentic AI workflow tracking
agentTasks             - Background job queue
notifications          - User alerts
```

---

## 3. User Roles & Access

| Role | Access Level |
|------|--------------|
| **Platform Admin** | Full system access, manage companies, analytics |
| **Company Admin** | Company settings, all recruiters, all jobs |
| **Recruiter** | Job management, resume screening, interviews, decisions |
| **Candidate** | Login DISABLED (B2B only) |

---

## 4. Public APIs

| Endpoint | Purpose |
|----------|---------|
| `GET /api/public/jobs` | Fetch active job listings (for external sites) |
| `POST /api/public/applications` | Submit applications from external sources |
| `GET /api/public/interview/:token` | Access interview by secure token |
| `POST /api/public/interview/:token/submit` | Submit completed interview |

---

## 5. AI Models Used

| Function | Model |
|----------|-------|
| Interview Questions | Claude 3.5 Sonnet (fallback: GPT-4o) |
| Resume Parsing & Scoring | GPT-4o |
| Job Description Generation | GPT-4 |
| Voice Transcription | Whisper-1 |
| Text-to-Speech | TTS-1 |
| Interview Evaluation | GPT-4o |
| Workflow Orchestration | LangGraph State Machine |

---

## 6. Workflow Automation

The platform uses an event-driven agentic AI system:

1. **Job Created** - Draft state
2. **Job Posted** - Active on platforms
3. **Resumes Uploaded** - AI parsing triggers
4. **Interview Scheduled** - Email sent to candidate
5. **Interview Completed** - Video uploaded, transcribed
6. **Interview Evaluated** - AI scoring runs
7. **Final Decision** - Selection recorded

---

## 7. Pages & Modules

### Recruiter/Admin Pages
- Dashboard, Jobs, Job Posting, Resume Screening
- Applications, Applicants Detail, Candidates
- Interviews, Interview Evaluations, Candidate Ranking
- Selection Reports, Workflows, Company Settings

### Public Pages
- Landing Page, How It Works, Pricing, Blog
- Careers, Privacy Policy, Terms of Service
- Refund Policy, Risk Disclosure, Regulatory Info

### Interview Pages (Token-Based)
- Interview Scheduling, AI Interview Room, Interview Complete

---

## 8. Key Business Logic

- **Currency**: INR throughout
- **Company Codes**: Unique 4-letter codes for each company
- **Job IDs**: `{CompanyCode}{YYYYMMDD}{Sequence}`
- **Subscription Tiers**: Trial, Starter, Professional, Enterprise
- **Monthly Interview Limits**: Based on subscription tier

---

## 9. Recent Features (December 2024)

### Question De-duplication
- Queries `interview_messages` table for questions asked in last 30 days
- Passes previous questions to AI with instruction to avoid repetition
- Ensures each candidate gets unique questions while testing same competencies

### Concept Coverage Analysis
- Extracts skills/concepts from job's `extractedSkills` field
- AI maps each question to concepts it tests
- Calculates coverage percentage (minimum 60% target)
- Displays coverage info to candidates during interview:
  - Coverage percentage badge
  - Progress bar visualization
  - List of covered concepts

### Interview Timing Changes
- Removed per-question time limits
- Single 60-minute overall interview limit
- 5-minute warning before expiry
- Auto-submit when time expires
- Candidates manage their own time across questions

---

## 10. File Structure

```
client/src/
  pages/           - React page components
  components/      - Reusable UI components
  hooks/           - Custom React hooks
  lib/             - Utilities and API client

server/
  routes.ts        - Express API routes
  storage.ts       - Database operations
  interviewAgent.ts - AI interview logic
  agents/          - LangGraph workflow agents

shared/
  schema.ts        - Drizzle ORM database schema
```

---

## 11. Environment Variables

| Variable | Purpose |
|----------|---------|
| DATABASE_URL | PostgreSQL connection string |
| OPENAI_API_KEY | OpenAI API for GPT-4, Whisper, TTS |
| ANTHROPIC_API_KEY | Claude 3.5 Sonnet (optional) |
| RESEND_API_KEY | Email service |
| GOOGLE_CLOUD_STORAGE | Video storage credentials |

---

*Last Updated: December 2024*
