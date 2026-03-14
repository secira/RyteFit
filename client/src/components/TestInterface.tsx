import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { RichContent, RichOption } from "@/components/RichContent";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag,
  SkipForward,
  CheckCircle,
  Circle,
  Loader,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";

interface Question {
  id: string;
  text: string;
  options: string[];
  examType: string;
  topicId: string;
  subjectId?: string;
  subjectName?: string;
  difficultyLevel: number;
  isPreviousYear: boolean | null;
  previousYearInfo: string | null;
  questionContent?: any;
  optionContents?: any;
  hasFormula: boolean | null;
  // Note: correctOption and explanation are not included for security
}

interface TestState {
  currentQuestion: number;
  answers: Record<string, string>;
  flagged: Set<string>;
  timeLeft: number;
}

interface TestInterfaceProps {
  instanceId?: string;
}

export default function TestInterface({ instanceId: propInstanceId }: TestInterfaceProps) {
  // Get instance ID from URL if not provided as prop
  const [, params] = useRoute("/test/:id");
  const instanceId = propInstanceId || params?.id;
  const [, navigate] = useLocation();

  // Fetch questions for this test instance
  const { data: questionsResponse, isLoading, error } = useQuery({
    queryKey: [`/api/tests/${instanceId}/questions`],
    enabled: !!instanceId,
  });

  const questions = questionsResponse?.questions || [];

  const [testState, setTestState] = useState<TestState>({
    currentQuestion: 0,
    answers: {},
    flagged: new Set(),
    timeLeft: 180 * 60 // 180 minutes in seconds
  });

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTestState(prev => ({
        ...prev,
        timeLeft: Math.max(0, prev.timeLeft - 1)
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading test questions...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load test questions</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[testState.currentQuestion];
  const progress = ((testState.currentQuestion + 1) / questions.length) * 100;

  const handleAnswerSelect = (value: string) => {
    setTestState(prev => ({
      ...prev,
      answers: { ...prev.answers, [currentQuestion.id]: value }
    }));
    console.log(`Selected answer: ${value} for question ${currentQuestion.id}`);
  };

  const handleNext = () => {
    if (testState.currentQuestion < questions.length - 1) {
      setTestState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1
      }));
    }
  };

  const handlePrevious = () => {
    if (testState.currentQuestion > 0) {
      setTestState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion - 1
      }));
    }
  };

  const handleFlag = () => {
    setTestState(prev => {
      const newFlagged = new Set(prev.flagged);
      if (newFlagged.has(currentQuestion.id)) {
        newFlagged.delete(currentQuestion.id);
      } else {
        newFlagged.add(currentQuestion.id);
      }
      return { ...prev, flagged: newFlagged };
    });
    console.log("Toggled flag for question", currentQuestion.id);
  };

  const handleSubmit = () => {
    console.log("Submit test clicked", { 
      answers: testState.answers, 
      flagged: Array.from(testState.flagged) 
    });
  };

  const isAnswered = testState.answers[currentQuestion.id] !== undefined;
  const isFlagged = testState.flagged.has(currentQuestion.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Timer */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge variant="default" data-testid="badge-exam-type" className="text-sm">
                {currentQuestion.examType}
              </Badge>
              <Badge variant="outline" data-testid="badge-subject" className="text-sm">
                {currentQuestion.subjectName || 'Unknown Subject'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Question {testState.currentQuestion + 1} of {questions.length}
              </span>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-sm text-muted-foreground">
                <Progress value={progress} className="w-24 h-2" />
                <span className="ml-2">{Math.round(progress)}%</span>
              </div>
              
              <div className={`flex items-center space-x-2 ${
                testState.timeLeft < 3600 ? 'text-destructive' : 'text-foreground'
              }`}>
                <Clock className="h-4 w-4" />
                <span className="font-mono text-lg" data-testid="text-timer">
                  {formatTime(testState.timeLeft)}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm('Are you sure you want to end this test? Your progress will not be saved.')) {
                    navigate('/dashboard');
                  }
                }}
                data-testid="button-end-test"
              >
                <X className="h-4 w-4 mr-2" />
                End Test
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* Question Panel */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Question {testState.currentQuestion + 1}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" data-testid="badge-chapter">
                    Difficulty: {currentQuestion.difficultyLevel}/5
                  </Badge>
                  {currentQuestion.isPreviousYear && (
                    <Badge variant="outline" data-testid="badge-previous-year">
                      Previous Year
                    </Badge>
                  )}
                  <Button
                    variant={isFlagged ? "default" : "outline"}
                    size="sm"
                    onClick={handleFlag}
                    data-testid="button-flag"
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div data-testid="text-question">
                <RichContent 
                  content={currentQuestion.questionContent} 
                  fallbackText={currentQuestion.text}
                  className="text-base"
                />
              </div>

              <RadioGroup 
                value={testState.answers[currentQuestion.id] || ""} 
                onValueChange={handleAnswerSelect}
                className="space-y-3"
              >
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <RadioGroupItem 
                      value={option} 
                      id={`option-${index}`}
                      data-testid={`radio-option-${index}`}
                      className="mt-1"
                    />
                    <Label 
                      htmlFor={`option-${index}`} 
                      className="flex-1 cursor-pointer p-2 rounded hover-elevate"
                    >
                      <RichOption
                        content={currentQuestion.optionContents?.[index]}
                        fallbackText={option}
                        optionLetter={String.fromCharCode(65 + index)}
                      />
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button 
              variant="outline"
              onClick={handlePrevious}
              disabled={testState.currentQuestion === 0}
              data-testid="button-previous"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center space-x-4">
              <Button 
                variant="outline"
                onClick={handleFlag}
                data-testid="button-mark-review"
              >
                Mark for Review
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleNext}
                data-testid="button-clear-response"
              >
                Clear Response
              </Button>
            </div>

            {testState.currentQuestion === questions.length - 1 ? (
              <Button onClick={handleSubmit} data-testid="button-submit-test">
                Submit Test
              </Button>
            ) : (
              <Button onClick={handleNext} data-testid="button-next">
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Question Navigation Panel */}
        <div className="w-80">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Question Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Group questions by subject */}
              {(() => {
                const subjectGroups: Record<string, number[]> = {};
                questions.forEach((q: Question, index: number) => {
                  const subjectName = q.subjectName || 'Unknown';
                  if (!subjectGroups[subjectName]) {
                    subjectGroups[subjectName] = [];
                  }
                  subjectGroups[subjectName].push(index);
                });

                return Object.entries(subjectGroups).map(([subjectName, indices]) => (
                  <div key={subjectName} className="space-y-2">
                    <h3 className="text-sm font-semibold text-primary">{subjectName}</h3>
                    <div className="grid grid-cols-5 gap-2">
                      {indices.map((index: number) => {
                        const questionId = questions[index].id;
                        const answered = testState.answers[questionId] !== undefined;
                        const flagged = testState.flagged.has(questionId);
                        const current = index === testState.currentQuestion;

                        return (
                          <Button
                            key={index}
                            variant={current ? "default" : "outline"}
                            size="sm"
                            className={`relative ${
                              answered ? 'bg-green-100 hover:bg-green-200 border-green-300 text-green-800 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-100' : ''
                            } ${flagged && !answered ? 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300 dark:bg-yellow-900 dark:hover:bg-yellow-800' : ''}`}
                            onClick={() => setTestState(prev => ({ ...prev, currentQuestion: index }))}
                            data-testid={`button-question-${index + 1}`}
                          >
                            {index + 1}
                            {answered && <CheckCircle className="h-3 w-3 absolute -top-1 -right-1 text-green-600 dark:text-green-400" />}
                            {flagged && <Flag className="h-3 w-3 absolute -top-1 -left-1 text-yellow-600 dark:text-yellow-400" />}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}

              {/* Legend */}
              <div className="pt-4 border-t space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded dark:bg-green-900"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded dark:bg-yellow-900"></div>
                  <span>Marked for Review</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border border-gray-300 rounded"></div>
                  <span>Not Attempted</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}