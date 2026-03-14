import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  Clock, 
  Target, 
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Users,
  PlayCircle,
  AlertTriangle,
  Info
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ExamType {
  id: string;
  name: string;
  description: string;
  duration: number;
  totalQuestions: number;
  subjects: Array<{
    name: string;
    questionsCount: number;
    marks: number;
  }>;
  markingScheme: {
    correct: number;
    incorrect: number;
    unanswered: number;
  };
}

interface TestCreationWizardProps {
  onTestStart?: (testId: string) => void;
  onCancel?: () => void;
}

export default function TestCreationWizard({ onTestStart, onCancel }: TestCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const { toast } = useToast();

  // Fetch available exam types
  const { data: examTypes, isLoading } = useQuery({
    queryKey: ["/api/exam-types"],
  });

  // Create test mutation
  const createTestMutation = useMutation({
    mutationFn: async (testData: { examTypeId: string; difficulty: string }) => {
      return await apiRequest("/api/tests/create", {
        method: "POST",
        body: JSON.stringify(testData),
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Test Created Successfully",
        description: "Your mock test is ready. Good luck!",
      });
      // Invalidate specific dashboard queries
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/analytics"] });
      onTestStart?.(data?.testId || "test-1");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create test. Please try again.",
        variant: "destructive",
      });
      console.error("Test creation error:", error);
    },
  });

  // Mock exam types if not available
  const mockExamTypes: ExamType[] = (examTypes as ExamType[]) || [
    {
      id: "neet-2025",
      name: "NEET 2025",
      description: "National Eligibility cum Entrance Test for medical courses",
      duration: 180,
      totalQuestions: 180,
      subjects: [
        { name: "Physics", questionsCount: 45, marks: 180 },
        { name: "Chemistry", questionsCount: 45, marks: 180 },
        { name: "Biology", questionsCount: 90, marks: 360 }
      ],
      markingScheme: { correct: 4, incorrect: -1, unanswered: 0 }
    },
    {
      id: "jee-main-2025",
      name: "JEE Main 2025",
      description: "Joint Entrance Examination for engineering courses",
      duration: 180,
      totalQuestions: 75,
      subjects: [
        { name: "Physics", questionsCount: 25, marks: 100 },
        { name: "Chemistry", questionsCount: 25, marks: 100 },
        { name: "Mathematics", questionsCount: 25, marks: 100 }
      ],
      markingScheme: { correct: 4, incorrect: -1, unanswered: 0 }
    }
  ];

  const difficultyLevels = [
    {
      id: "mixed",
      name: "Mixed Difficulty",
      description: "Questions from all difficulty levels (Recommended)",
      distribution: "Easy: 30%, Medium: 50%, Hard: 20%",
      icon: Target,
      color: "text-blue-600"
    },
    {
      id: "easy",
      name: "Easy Level",
      description: "Focus on fundamental concepts and basic problems",
      distribution: "Suitable for beginners",
      icon: CheckCircle2,
      color: "text-green-600"
    },
    {
      id: "medium",
      name: "Medium Level", 
      description: "Moderate difficulty questions for intermediate preparation",
      distribution: "Good for practice tests",
      icon: Target,
      color: "text-yellow-600"
    },
    {
      id: "hard",
      name: "Hard Level",
      description: "Challenging questions for advanced preparation",
      distribution: "For final exam preparation",
      icon: Trophy,
      color: "text-red-600"
    }
  ];

  const selectedExamData = mockExamTypes.find(exam => exam.id === selectedExam);
  const selectedDifficultyData = difficultyLevels.find(d => d.id === selectedDifficulty);

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStartTest = () => {
    if (!selectedExam || !selectedDifficulty) return;
    
    createTestMutation.mutate({
      examTypeId: selectedExam,
      difficulty: selectedDifficulty
    });
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return selectedExam !== "";
      case 2: return selectedDifficulty !== "";
      case 3: return true;
      default: return false;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading exam options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/5 border-b">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold" data-testid="heading-test-wizard">Create Your Mock Test</h1>
            <p className="text-muted-foreground">
              Set up your personalized practice test in 3 simple steps
            </p>
            
            {/* Progress Bar */}
            <div className="max-w-md mx-auto space-y-2">
              <div className="flex justify-between text-sm">
                <span className={currentStep >= 1 ? "text-primary" : "text-muted-foreground"}>Choose Exam</span>
                <span className={currentStep >= 2 ? "text-primary" : "text-muted-foreground"}>Select Level</span>
                <span className={currentStep >= 3 ? "text-primary" : "text-muted-foreground"}>Confirm & Start</span>
              </div>
              <Progress value={(currentStep / 3) * 100} className="h-2" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Step 1: Choose Exam */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-6 w-6 mr-2" />
                Step 1: Choose Your Exam
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedExam} onValueChange={setSelectedExam} className="space-y-4">
                {mockExamTypes.map((exam) => (
                  <div key={exam.id} className="flex items-start space-x-3">
                    <RadioGroupItem value={exam.id} id={exam.id} className="mt-1" />
                    <Label htmlFor={exam.id} className="flex-1 cursor-pointer">
                      <Card className="hover-elevate">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-lg font-semibold">{exam.name}</h3>
                              <p className="text-muted-foreground">{exam.description}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{exam.duration} minutes</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Target className="h-4 w-4 text-muted-foreground" />
                                <span>{exam.totalQuestions} questions</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Trophy className="h-4 w-4 text-muted-foreground" />
                                <span>{exam.subjects?.reduce((sum, s) => sum + s.marks, 0) || 0} marks</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>All India Rank</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Subject Distribution:</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                {exam.subjects?.map((subject, index) => (
                                  <div key={index} className="bg-muted/50 rounded p-2 text-sm">
                                    <span className="font-medium">{subject.name}:</span>
                                    <span className="text-muted-foreground ml-1">
                                      {subject.questionsCount}Q ({subject.marks}M)
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 text-sm">
                              <div className="flex items-center space-x-2 mb-1">
                                <Info className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">Marking Scheme:</span>
                              </div>
                              <span>
                                Correct: +{exam.markingScheme.correct} | 
                                Incorrect: {exam.markingScheme.incorrect} | 
                                Unanswered: {exam.markingScheme.unanswered}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Difficulty */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-6 w-6 mr-2" />
                Step 2: Select Difficulty Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedDifficulty} onValueChange={setSelectedDifficulty} className="space-y-4">
                {difficultyLevels.map((level) => {
                  const Icon = level.icon;
                  return (
                    <div key={level.id} className="flex items-start space-x-3">
                      <RadioGroupItem value={level.id} id={level.id} className="mt-1" />
                      <Label htmlFor={level.id} className="flex-1 cursor-pointer">
                        <Card className="hover-elevate">
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <Icon className={`h-6 w-6 ${level.color} flex-shrink-0 mt-0.5`} />
                              <div className="space-y-1">
                                <h4 className="font-semibold">{level.name}</h4>
                                <p className="text-sm text-muted-foreground">{level.description}</p>
                                <p className="text-sm font-medium text-primary">{level.distribution}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirm & Start */}
        {currentStep === 3 && selectedExamData && selectedDifficultyData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle2 className="h-6 w-6 mr-2" />
                  Step 3: Confirm Test Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Exam Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Exam:</span>
                        <span className="font-medium">{selectedExamData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">{selectedExamData.duration} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Questions:</span>
                        <span className="font-medium">{selectedExamData.totalQuestions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Marks:</span>
                        <span className="font-medium">
                          {selectedExamData.subjects?.reduce((sum, s) => sum + s.marks, 0) || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Difficulty:</span>
                        <Badge variant="outline">{selectedDifficultyData.name}</Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Important Instructions</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>Once started, the timer cannot be paused</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Your answers are auto-saved every 30 seconds</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>You can flag questions for review</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Trophy className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        <span>Get instant results with All India ranking</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="bg-primary/5 rounded-lg p-4 text-center">
                  <h4 className="font-semibold mb-2">Ready to Start Your Mock Test?</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Make sure you have a stable internet connection and won't be disturbed for the next {selectedExamData.duration} minutes.
                  </p>
                  <Button 
                    onClick={handleStartTest} 
                    size="lg" 
                    className="px-8"
                    disabled={createTestMutation.isPending}
                    data-testid="button-start-test-confirmed"
                  >
                    {createTestMutation.isPending ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                        <span>Creating Test...</span>
                      </div>
                    ) : (
                      <>
                        <PlayCircle className="h-5 w-5 mr-2" />
                        Start Mock Test
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <div className="flex space-x-3">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} data-testid="button-cancel-wizard">
                Cancel
              </Button>
            )}
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevStep} data-testid="button-prev-step">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
          </div>
          
          {currentStep < 3 && (
            <Button 
              onClick={handleNextStep} 
              disabled={!isStepValid()}
              data-testid="button-next-step"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}