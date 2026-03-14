# 🤖 Agentic AI Workflow - Visual Architecture

## System Overview
**Event-Driven Autonomous Workflow Orchestration using LangGraph + PostgreSQL LISTEN/NOTIFY**

---

## 📊 Complete Workflow State Machine

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CANDIDATE APPLICATION LIFECYCLE                       │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │  SUBMITTED  │ ◄── Entry Point
                              └──────┬──────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │     SCREENING         │ ◄── 🤖 ResumeScreenerAgent
                         │  (AI Resume Analysis) │
                         └───────────┬───────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
                    ▼                                 ▼
            ┌──────────────┐                 ┌──────────────┐
            │SCREEN_PASSED │                 │SCREEN_FAILED │
            │  (Score≥75)  │                 │  (Score<75)  │
            └──────┬───────┘                 └──────┬───────┘
                   │                                │
                   │                                │
                   ▼                                │
        ┌─────────────────────┐                    │
        │ INTERVIEW_SCHEDULED │                    │
        │   (Auto-scheduled)  │                    │
        └──────────┬──────────┘                    │
                   │                                │
                   ▼                                │
        ┌─────────────────────┐                    │
        │    INTERVIEWING     │                    │
        │ (Video/Audio taken) │                    │
        └──────────┬──────────┘                    │
                   │                                │
                   ▼                                │
        ┌─────────────────────┐                    │
        │     EVALUATED       │ ◄── 🤖 InterviewEvaluatorAgent
        │ (AI Transcription + │                    │
        │     Scoring)        │                    │
        └──────────┬──────────┘                    │
                   │                                │
                   ▼                                │
        ┌─────────────────────┐                    │
        │      RANKED         │ ◄── 🤖 RankingAgent  │
        │  (All candidates    │                    │
        │  compared & scored) │                    │
        └──────────┬──────────┘                    │
                   │                                │
       ┌───────────┴────────────┐                  │
       │                        │                  │
       ▼                        ▼                  ▼
┌─────────────┐         ┌─────────────┐    ┌─────────────┐
│  SELECTED   │         │  REJECTED   │◄───│  REJECTED   │
│  (Recruiter │         │  (Recruiter │    │   (Auto)    │
│   Decision) │         │   Decision) │    └─────────────┘
└──────┬──────┘         └─────────────┘
       │                        ▲
       ▼                        │
┌─────────────┐                 │
│ OFFER_SENT  │ ◄── 🤖 NotificationAgent (All states)
└──────┬──────┘
       │
  ┌────┴──────┐
  │           │
  ▼           ▼
┌──────────┐ ┌──────────┐
│  OFFER   │ │  OFFER   │
│ ACCEPTED │ │ REJECTED │
└──────────┘ └──────────┘
```

---

## 🤖 Four Autonomous AI Agents

### 1️⃣ **ResumeScreenerAgent** (GPT-4o)
**Triggers:** When application enters `SCREENING` state

**What it does:**
- Parses resume PDF/text
- Extracts skills, experience, education
- Compares against job requirements
- Generates 0-100 score based on:
  - 40% Skill match
  - 30% Experience level
  - 20% Education/qualifications
  - 10% Overall career fit
- Identifies strengths & concerns
- **Decision:** Score ≥75 → SCREEN_PASSED, else SCREEN_FAILED

**Output:** Stored in `screening_results` table

---

### 2️⃣ **InterviewEvaluatorAgent** (GPT-4o + Whisper)
**Triggers:** When interview enters `EVALUATED` state

**What it does:**
- Transcribes video/audio using Whisper API
- Analyzes responses for:
  - Technical competency
  - Communication skills
  - Confidence level
  - Cultural fit
  - Problem-solving ability
- Generates 0-100 evaluation score
- Provides detailed feedback per question

**Output:** Stored in `interview_evaluations` table

---

### 3️⃣ **RankingAgent**
**Triggers:** After interview evaluation completes

**What it does:**
- Retrieves all evaluated candidates for the job
- Calculates composite score:
  ```
  Final Score = (Screening Score × 40%) + (Evaluation Score × 60%)
  ```
- Ranks candidates 1, 2, 3, etc.
- Updates `applications.finalRank` and `applications.rankingScore`
- Enables recruiter to see top candidates at a glance

**Output:** Updated `applications` table with ranks

---

### 4️⃣ **NotificationAgent** (Email)
**Triggers:** On every state transition

**What it does:**
- Sends professional email notifications:
  - Application received confirmation
  - Screening results (pass/fail)
  - Interview invitation
  - Interview reminder
  - Evaluation complete
  - Selection notification
  - Offer letter
  - Rejection (with feedback)
- Tracks email delivery in `workflow_events`
- Professional HTML templates per state

**Output:** Logged in `workflow_events` table

---

## 🔄 Event-Driven Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                PostgreSQL LISTEN/NOTIFY Event Bus                │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ Emits Events
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   LangGraph  │      │  AI Agents   │      │   Database   │
│State Machine │──────│  Subscribe & │──────│   Updates    │
│              │      │    Execute   │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  workflow_events    │
                    │  (Audit Trail)      │
                    └─────────────────────┘
```

