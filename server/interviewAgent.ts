import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import OpenAI from "openai";

const openaiApiKey = process.env.OPENAI_API_KEY;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

// Get LLM - Claude preferred, fallback to GPT-4o
function getLLM() {
  try {
    if (anthropicApiKey) {
      return new ChatAnthropic({ 
        model: "claude-3-5-sonnet-20241022",
        apiKey: anthropicApiKey,
        temperature: 0.7,
      });
    }
    if (openaiApiKey) {
      return new ChatOpenAI({
        modelName: "gpt-4o",
        apiKey: openaiApiKey,
        temperature: 0.7,
      });
    }
  } catch (error) {
    console.error("LLM initialization error:", error);
  }
  return null;
}

// Default interview questions
function getDefaultQuestions() {
  return [
    {
      id: "q1",
      text: "Tell me about your most relevant experience for this role.",
      type: "behavioral",
      topic: "Experience",
      difficultyLevel: 1,
      expectedKeyPoints: ["Relevant projects", "Key skills applied"],
    },
    {
      id: "q2",
      text: "Describe a challenging technical problem you solved. What was your approach?",
      type: "technical",
      topic: "Problem Solving",
      difficultyLevel: 2,
      expectedKeyPoints: ["Problem definition", "Solution approach", "Result"],
    },
    {
      id: "q3",
      text: "Tell me about a time you worked collaboratively on a project. What was your contribution?",
      type: "behavioral",
      topic: "Collaboration",
      difficultyLevel: 1,
      expectedKeyPoints: ["Team dynamics", "Your role", "Outcome"],
    },
    {
      id: "q4",
      text: "How do you approach learning new technologies or frameworks?",
      type: "behavioral",
      topic: "Learning",
      difficultyLevel: 1,
      expectedKeyPoints: ["Learning methods", "Recent example", "Commitment"],
    },
    {
      id: "q5",
      text: "What interests you most about this position and our company?",
      type: "situational",
      topic: "Motivation",
      difficultyLevel: 1,
      expectedKeyPoints: ["Company research", "Role alignment", "Career goals"],
    },
  ];
}

// Generate questions using AI with safe fallback
export async function generateInterviewQuestions(
  jobTitle: string,
  jobDescription: string,
  resumeContent: string
): Promise<any[]> {
  try {
    const llm = getLLM();
    if (!llm) {
      console.log("No LLM configured, using default questions");
      return getDefaultQuestions();
    }

    const prompt = `Generate 5 interview questions for a ${jobTitle} role.

Job: ${jobDescription}
Candidate resume: ${resumeContent}

Return ONLY valid JSON array:
[{"id":"q1","text":"Question?","type":"technical","difficultyLevel":1,"expectedKeyPoints":["point1"]}]`;

    const result = await llm.invoke([new HumanMessage(prompt)]);
    const content = result.content.toString();
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      return questions.length > 0 ? questions : getDefaultQuestions();
    }
  } catch (error) {
    console.error("Question generation error:", error);
  }

  return getDefaultQuestions();
}

// Evaluate answer using AI
export async function evaluateAnswer(
  question: string,
  answer: string,
  jobTitle: string
): Promise<{
  relevance: number;
  depth: number;
  communication: number;
  technicalAccuracy: number;
  problemSolving: number;
  confidence: number;
  overallScore: number;
  feedback: string;
}> {
  try {
    const llm = getLLM();
    if (!llm) {
      return {
        relevance: 6,
        depth: 5,
        communication: 6,
        technicalAccuracy: 5,
        problemSolving: 5,
        confidence: 6,
        overallScore: 55,
        feedback: "Thank you for your response.",
      };
    }

    const prompt = `Evaluate this ${jobTitle} interview answer.

Question: ${question}
Answer: ${answer}

Score 1-10 on: relevance, depth, communication, technical accuracy, problem-solving, confidence.

Return ONLY JSON:
{"relevance":8,"depth":7,"communication":8,"technicalAccuracy":7,"problemSolving":6,"confidence":8,"overallScore":75,"feedback":"Brief feedback."}`;

    const result = await llm.invoke([new HumanMessage(prompt)]);
    const content = result.content.toString();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("Evaluation error:", error);
  }

  return {
    relevance: 6,
    depth: 5,
    communication: 6,
    technicalAccuracy: 5,
    problemSolving: 5,
    confidence: 6,
    overallScore: 55,
    feedback: "Thank you for your response.",
  };
}

// Transcribe audio
export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  if (!openai) throw new Error("OpenAI not configured");
  try {
    const file = new File([audioBuffer], "audio.webm", { type: "audio/webm" });
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: "en",
    });
    return transcription.text;
  } catch (error) {
    console.error("Transcription error:", error);
    throw new Error("Failed to transcribe audio");
  }
}

// Generate speech
export async function generateSpeech(text: string): Promise<Buffer> {
  if (!openai) throw new Error("OpenAI not configured");
  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    });
    return Buffer.from(await mp3.arrayBuffer());
  } catch (error) {
    console.error("TTS error:", error);
    throw new Error("Failed to generate speech");
  }
}
