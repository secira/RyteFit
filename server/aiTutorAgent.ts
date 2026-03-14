import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, Annotation, START, END, MessagesAnnotation } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { db } from "./db";
import { questions, subjects, chapters } from "@shared/schema";
import { eq, and, sql, like, inArray } from "drizzle-orm";
import type { BaseMessage } from "@langchain/core/messages";

// Tool: Search for related NEET/JEE questions
const searchQuestionsToolSchema = z.object({
  subject: z.enum(["Physics", "Chemistry", "Biology", "Mathematics"]).describe("The subject area"),
  topic: z.string().describe("The topic or chapter name to search for"),
  limit: z.number().default(3).describe("Number of questions to fetch"),
});

const searchQuestionsTool = tool(
  async ({ subject, topic, limit }) => {
    try {
      // Find subject ID
      const [subjectRecord] = await db
        .select()
        .from(subjects)
        .where(eq(subjects.name, subject))
        .limit(1);

      if (!subjectRecord) {
        return `No questions found for subject: ${subject}`;
      }

      // Find related chapters
      const relatedChapters = await db
        .select()
        .from(chapters)
        .where(
          and(
            eq(chapters.subjectId, subjectRecord.id),
            sql`${chapters.name} ILIKE ${'%' + topic + '%'}`
          )
        )
        .limit(5);

      if (relatedChapters.length === 0) {
        return `No chapters found matching topic: ${topic} in ${subject}`;
      }

      const chapterIds = relatedChapters.map((c) => c.id);

      // Fetch related questions
      const relatedQuestions = await db
        .select({
          id: questions.id,
          text: questions.text,
          options: questions.options,
          correctOption: questions.correctOption,
          explanation: questions.explanation,
          difficultyLevel: questions.difficultyLevel,
        })
        .from(questions)
        .where(
          and(
            eq(questions.subjectId, subjectRecord.id),
            inArray(questions.chapterId, chapterIds)
          )
        )
        .limit(limit);

      if (relatedQuestions.length === 0) {
        return `No questions found for topic: ${topic} in ${subject}`;
      }

      return JSON.stringify({
        subject,
        topic,
        count: relatedQuestions.length,
        questions: relatedQuestions.map((q) => ({
          id: q.id,
          text: q.text,
          options: q.options,
          correctOption: q.correctOption,
          explanation: q.explanation,
          difficulty: q.difficultyLevel,
        })),
      });
    } catch (error: any) {
      return `Error searching questions: ${error.message}`;
    }
  },
  {
    name: "search_related_questions",
    description: "Search for NEET/JEE practice questions related to a specific topic or chapter. Use this when a student asks about a topic and you want to provide practice questions.",
    schema: searchQuestionsToolSchema,
  }
);

// Tool: Get study material/chapter information
const getStudyMaterialToolSchema = z.object({
  subject: z.enum(["Physics", "Chemistry", "Biology", "Mathematics"]).describe("The subject area"),
  chapterName: z.string().optional().describe("Specific chapter name to search for"),
});

const getStudyMaterialTool = tool(
  async ({ subject, chapterName }) => {
    try {
      // Find subject
      const [subjectRecord] = await db
        .select()
        .from(subjects)
        .where(eq(subjects.name, subject))
        .limit(1);

      if (!subjectRecord) {
        return `Subject not found: ${subject}`;
      }

      // Get chapters
      const chapterConditions = [eq(chapters.subjectId, subjectRecord.id)];
      
      if (chapterName) {
        chapterConditions.push(
          sql`${chapters.name} ILIKE ${'%' + chapterName + '%'}`
        );
      }

      const chapterList = await db
        .select({
          name: chapters.name,
          description: chapters.description,
          weightage: chapters.chapterWeightage,
        })
        .from(chapters)
        .where(and(...chapterConditions))
        .limit(10);

      if (chapterList.length === 0) {
        return `No chapters found for ${subject}${chapterName ? ` matching "${chapterName}"` : ''}`;
      }

      return JSON.stringify({
        subject: subjectRecord.name,
        description: subjectRecord.description,
        chapters: chapterList.map((c) => ({
          name: c.name,
          description: c.description,
          weightage: c.weightage,
        })),
      });
    } catch (error: any) {
      return `Error fetching study material: ${error.message}`;
    }
  },
  {
    name: "get_study_material",
    description: "Get information about chapters and topics for NEET/JEE subjects. Use this to provide context about what topics are covered in a subject.",
    schema: getStudyMaterialToolSchema,
  }
);

// Define the agent state
const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  subject: Annotation<string | null>({ reducer: (_, update) => update ?? null }),
  topic: Annotation<string | null>({ reducer: (_, update) => update ?? null }),
  examType: Annotation<string | null>({ reducer: (_, update) => update ?? null }),
});

// Create the AI Tutor agent
export function createAITutorAgent() {
  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.7,
    streaming: true,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // Bind tools to the model
  const modelWithTools = model.bindTools([searchQuestionsTool, getStudyMaterialTool]);

  // System prompt for the AI Tutor
  const systemPrompt = `You are an expert AI Tutor for NEET and JEE exam preparation in India. Your role is to help students understand concepts, solve problems, and prepare for their exams.

Guidelines:
1. **Be Educational**: Don't just give answers. Use the Socratic method - ask leading questions to help students think through problems.
2. **Step-by-Step**: Break down complex problems into smaller, manageable steps.
3. **Subject Detection**: Identify which subject (Physics, Chemistry, Biology, Mathematics) and topic the student is asking about.
4. **Use Tools**: When appropriate, search for related practice questions or study materials to supplement your explanations.
5. **LaTeX Formulas**: When writing mathematical or chemical formulas, use LaTeX notation enclosed in $ symbols (e.g., $E = mc^2$ or $H_2O$).
6. **Be Encouraging**: Maintain a positive, supportive tone to keep students motivated.
7. **Context Awareness**: Remember the conversation history to provide coherent, contextual responses.

When a student asks a question:
- First, identify the subject and topic
- Provide a clear, step-by-step explanation
- If helpful, search for related practice questions
- Encourage the student to try solving similar problems
- Answer follow-up questions with context from the conversation

Remember: Your goal is to help students learn and understand, not just to provide answers.`;

  // Agent node - processes messages and calls tools
  async function callModel(state: typeof StateAnnotation.State) {
    const messages = state.messages;
    
    // Add system prompt if this is the first message
    const messagesWithSystem: BaseMessage[] = 
      messages.length === 0 || messages[0].getType() !== 'system'
        ? [{ role: 'system', content: systemPrompt } as any, ...messages]
        : messages;

    const response = await modelWithTools.invoke(messagesWithSystem);
    return { messages: [response] };
  }

  // Build the graph
  const workflow = new StateGraph(StateAnnotation)
    .addNode("agent", callModel)
    .addEdge(START, "agent")
    .addEdge("agent", END);

  return workflow.compile();
}

// Export the agent instance
export const aiTutorAgent = createAITutorAgent();
