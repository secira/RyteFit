/**
 * LaTeX Parser for NEET/JEE Question Papers
 * 
 * Expected Format:
 * \section*{FINAL NEET(UG)-2025 (EXAMINATION)}
 * (Held On Sunday $4^{\text {th }}$ MAY, 2025)
 * \section*{PHYSICS}
 * 1. Question text...
 * (1) Option A
 * (2) Option B
 * (3) Option C
 * (4) Option D
 * Ans. 2
 */

export interface ParsedQuestion {
  text: string;
  options: string[];
  correctOption: number;
  subject: string;
  difficultyLevel: number;
}

export interface ParsedLatexData {
  examName: string;
  previousYearDate: string | null;
  examType: 'NEET' | 'JEE';
  questions: ParsedQuestion[];
}

export function parseLatexFile(content: string): ParsedLatexData {
  const lines = content.split('\n').map(line => line.trim());
  
  let examName = '';
  let previousYearDate: string | null = null;
  let examType: 'NEET' | 'JEE' = 'NEET';
  let currentSubject = '';
  const questions: ParsedQuestion[] = [];
  
  let currentQuestion: Partial<ParsedQuestion> | null = null;
  let currentOptions: string[] = [];
  let questionText = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines
    if (!line) continue;
    
    // Parse exam name from \section*{...}
    const examNameMatch = line.match(/\\section\*\{(.+?)\}/);
    if (examNameMatch && !examName) {
      examName = examNameMatch[1];
      
      // Detect exam type from name
      if (examName.includes('JEE')) {
        examType = 'JEE';
      } else if (examName.includes('NEET')) {
        examType = 'NEET';
      }
      continue;
    }
    
    // Parse previous year date from line after exam name
    if (examName && !previousYearDate && line.startsWith('(Held On')) {
      previousYearDate = line.replace(/^\(Held On\s*/, '').replace(/\)$/, '');
      continue;
    }
    
    // Parse subject from \section*{PHYSICS} etc
    const subjectMatch = line.match(/\\section\*\{(PHYSICS|CHEMISTRY|BIOLOGY|MATHEMATICS|MATH)\}/i);
    if (subjectMatch) {
      // Save previous question if exists
      if (currentQuestion && questionText) {
        currentQuestion.text = questionText.trim();
        currentQuestion.options = currentOptions;
        currentQuestion.subject = currentSubject;
        currentQuestion.difficultyLevel = 3;
        questions.push(currentQuestion as ParsedQuestion);
      }
      
      currentSubject = subjectMatch[1].toUpperCase();
      if (currentSubject === 'MATH') currentSubject = 'MATHEMATICS';
      
      currentQuestion = null;
      currentOptions = [];
      questionText = '';
      continue;
    }
    
    // Parse question number (e.g., "1.", "2.", etc)
    const questionMatch = line.match(/^(\d+)\.\s*(.*)$/);
    if (questionMatch) {
      // Save previous question if exists
      if (currentQuestion && questionText) {
        currentQuestion.text = questionText.trim();
        currentQuestion.options = currentOptions;
        currentQuestion.subject = currentSubject;
        currentQuestion.difficultyLevel = 3;
        questions.push(currentQuestion as ParsedQuestion);
      }
      
      // Start new question
      currentQuestion = {
        text: '',
        options: [],
        correctOption: 0,
        subject: currentSubject,
        difficultyLevel: 3,
      };
      currentOptions = [];
      questionText = questionMatch[2]; // Start with text after number
      continue;
    }
    
    // Parse options (1), (2), (3), (4)
    const optionMatch = line.match(/^\((\d+)\)\s*(.*)$/);
    if (optionMatch && currentQuestion) {
      currentOptions.push(optionMatch[2]);
      continue;
    }
    
    // Parse answer line (Ans. 2)
    const answerMatch = line.match(/^Ans\.\s*(\d+)$/i);
    if (answerMatch && currentQuestion) {
      const answerNum = parseInt(answerMatch[1]);
      currentQuestion.correctOption = answerNum - 1; // Convert to 0-indexed
      
      // Save the question
      currentQuestion.text = questionText.trim();
      currentQuestion.options = currentOptions;
      currentQuestion.subject = currentSubject;
      currentQuestion.difficultyLevel = 3;
      questions.push(currentQuestion as ParsedQuestion);
      
      // Reset for next question
      currentQuestion = null;
      currentOptions = [];
      questionText = '';
      continue;
    }
    
    // If we're in a question and it's not an option/answer, it's part of question text
    if (currentQuestion && !line.startsWith('\\') && !line.startsWith('Ans.')) {
      questionText += ' ' + line;
    }
  }
  
  // Handle last question if not saved
  if (currentQuestion && questionText) {
    currentQuestion.text = questionText.trim();
    currentQuestion.options = currentOptions;
    currentQuestion.subject = currentSubject;
    currentQuestion.difficultyLevel = 3;
    questions.push(currentQuestion as ParsedQuestion);
  }
  
  return {
    examName,
    previousYearDate,
    examType,
    questions,
  };
}

/**
 * Extract year from previous year date string
 * E.g., "Sunday $4^{\text {th }}$ MAY, 2025" -> "2025"
 */
export function extractYear(dateString: string | null): number | null {
  if (!dateString) return null;
  
  const yearMatch = dateString.match(/\b(20\d{2})\b/);
  return yearMatch ? parseInt(yearMatch[1]) : null;
}
