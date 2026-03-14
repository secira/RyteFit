import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Target, Trophy, BookOpen, Lock, Zap, FileText, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import PaymentButton from "@/components/PaymentButton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PracticeTestSummary {
  examType: 'NEET' | 'JEE';
  availableCredits: number;
  totalTests: number;
  averageScore: number | null;
  bestScore: number | null;
  lastTestDate: string | null;
}

interface AssignedPaper {
  id: string;
  paperId: string;
  paperName: string;
  paperTestNumber: string;
  examType: 'NEET' | 'JEE';
  isCompleted: boolean;
  assignedAt: string;
  completedAt: string | null;
  questionCount: number;
}

const PracticeTests = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Get exam type from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const examTypeParam = urlParams.get('type')?.toLowerCase();
  const examType = examTypeParam === 'jee' ? 'JEE' : 'NEET'; // Default to NEET if not specified or invalid

  // Check service access for this exam type
  const serviceType = examType === 'JEE' ? 'JEE_STANDARD' : 'NEET_STANDARD';
  const { data: serviceAccess, isLoading: isLoadingAccess } = useQuery<{ hasAccess: boolean; service: any }>({
    queryKey: ['/api/user/service-access', serviceType],
    enabled: true,
  });

  const hasAccess = serviceAccess?.hasAccess || false;

  // Query to get practice test summary for both exam types
  const { data: practiceData, isLoading } = useQuery<PracticeTestSummary[]>({
    queryKey: ['/api/practice/summary'],
    enabled: hasAccess, // Only fetch if user has access
  });

  // Query to get assigned papers for the current exam type
  const { data: assignedPapers, isLoading: isLoadingPapers } = useQuery<AssignedPaper[]>({
    queryKey: ['/api/practice-tests/assigned-papers', examType],
    enabled: hasAccess, // Only fetch if user has access
  });

  const currentExamData = practiceData?.find((p: PracticeTestSummary) => p.examType === examType);

  const handleStartPracticeTest = async (paperId?: string) => {
    const data = currentExamData;
    
    if (!data || data.availableCredits <= 0) {
      toast({
        title: "No Practice Tests Available",
        description: `You don't have any ${examType} practice test credits. Please purchase a practice pack to continue.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/practice/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ examType, paperId }),
      });

      if (!response.ok) {
        throw new Error('Failed to start practice test');
      }

      const result = await response.json();
      navigate(`/test/${result.instanceId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start practice test. Please try again.",
        variant: "destructive",
      });
    }
  };

  const PracticeTestCard = ({ 
    examType, 
    data 
  }: { 
    examType: 'NEET' | 'JEE', 
    data: PracticeTestSummary | undefined 
  }) => {
    const hasCredits = data && data.availableCredits > 0;
    const testConfig = examType === 'NEET' 
      ? { questions: 180, duration: 180, maxMarks: 720 }
      : { questions: 90, duration: 180, maxMarks: 300 };

    const papers = assignedPapers || [];
    const incompletePapers = papers.filter(p => !p.isCompleted);
    const completedPapers = papers.filter(p => p.isCompleted);

    return (
      <div className="space-y-6">
        {/* Credits Status Card */}
        <Card className="border-2 border-primary/20" data-testid={`credits-card-${examType.toLowerCase()}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Available Credits</CardTitle>
              <Badge 
                variant={hasCredits ? "default" : "secondary"}
                className="text-sm"
                data-testid={`credits-badge-${examType.toLowerCase()}`}
              >
                {data ? `${data.availableCredits} tests remaining` : 'Loading...'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary" data-testid={`total-tests-${examType.toLowerCase()}`}>
                  {data?.totalTests || 0}
                </p>
                <p className="text-sm text-muted-foreground">Tests Taken</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600" data-testid={`average-score-${examType.toLowerCase()}`}>
                  {data?.averageScore !== null && data?.averageScore !== undefined ? `${data.averageScore}%` : 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600" data-testid={`best-score-${examType.toLowerCase()}`}>
                  {data?.bestScore !== null && data?.bestScore !== undefined ? `${data.bestScore}%` : 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">Best Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {data?.lastTestDate ? format(new Date(data.lastTestDate), 'MMM dd') : 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">Last Test</p>
              </div>
            </div>
            
            {hasCredits ? (
              papers.length > 0 ? (
                <div className="text-center text-sm text-muted-foreground">
                  Select a test paper below to start practicing
                </div>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={() => handleStartPracticeTest()}
                  data-testid={`button-start-test-${examType.toLowerCase()}`}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Start New Practice Test
                </Button>
              )
            ) : (
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  disabled
                  data-testid={`button-no-credits-${examType.toLowerCase()}`}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  No Credits Available
                </Button>
                <PaymentButton
                  amount={99500} // ₹995
                  purpose="practice_pack_purchase"
                  testsCount={5}
                  metadata={{
                    examType,
                    testsCount: 5
                  }}
                  className="w-full"
                  data-testid={`button-purchase-${examType.toLowerCase()}`}
                >
                  Purchase Practice Pack (₹995 for 5 tests)
                </PaymentButton>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assigned Test Papers */}
        {hasCredits && papers.length > 0 && (
          <Card data-testid={`assigned-papers-card-${examType.toLowerCase()}`}>
            <CardHeader>
              <CardTitle className="text-lg">Your Assigned Test Papers</CardTitle>
            </CardHeader>
            <CardContent>
              {incompletePapers.length > 0 && (
                <div className="space-y-3 mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Available Papers</h4>
                  {incompletePapers.map((paper) => (
                    <div
                      key={paper.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                      data-testid={`paper-${paper.paperTestNumber}`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{paper.paperName}</p>
                          <p className="text-sm text-muted-foreground">
                            Test #{paper.paperTestNumber} • {paper.questionCount} questions
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleStartPracticeTest(paper.paperId)}
                        data-testid={`button-start-paper-${paper.paperTestNumber}`}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Start Test
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {completedPapers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Completed Papers</h4>
                  {completedPapers.map((paper) => (
                    <div
                      key={paper.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                      data-testid={`completed-paper-${paper.paperTestNumber}`}
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">{paper.paperName}</p>
                          <p className="text-sm text-muted-foreground">
                            Test #{paper.paperTestNumber} • Completed {paper.completedAt ? format(new Date(paper.completedAt), 'MMM dd, yyyy') : ''}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">Completed</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Test Information Card */}
        <Card data-testid={`info-card-${examType.toLowerCase()}`}>
          <CardHeader>
            <CardTitle className="text-lg">Practice Test Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">{testConfig.duration} minutes</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Questions</p>
                  <p className="text-sm text-muted-foreground">{testConfig.questions} questions</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Target className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Max Marks</p>
                  <p className="text-sm text-muted-foreground">{testConfig.maxMarks} marks</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Card */}
        <Card data-testid={`features-card-${examType.toLowerCase()}`}>
          <CardHeader>
            <CardTitle className="text-lg">What You Get</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <Trophy className="h-4 w-4 text-green-600" />
                <span>Detailed performance analytics</span>
              </li>
              <li className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span>National ranking and percentile</span>
              </li>
              <li className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-purple-600" />
                <span>Predicted rank based on performance</span>
              </li>
              <li className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-orange-600" />
                <span>Section-wise breakdown and insights</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Test History Link */}
        {data && data.totalTests > 0 && (
          <Card className="hover-elevate" data-testid={`history-card-${examType.toLowerCase()}`}>
            <CardContent className="pt-6">
              <Button 
                variant="outline" 
                className="w-full" 
                asChild
                data-testid={`button-view-history-${examType.toLowerCase()}`}
              >
                <Link href={`/dashboard?tab=analytics&examType=${examType}`}>
                  View Test History & Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Show loading while checking access
  if (isLoadingAccess || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading practice tests...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show subscription required message if no access
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <Lock className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">Subscription Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              Practice tests are only available to subscribed members. Upgrade to our Standard Plan to get unlimited access to all mock tests.
            </p>
            
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-semibold text-foreground mb-3">Standard Plan Benefits:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Unlimited Mock Tests (NEET & JEE)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Detailed Performance Analytics
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  All India Rankings
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  AI-Powered Doubt Clearing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Only ₹495/month or ₹4,752/year
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => navigate("/subscription")}
                className="w-full"
                data-testid="button-subscribe-now"
              >
                View Subscription Plans
              </Button>
              <Button 
                onClick={() => navigate("/dashboard")}
                variant="outline"
                className="w-full"
                data-testid="button-back-dashboard"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="page-title">
              {examType} Practice Tests
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Take full-length {examType} practice tests with detailed analytics and national ranking.
              Each test includes 180 minutes of focused preparation time.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <PracticeTestCard examType={examType} data={currentExamData} />
        </div>
      </div>
    </div>
  );
};

export default PracticeTests;