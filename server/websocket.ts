import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import pino from 'pino';
import { db } from './db';
import { interviewSessions, interviewMessages, applications, jobs, users, candidateResumes, interviewEvaluations } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { generateInterviewQuestions, evaluateAnswer } from './interviewAgent';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

interface InterviewState {
  questionBank: any[];
  currentQuestionIndex: number;
  evaluations: any[];
  finished: boolean;
  overallScore: number;
}

const sessionStates = new Map<string, InterviewState>();

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws/interview'
  });

  logger.info('WebSocket server ready');

  wss.on('connection', (ws: WebSocket) => {
    logger.info('WebSocket connected');

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'init':
            await handleInit(ws, message);
            break;
          case 'question_request':
            await handleQuestionRequest(ws, message);
            break;
          case 'answer_submit':
            await handleAnswerSubmit(ws, message);
            break;
          case 'session_end':
            handleSessionEnd(message);
            break;
        }
      } catch (error: any) {
        logger.error({ error: error.message }, 'WS error');
      }
    });

    ws.on('close', () => logger.info('WS closed'));
  });
}

async function handleInit(ws: WebSocket, message: any) {
  const { sessionId } = message;
  try {
    const [session] = await db.select().from(interviewSessions).where(eq(interviewSessions.id, sessionId)).limit(1);
    
    if (!session) {
      ws.send(JSON.stringify({ type: 'error', message: 'Session not found' }));
      return;
    }

    // Check ±10 minute window
    const now = new Date();
    const scheduledTime = new Date(session.scheduledAt);
    const timeDiffMs = Math.abs(now.getTime() - scheduledTime.getTime());
    const timeDiffMinutes = timeDiffMs / 60000; // minutes
    
    logger.info({
      sessionId,
      scheduledISO: scheduledTime.toISOString(),
      currentISO: now.toISOString(),
      diffMs: timeDiffMs,
      diffMinutes: timeDiffMinutes,
      withinWindow: timeDiffMinutes <= 10
    }, 'Interview time window check');
    
    if (timeDiffMinutes > 10) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: `Interview window closed. Scheduled: ${scheduledTime.toISOString()}, Current: ${now.toISOString()}. Difference: ${timeDiffMinutes.toFixed(2)} minutes. Must start within ±10 minutes.`
      }));
      return;
    }

    // Update session to in_progress
    await db.update(interviewSessions).set({ 
      status: 'in_progress',
      startedAt: new Date()
    }).where(eq(interviewSessions.id, sessionId));

    ws.send(JSON.stringify({
      type: 'init_success',
      sessionId: session.id,
      message: 'Interview started'
    }));

    logger.info({ sessionId }, 'Client initialized - interview started');
  } catch (error: any) {
    logger.error(error, 'Init error');
    ws.send(JSON.stringify({ type: 'error', message: 'Init failed' }));
  }
}

async function handleQuestionRequest(ws: WebSocket, message: any) {
  const { sessionId } = message;
  
  try {
    let state = sessionStates.get(sessionId);
    
    if (!state) {
      // Fetch session, application, job, and resume from database
      const [session] = await db.select().from(interviewSessions).where(eq(interviewSessions.id, sessionId)).limit(1);
      
      if (!session) {
        ws.send(JSON.stringify({ type: 'error', message: 'Interview session not found' }));
        return;
      }

      const [application] = await db.select().from(applications).where(eq(applications.id, session.applicationId)).limit(1);
      if (!application) {
        ws.send(JSON.stringify({ type: 'error', message: 'Application not found' }));
        return;
      }

      const [job] = await db.select().from(jobs).where(eq(jobs.id, application.jobId)).limit(1);
      if (!job) {
        ws.send(JSON.stringify({ type: 'error', message: 'Job not found' }));
        return;
      }

      // Get candidate's first resume (or latest one)
      const candidateResumesList = await db.select().from(candidateResumes).where(eq(candidateResumes.userId, application.candidateId)).limit(1);
      let resumeContent = '';
      if (candidateResumesList.length > 0 && candidateResumesList[0].fileData) {
        try {
          resumeContent = atob(candidateResumesList[0].fileData);
        } catch (e) {
          logger.warn({ error: e }, 'Failed to decode resume base64');
          resumeContent = '';
        }
      }

      // Generate questions using job and resume context
      const questions = await generateInterviewQuestions(
        job.title || 'Software Engineer',
        job.description || '',
        resumeContent
      );
      
      logger.info({ sessionId, jobTitle: job.title }, 'Generating questions with job context');
      
      state = {
        questionBank: questions.length > 0 ? questions : [{ id: 'q1', text: 'Tell me about yourself.' }],
        currentQuestionIndex: 0,
        evaluations: [],
        finished: false,
        overallScore: 0,
      };
      
      sessionStates.set(sessionId, state);
    }

    // Send current question
    if (state.currentQuestionIndex < state.questionBank.length) {
      const q = state.questionBank[state.currentQuestionIndex];
      
      // Save question to interview_messages
      await db.insert(interviewMessages).values({
        sessionId,
        role: 'interviewer',
        messageType: 'text',
        content: q.text,
        metadata: {
          questionType: q.type,
          topic: q.topic,
          difficulty: q.difficultyLevel,
        }
      });
      
      ws.send(JSON.stringify({
        type: 'question',
        questionText: q.text,
        questionNumber: state.currentQuestionIndex + 1,
        totalQuestions: state.questionBank.length,
      }));
      
      logger.info({ sessionId }, `Question ${state.currentQuestionIndex + 1} sent and saved`);
    } else {
      ws.send(JSON.stringify({
        type: 'interview_complete',
        overallScore: state.overallScore
      }));
    }
  } catch (error: any) {
    logger.error(error, 'Question request error');
    ws.send(JSON.stringify({ type: 'error', message: 'Failed to get question' }));
  }
}

