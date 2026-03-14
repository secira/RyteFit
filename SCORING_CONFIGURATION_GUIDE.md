# Resume Screening Configuration Guide

## How the AI Scoring Works

Your RyteFit platform uses **GPT-4o AI model** to score resumes against job requirements.

### 1. **Current Scoring Parameters** (in `server/agents/resume-screener.ts`)

```typescript
// Scoring Breakdown (from line 57-61):
- Skill match (40%)      // How many required skills does candidate have?
- Experience level (30%) // Does candidate meet experience requirements?
- Education (20%)        // Does candidate have relevant education?
- Overall fit (10%)      // Does career trajectory align with role?
```

### 2. **Resume Data Flow**

```
User clicks Score Button
    ↓
Frontend calls: POST /api/applications/:id/score
    ↓
Backend fetches:
  - Application data
  - Resume file (from resumes table, rawText field)
  - Job description & required skills
    ↓
ResumeScreenerAgent.screenResume() processes resume
    ↓
GPT-4o analyzes with prompt (see line 51-86)
    ↓
Returns JSON with score (0-100) + details
    ↓
Score saved to database
    ↓
UI updates with results
```

### 3. **Parameters You Can Configure**

#### A. **Resume Text Processing**
File: `server/agents/resume-screener.ts`
- Line 174: `resumeText: resume.rawText || ''` - Gets raw resume text from database

#### B. **Scoring Thresholds**
File: `server/agents/resume-screener.ts`
- Line 183: `screeningStatus: screeningResult.score >= 75 ? 'passed' : 'failed'`
  - Currently: Score >= 75 = "passed", < 75 = "failed"
  - **Customize:** Change the number to adjust pass/fail threshold

File: `server/routes.ts`
- Line 918: `screeningResult.score >= 75 ? 'passed' : screeningResult.score >= 50 ? 'pending' : 'failed'`
  - Currently: 75+ = passed, 50-74 = pending, <50 = failed

#### C. **Scoring Criteria Weights**
Edit the system prompt in `screenResume()` method (lines 51-76):

```typescript
// CURRENT (lines 58-61):
2. Calculate a match score from 0-100 based on:
   - Skill match (40%): How many required skills does the candidate have?
   - Experience level (30%): Does the candidate meet the experience requirements?
   - Education/Qualifications (20%): Does the candidate have relevant education?
   - Overall fit (10%): Does the candidate's career trajectory align with the role?

// TO CHANGE: Update these percentages
// Example - increase experience weight:
   - Skill match (30%)
   - Experience level (40%)    ← Increased from 30%
   - Education (20%)
   - Overall fit (10%)
```

#### D. **Model Selection**
File: `server/agents/resume-screener.ts`, Line 42:
```typescript
this.llm = new ChatOpenAI({
  modelName: "gpt-4o",  // ← Change model here
  temperature: 0.3,     // ← Adjust consistency (0-1, lower = more consistent)
});
```

### 4. **Resume Input - How to Provide Resume Data**

**Current Implementation:**
The resume text comes from the `resumes` table in your database:

```sql
SELECT raw_text FROM resumes 
WHERE application_id = '{applicationId}'
```

**The resume is populated when:**
1. Candidate uploads resume via UI
2. File is stored in object storage
3. `rawText` field extracted from PDF/DOC (if parser available)

**To modify resume extraction:**
File: `server/routes.ts`, Line 911:
```typescript
// CURRENT (gets resume from database):
resumeText: application.resumeParsingData?.summary || 'Resume data not available'

// SHOULD BE (get from resumes table):
// See the fix below in the code changes
```

### 5. **Customization Examples**

#### Example 1: Make Scoring More Strict
```typescript
// Change line 183 & 918:
// From:
screeningStatus: screeningResult.score >= 75 ? 'passed' : 'failed'
// To:
screeningStatus: screeningResult.score >= 85 ? 'passed' : 'failed'
```

#### Example 2: Change Scoring Weights
```typescript
// In screenResume() system prompt, change:
const systemPrompt = `...
- Skill match (50%):        // ← Increased from 40%
- Experience level (25%):   // ← Decreased from 30%
- Education (15%):          // ← Decreased from 20%
- Overall fit (10%):
...`
```

#### Example 3: Use Different AI Model
```typescript
// Change line 42:
this.llm = new ChatOpenAI({
  modelName: "gpt-4-turbo",  // ← Use faster, cheaper model
  temperature: 0.2,           // ← More strict/consistent
});
```

### 6. **LangGraph Integration (Future)**

Currently using simple GPT-4o. To add LangGraph workflow:
1. Import LangGraph state machine
2. Define workflow states: RESUME_PARSING → SKILL_MATCHING → EXPERIENCE_EVALUATION → FINAL_SCORING
3. Each state runs as separate agent task
4. Workflow coordinates between states

This would enable:
- Parallel scoring of multiple applications
- Retry logic if one stage fails
- Custom routing based on intermediate results

### 7. **Scoring Response Format**

The API returns (from line 909-934):
```json
{
  "applicationId": "uuid",
  "candidateName": "Monish Udayashankar",
  "score": 78,
  "matchedSkills": ["JavaScript", "React"],
  "missingSkills": ["Python"],
  "experienceMatch": true,
  "reasoning": "Candidate has strong skills...",
  "strengths": ["Strong JavaScript", "Good project experience"],
  "concerns": ["Limited Python experience"]
}
```

## Next Steps

1. **Test Current Setup:** Click Score button on an application
2. **Adjust Thresholds:** Change pass/fail scores if needed
3. **Modify Weights:** Edit the scoring criteria percentages
4. **View Results:** Check database `applications.screening_data` JSON field for details