---

## 📦 Database Architecture

### Core Workflow Tables

```sql
workflow_runs
├── id (primary key)
├── application_id (foreign key)
├── job_id (foreign key)
├── current_state (enum: submitted, screening, ranked, etc.)
├── status (pending, running, paused, completed, failed)
├── started_at, completed_at
└── metadata (JSON)

workflow_events
├── id (primary key)
├── workflow_run_id (foreign key)
├── event_type (screening_started, evaluation_completed, etc.)
├── from_state, to_state
├── triggered_by (system, ai_agent, recruiter, candidate)
├── agent_type (resume_screener, ranker, etc.)
├── data (JSON with scores, decisions, metadata)
└── timestamp

agent_tasks
├── id (primary key)
├── workflow_run_id (foreign key)
├── application_id (foreign key)
├── agent_type (resume_screener, interview_evaluator, ranker, etc.)
├── task_type (screen_resume, evaluate_interview, rank_candidates)
├── status (pending, running, completed, failed)
├── input_data, output_data (JSON)
└── started_at, completed_at
```

### Summary Fields in Applications Table

```sql
applications
├── ... (standard fields)
├── status (current workflow state)
├── screeningScore (0-100 from ResumeScreenerAgent)
├── evaluationScore (0-100 from InterviewEvaluatorAgent)
├── rankingScore (composite: 40% screening + 60% evaluation)
├── finalRank (1, 2, 3, etc. among all candidates)
└── workflowRunId (links to workflow_runs)
```

### Detailed Analytics Tables

```sql
screening_results
├── application_id
├── score
├── matched_skills, missing_skills
├── experience_match
├── reasoning, strengths, concerns
└── ai_model, screened_at

interview_evaluations
├── interview_session_id
├── application_id
├── overall_score
├── technical_score, communication_score, confidence_score
├── detailed_feedback (JSON per question)
├── transcription
├── ai_model, evaluated_at
└── evaluator_id
```

---

## ⚡ Event Types (36 Total)

### Application Lifecycle
- `application_submitted`

### Screening
- `screening_started`
- `screening_completed`
- `screening_failed`

### Interview
- `interview_scheduled`
- `interview_started`
- `interview_completed`
- `interview_cancelled`

### Evaluation
- `evaluation_started`
- `evaluation_completed`
- `evaluation_failed`

### Ranking
- `ranking_started`
- `ranking_completed`
- `ranking_updated`

### Decision
- `decision_made`
- `offer_sent`
- `offer_accepted`
- `offer_rejected`

### Notifications
- `email_sent`
- `email_failed`

### Workflow Control
- `workflow_paused`
- `workflow_resumed`
- `workflow_failed`
- `workflow_completed`
- `state_transition`

---

## 🎯 Scoring System

### Resume Screening (0-100)
```
Score = (Skill Match × 40%)
      + (Experience × 30%)
      + (Education × 20%)
      + (Overall Fit × 10%)

Decision: Score ≥ 75 → PASS, else FAIL
```

### Interview Evaluation (0-100)
```
Score = Average of:
  - Technical Competency
  - Communication Skills
  - Confidence Level
  - Cultural Fit
  - Problem Solving
```

### Final Ranking Score
```
Ranking Score = (Screening Score × 40%)
              + (Evaluation Score × 60%)

Candidates sorted by Ranking Score (descending)
Rank assigned: 1 (best), 2, 3, ..., N
```

---

## 🚀 Implementation Status