async function handleAnswerSubmit(ws: WebSocket, message: any) {
  const { sessionId, answerText, videoUrl, duration } = message;
  
  try {
    const state = sessionStates.get(sessionId);
    if (!state || state.finished) {
      ws.send(JSON.stringify({ type: 'error', message: 'Interview ended' }));
      return;
    }

    const question = state.questionBank[state.currentQuestionIndex];
    
    // Save candidate answer to interview_messages
    await db.insert(interviewMessages).values({
      sessionId,
      role: 'candidate',
      messageType: videoUrl ? 'video' : 'text',
      content: answerText,
      videoTimestamp: videoUrl ? 0 : undefined,
      duration: duration || undefined,
      metadata: {
        questionType: question.type,
      }
    });
    
    // Evaluate answer
    const evaluation = await evaluateAnswer(
      question.text,
      answerText,
      'Software Engineer'
    );

    state.evaluations.push({
      questionId: question.id,
      questionText: question.text,
      answerText,
      videoUrl,
      duration,
      ...evaluation
    });

    state.currentQuestionIndex++;

    // Check if done
    if (state.currentQuestionIndex >= state.questionBank.length) {
      const avgScore = state.evaluations.reduce((sum: number, e: any) => sum + e.overallScore, 0) / state.evaluations.length;
      state.overallScore = Math.round(avgScore);
      state.finished = true;

      // Update session with completion data
      await db.update(interviewSessions).set({
        status: 'completed',
        completedAt: new Date(),
        overallScore: state.overallScore,
        questionsAnswered: state.evaluations.length,
        videoUrls: state.evaluations.map(e => e.videoUrl).filter(Boolean)
      }).where(eq(interviewSessions.id, sessionId));

      // Get session and application details
      const sessionRecords = await db.select().from(interviewSessions).where(eq(interviewSessions.id, sessionId)).limit(1);
      
      if (sessionRecords.length > 0 && sessionRecords[0].application_id) {
        const session = sessionRecords[0];
        
        // Update application status to interview_complete
        const { applications } = await import("@shared/schema");
        await db.update(applications).set({
          status: 'interview_complete'
        }).where(eq(applications.id, session.application_id));

        // Create interview evaluation record
        // Calculate technical score (average of all question scores)
        const technicalScore = Math.round(
          state.evaluations.reduce((sum: number, e: any) => sum + (e.technicalScore || e.overallScore), 0) / 
          state.evaluations.length
        );
        
        // Calculate communication score (from evaluations if available)
        const communicationScore = Math.round(
          state.evaluations.reduce((sum: number, e: any) => sum + (e.communicationScore || 0), 0) / 
          state.evaluations.length
        );

        // Generate recommendation based on overall score
        let recommendation = 'no_hire';
        if (state.overallScore >= 80) recommendation = 'strong_hire';
        else if (state.overallScore >= 65) recommendation = 'hire';
        else if (state.overallScore >= 50) recommendation = 'maybe';

        // Collect strengths and weaknesses
        const strengths: string[] = [];
        const weaknesses: string[] = [];
        const questionScores = state.evaluations.map((e: any) => ({
          questionId: e.questionId,
          question: e.questionText,
          answer: e.answerText,
          score: Math.round(e.overallScore),
          feedback: e.feedback || ''
        }));

        // Extract strengths and weaknesses from evaluations
        state.evaluations.forEach((e: any) => {
          if (e.strengths && Array.isArray(e.strengths)) {
            strengths.push(...e.strengths);
          }
          if (e.weaknesses && Array.isArray(e.weaknesses)) {
            weaknesses.push(...e.weaknesses);
          }
        });

        // Create evaluation record
        await db.insert(interviewEvaluations).values({
          sessionId,
          overallScore: state.overallScore,
          recommendation,
          technicalScore,
          communicationScore,
          strengths: strengths.slice(0, 5), // Top 5 strengths
          weaknesses: weaknesses.slice(0, 5), // Top 5 weaknesses
          questionScores,
          keyInsights: `Candidate scored ${state.overallScore} overall with ${technicalScore} technical score and ${communicationScore} communication score.`
        });

        logger.info(
          { sessionId, overallScore: state.overallScore, technicalScore, communicationScore, recommendation },
          'Evaluation created'
        );
      }

      ws.send(JSON.stringify({
        type: 'interview_complete',
        overallScore: state.overallScore
      }));
    } else {
      // Send next question
      const nextQ = state.questionBank[state.currentQuestionIndex];
      ws.send(JSON.stringify({
        type: 'next_question',
        questionText: nextQ.text,
        questionNumber: state.currentQuestionIndex + 1,
        totalQuestions: state.questionBank.length,
      }));
    }

    sessionStates.set(sessionId, state);
    logger.info({ sessionId }, 'Answer evaluated and saved');
  } catch (error: any) {
    logger.error(error, 'Answer submit error');
    ws.send(JSON.stringify({ type: 'error', message: 'Failed to process answer' }));
  }
}

function handleSessionEnd(message: any) {
  const { sessionId } = message;
  sessionStates.delete(sessionId);
  logger.info({ sessionId }, 'Session ended');
}
