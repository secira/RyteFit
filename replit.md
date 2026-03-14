# RyteFit SaaS Platform

## Overview
RyteFit is an AI-powered interview platform designed for SMBs to streamline their hiring processes. It offers features such as AI-driven question generation, intelligent candidate evaluation, and comprehensive hiring workflow management. The platform supports both asynchronous pre-recorded and live AI-assisted interview modes, aiming to reduce hiring time, eliminate manual screening inefficiencies, and provide data-driven insights through AI. RyteFit's vision is to democratize enterprise-grade interview capabilities for SMBs. This is a B2B product, restricted to Company Admins and Recruiters; candidate login/signup is disabled.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
RyteFit utilizes a modern web architecture consisting of a React 18 frontend (TypeScript, Vite, Radix UI, shadcn/ui, Tailwind CSS), a Node.js Express.js backend (TypeScript, ES modules), and a PostgreSQL database (Neon serverless) managed with Drizzle ORM. Authentication is handled via OpenID Connect (OIDC) with Replit Auth, restricted to `company_admin` and `recruiter` roles.

**UI/UX Decisions:**
The platform features a corporate design system with a blue/gray palette, light/dark mode, and enterprise-grade components focused on recruiter productivity.

**Technical Implementations:**
- **AI Integration:** Leverages AI for question generation (GPT-4), candidate evaluation (LangGraph-based agentic workflow), video transcription (Whisper API), sentiment analysis, and resume parsing (GPT-4o).
- **Agentic AI Workflow System:** An event-driven orchestration system using PostgreSQL LISTEN/NOTIFY and a LangGraph state machine manages a 6-step job-centric recruitment pipeline. Autonomous agents coordinate via an event bus and task queue (`agent_tasks` table).
- **Job Management:** Includes AI-driven competency extraction and tracking of postings across various platforms (RyteFit Career Site, LinkedIn, Indeed, etc.)
- **Resume Screening:** Supports bulk upload, AI parsing with GPT-4o scoring, and candidate ranking. Features a robust duplicate prevention system for applications.
- **Interview System:** Provides AI-generated questions, text-to-speech for questions, voice-only answers with live transcription, continuous video recording, and per-question timers. Includes an "interview complete" page and a replay button for review.
- **Candidate Evaluation:** Offers multi-dimensional scoring, comparative ranking, and exportable reports. AI evaluation generates `overallScore`, `technicalScore`, `communicationScore`, `problemSolvingScore`, and `confidenceScore`, with recommendations (`strong_hire`, `maybe`, `no_hire`).
- **Workflow Rules:** A 7-step workflow manages job and application lifecycles: Job Created, Job Posted, Resumes Uploaded, Interview Scheduled, Interview Completed, Interview Evaluation, and Final Decision.
- **Security & Compliance:** End-to-end encryption, GDPR compliance, consent management, and data retention.
- **Company Code System:** Unique 4-letter codes for each company, used in job application IDs.
- **Job Deletion:** Implemented with cascade delete functionality to remove all related data.
- **Interview Simulation:** Allows candidates to practice the AI interview process before applying, without saving data to applications or evaluations.
- **PWA Support:** Progressive Web App with offline caching, background sync, and installable app experience. Service worker uses cache-first strategy for static assets and network-first for API calls.
- **Mobile Backend API:** JWT-based authentication for mobile apps with device registration, push notification subscriptions, and mobile-friendly dashboard endpoints. Access tokens expire after 15 minutes, refresh tokens after 7 days.

**System Design Choices:**
- **B2B Product Only:** Access is restricted to Company Admins and Recruiters; all candidate-facing login/signup functionalities are blocked.
- **Public Job API:** Enables external resume sites (e.g., ryteresume.com) to fetch active jobs and submit applications, including resume uploads with automatic AI parsing.

## External Dependencies
- **Frontend:** React 18, React DOM, TanStack Query, Vite, TypeScript, Radix UI, shadcn/ui, Tailwind CSS.
- **Backend/Database:** Node.js, Express.js, PostgreSQL (Neon serverless), Drizzle ORM, `drizzle-kit`, `postgres.js`.
- **Authentication:** Replit OIDC, `express-session`, `connect-pg-simple`, `passport.js`, `openid-client`.
- **AI/ML:** OpenAI (GPT-4, Whisper), LangChain (`@langchain/openai`, `@langchain/core`, `@langchain/langgraph`).
- **Media/Communication:** `ws` (WebSockets), Browser MediaRecorder API, `@google-cloud/storage`, Resend (email notifications).
- **Utilities:** `react-hook-form`, Zod, `date-fns`, `clsx`, `tailwind-merge`, Lucide React, `multer`, `pdf-parse`, Mammoth.