### ✅ Phase 1: COMPLETED
- ✅ Database schema with workflow tables
- ✅ Event bus (PostgreSQL LISTEN/NOTIFY)
- ✅ LangGraph state machine with 13 states
- ✅ ResumeScreenerAgent (GPT-4o)
- ✅ InterviewEvaluatorAgent (GPT-4o + Whisper)
- ✅ RankingAgent (40/60 weighted scoring)
- ✅ NotificationAgent (Email templates)
- ✅ All LSP errors resolved

### 🔄 Phase 2: IN PROGRESS
- ⏳ Background job processor service
- ⏳ Workflow management API endpoints
- ⏳ Recruiter dashboard with live workflow visualization
- ⏳ WebSocket real-time status updates
- ⏳ Resume upload UI
- ⏳ End-to-end workflow testing

### 📋 Phase 3: PLANNED
- 🔮 Live AI-assisted interviews
- 🔮 Advanced analytics dashboard
- 🔮 Team collaboration tools
- 🔮 Custom branding
- 🔮 SSO integration

---

## 📁 File Structure

```
server/
├── workflow/
│   ├── event-bus.ts        # PostgreSQL LISTEN/NOTIFY emitter
│   ├── event-types.ts      # 36 event types, 13 states, agent types
│   ├── state-machine.ts    # LangGraph workflow graph
│   └── trigger.ts          # Workflow initialization
│
├── agents/
│   ├── resume-screener.ts      # 🤖 Agent 1: Resume analysis
│   ├── interview-evaluator.ts  # 🤖 Agent 2: Interview scoring
│   ├── ranking-agent.ts        # 🤖 Agent 3: Candidate ranking
│   └── notification-agent.ts   # 🤖 Agent 4: Email notifications
│
└── routes.ts               # Workflow API endpoints (Phase 2)
```

---

## 🔐 Key Design Decisions

1. **Hybrid Data Model**
   - `applications` table stores workflow summaries (scores, ranks)
   - `screening_results` and `interview_evaluations` store detailed analytics
   - This enables fast queries while preserving audit trails

2. **Event-Driven Architecture**
   - All state transitions emit events
   - Agents subscribe to specific event types
   - Full audit trail in `workflow_events`

3. **Autonomous Agents**
   - Each agent operates independently
   - No tight coupling between agents
   - Agents communicate via events only

4. **Scoring Transparency**
   - 40/60 weighted scoring clearly documented
   - All AI decisions logged with reasoning
   - Recruiters can override AI decisions

5. **Security & Privacy**
   - All workflow actions logged
   - GDPR-compliant data handling
   - Role-based access control

---

## 🎓 Example Flow: Single Application

```
1. Candidate applies for "Senior Software Engineer" position
   → APPLICATION_SUBMITTED event

2. LangGraph transitions to SCREENING state
   → SCREENING_STARTED event

3. ResumeScreenerAgent activates:
   - Parses resume PDF
   - Extracts: ["Python", "React", "AWS", "5 years experience"]
   - Compares to job requirements
   - Score: 82/100
   - Decision: PASS
   → SCREENING_COMPLETED event

4. LangGraph transitions to SCREEN_PASSED → INTERVIEW_SCHEDULED
   → INTERVIEW_SCHEDULED event

5. NotificationAgent sends email: "Interview invitation"

6. Candidate takes AI interview (records 5 video responses)
   → INTERVIEWING state

7. InterviewEvaluatorAgent activates:
   - Transcribes all 5 responses using Whisper
   - Analyzes: Technical=85, Communication=90, Confidence=88
   - Overall Score: 87/100
   → EVALUATION_COMPLETED event

8. RankingAgent activates:
   - Gets all evaluated candidates for this job
   - Calculates: (82×0.4) + (87×0.6) = 85.0
   - Compares to other candidates
   - Assigns Rank: #2 out of 15 candidates
   → RANKING_COMPLETED event

9. Recruiter reviews dashboard, sees candidate ranked #2
   → Recruiter clicks "SELECT" button
   → DECISION_MADE event

10. LangGraph transitions to SELECTED → OFFER_SENT
    → NotificationAgent sends offer letter email

11. Candidate accepts offer
    → OFFER_ACCEPTED event (final state)
```

---

## 📊 Metrics & KPIs

The system tracks:
- Time per workflow stage
- AI agent execution times
- Email delivery rates
- Candidate conversion rates (submitted → hired)
- Average scores per job
- Screening pass/fail ratios
- Ranking distributions

All metrics queryable via `workflow_events` and `agent_tasks` tables.

---

**End of Visual Architecture Document**
