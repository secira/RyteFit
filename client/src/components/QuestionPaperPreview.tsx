import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, X, CheckCircle, AlertCircle } from "lucide-react";
import { FormulaRenderer, textToContentBlocks } from "@/components/FormulaRenderer";
import type { ContentBlock } from '@shared/schema';

interface Question {
  id: string;
  text: string;
  questionContent?: ContentBlock[];
  options: string[];
  optionContents?: ContentBlock[][];
  correctOption: number;
  explanation?: string;
  explanationContent?: ContentBlock[];
  difficultyLevel: number;
  isPreviousYear?: boolean;
  previousYearInfo?: string;
  subjectName: string;
  chapterName?: string;
  topicName?: string;
  // For national tests
  questionText?: string;
  marks?: number;
  negativePenalty?: number;
  questionOrder?: number;
}

interface QuestionPaperPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: Question[];
  paperTitle: string;
}

export function QuestionPaperPreview({ 
  open, 
  onOpenChange, 
  questions, 
  paperTitle 
}: QuestionPaperPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!questions || questions.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{paperTitle} - Preview</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">No questions found in this paper</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentQuestion = questions[currentIndex];
  const hasNext = currentIndex < questions.length - 1;
  const hasPrevious = currentIndex > 0;

  const handleNext = () => {
    if (hasNext) setCurrentIndex(currentIndex + 1);
  };

  const handlePrevious = () => {
    if (hasPrevious) setCurrentIndex(currentIndex - 1);
  };

  const handleClose = () => {
    setCurrentIndex(0);
    onOpenChange(false);
  };

  // Get question content (handle both regular and national test questions)
  const questionText = currentQuestion.text || currentQuestion.questionText || "";
  const questionContent = currentQuestion.questionContent || textToContentBlocks(questionText);
  
  // Get options
  const options = currentQuestion.options || [];
  const optionContents = currentQuestion.optionContents || options.map(opt => textToContentBlocks(opt));

  // Get explanation
  const explanation = currentQuestion.explanation || "";
  const explanationContent = currentQuestion.explanationContent || (explanation ? textToContentBlocks(explanation) : []);

  // Difficulty color
  const getDifficultyColor = (level: number) => {
    if (level <= 2) return "bg-green-500/10 text-green-700 dark:text-green-400";
    if (level <= 3) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
    return "bg-red-500/10 text-red-700 dark:text-red-400";
  };

  const getDifficultyText = (level: number) => {
    if (level <= 2) return "Easy";
    if (level <= 3) return "Medium";
    return "Hard";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{paperTitle} - Dry Run</DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClose}
              data-testid="button-close-preview"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <Separator orientation="vertical" className="h-4" />
            <Badge variant="outline">{currentQuestion.subjectName}</Badge>
            {currentQuestion.chapterName && (
              <Badge variant="outline" className="text-xs">{currentQuestion.chapterName}</Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Question Header Info */}
          <div className="flex flex-wrap gap-2">
            <Badge className={getDifficultyColor(currentQuestion.difficultyLevel)}>
              {getDifficultyText(currentQuestion.difficultyLevel)}
            </Badge>
            {currentQuestion.isPreviousYear && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
                📚 Previous Year {currentQuestion.previousYearInfo}
              </Badge>
            )}
            {currentQuestion.marks && (
              <Badge variant="outline">
                +{currentQuestion.marks} marks
              </Badge>
            )}
            {currentQuestion.negativePenalty && (
              <Badge variant="outline" className="text-red-600">
                -{currentQuestion.negativePenalty} penalty
              </Badge>
            )}
          </div>

          {/* Question Text */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Question</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <FormulaRenderer content={questionContent} />
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {options.map((option, idx) => (
                <div 
                  key={idx}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    idx === currentQuestion.correctOption
                      ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                      : "border-border"
                  }`}
                  data-testid={`option-${idx}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <div className="flex-1">
                      <FormulaRenderer content={optionContents[idx]} />
                    </div>
                    {idx === currentQuestion.correctOption && (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Explanation */}
          {explanationContent.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Explanation</CardTitle>
              </CardHeader>
              <CardContent>
                <FormulaRenderer content={explanationContent} className="text-muted-foreground" />
              </CardContent>
            </Card>
          )}

          {/* Additional Info */}
          {currentQuestion.topicName && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Topic:</span> {currentQuestion.topicName}
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={!hasPrevious}
            data-testid="button-previous"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="text-sm text-muted-foreground">
            {currentIndex + 1} / {questions.length}
          </div>

          <Button
            variant="outline"
            onClick={handleNext}
            disabled={!hasNext}
            data-testid="button-next"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
