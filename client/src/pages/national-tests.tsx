import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { type AllIndiaExam, type User as UserType } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, Users, Target, Trophy, BookOpen, CheckCircle, AlertCircle, IndianRupee } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import PaymentButton from "@/components/PaymentButton";

interface TestCardProps {
  test: AllIndiaExam;
  userExamInstances?: any[];
  isAdmin?: boolean;
}

const TestCard = ({ test, userExamInstances = [], isAdmin = false }: TestCardProps) => {
  const { toast } = useToast();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  // Check if user is registered for this test
  const userInstance = userExamInstances.find(instance => 
    instance.allIndiaExamId === test.id
  );
  const isRegistered = !!userInstance;
  const instanceStatus = userInstance?.status || null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Upcoming</Badge>;
      case "live":
        return <Badge variant="default" className="bg-green-500">Live Now</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const registerMutation = useMutation({
    mutationFn: async ({ examId, transactionId }: { examId: string; transactionId: string }) => {
      const response = await apiRequest(`/api/all-india-exams/${examId}/register`, {
        method: 'POST',
        body: JSON.stringify({ transactionId })
      });
      return response;
    },
    onSuccess: () => {
      setShowPaymentDialog(false);
      toast({
        title: "Registration Successful! 🎉",
        description: "You have been registered for this national test. You'll receive a notification before it starts.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/all-india-exams/my-exams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/national-tests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register for the test. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startTestMutation = useMutation({
    mutationFn: async (examId: string) => {
      const response = await apiRequest(`/api/all-india-exams/${examId}/start`, {
        method: 'POST'
      });
      return response as unknown as { instanceId: string };
    },
    onSuccess: (data) => {
      // Redirect to exam interface with instance ID
      window.location.href = `/exam/${data.instanceId}`;
    },
    onError: (error: any) => {
      toast({
        title: "Unable to Start Test",
        description: error.message || "Failed to start the test. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRegisterClick = () => {
    if (test.status === "live" && isRegistered) {
      startTestMutation.mutate(test.id);
    } else if (test.status === "completed" && isRegistered) {
      // Redirect to results page
      window.location.href = `/national-test-results/${userInstance.id}`;
    } else if (!isRegistered) {
      // Show payment dialog
      setShowPaymentDialog(true);
    }
  };

  const handlePaymentSuccess = (transactionId: string) => {
    console.log('Payment successful, registering for test with transaction:', transactionId);
    registerMutation.mutate({ examId: test.id, transactionId });
  };

  const handlePaymentError = (error: string) => {
    console.error('National test registration error:', error);
    setShowPaymentDialog(false);
    toast({
      title: "Payment Failed",
      description: error || "Unable to process payment. Please try again.",
      variant: "destructive",
    });
  };

  const getButtonText = () => {
    if (test.status === "live" && isRegistered) return "Start Test";
    if (test.status === "completed" && isRegistered) return "View Results"; 
    if (test.status === "completed" && !isRegistered) return "View Leaderboard";
    if (isRegistered) return "Registered";
    return "Register Now";
  };

  const isButtonDisabled = () => {
    if (test.status === "completed" && !isRegistered) return true;
    if (isRegistered && test.status === "upcoming") return true;
    return registerMutation.isPending || startTestMutation.isPending;
  };

  return (
    <>
      <Card className="hover-elevate" data-testid={`test-card-${test.id}`}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg mb-2" data-testid={`test-title-${test.id}`}>
                {test.title}
              </CardTitle>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(test.scheduledDate), "MMM dd, yyyy")}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{format(new Date(test.scheduledDate), "HH:mm")}</span>
                </div>
              </div>
            </div>
            {getStatusBadge(test.status || "upcoming")}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
        {/* Test Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-xs text-muted-foreground">{test.duration} minutes</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Questions</p>
                <p className="text-xs text-muted-foreground">{test.totalQuestions} total</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Max Marks</p>
                <p className="text-xs text-muted-foreground">{test.maxScore} marks</p>
              </div>
            </div>
            {isAdmin && (
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Registered</p>
                  <p className="text-xs text-muted-foreground">{test.currentParticipants?.toLocaleString() || "0"} students</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Registration Status */}
        {isRegistered && (
          <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-md">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 dark:text-green-400 font-medium">
              {instanceStatus === 'completed' ? 'Test Completed' : 'Successfully Registered'}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={handleRegisterClick}
            disabled={isButtonDisabled()}
            data-testid={`button-register-${test.id}`}
          >
            {registerMutation.isPending || startTestMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                <span>Loading...</span>
              </div>
            ) : (
              <>
                {isRegistered && test.status === "upcoming" && <CheckCircle className="h-4 w-4 mr-1 text-green-600" />}
                {getButtonText()}
              </>
            )}
          </Button>
          <Link href={`/leaderboard?examType=national-${test.examType.toLowerCase()}&examId=${test.id}`}>
            <Button variant="outline" data-testid={`button-leaderboard-${test.id}`}>
              <Trophy className="h-4 w-4 mr-1" />
              Leaderboard
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>

    {/* Payment Dialog */}
    <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register for National Test</DialogTitle>
          <DialogDescription>
            Complete payment to register for {test.title}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Test Details */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Test</span>
              <span className="font-medium">{test.title}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Date</span>
              <span className="font-medium">{format(new Date(test.scheduledDate), "MMM dd, yyyy")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Time</span>
              <span className="font-medium">{format(new Date(test.scheduledDate), "HH:mm")}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="font-semibold">Registration Fee</span>
              <span className="text-lg font-bold text-primary flex items-center">
                <IndianRupee className="h-4 w-4" />
                995
              </span>
            </div>
          </div>

          {/* Payment Button */}
          <PaymentButton
            amount={995}
            purpose="national_test"
            metadata={{ examId: test.id, examTitle: test.title }}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            buttonText="Pay ₹995 & Register"
            className="w-full"
          />

          <p className="text-xs text-center text-muted-foreground">
            You will be registered immediately after successful payment
          </p>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default function NationalTestsPage() {
  const params = useParams();
  const { examType } = params as { examType?: string };
  const validExamType = examType === "jee" ? "jee" : "neet"; // Default to neet for invalid routes
  const { user } = useAuth();
  const typedUser = user as UserType;

  // Fetch actual national tests from API
  const { data: tests, isLoading } = useQuery<AllIndiaExam[]>({
    queryKey: ['/api/national-tests', validExamType],
    queryFn: async () => {
      const examTypeUpper = validExamType.toUpperCase();
      const response = await fetch(`/api/national-tests?examType=${examTypeUpper}`);
      if (!response.ok) {
        throw new Error('Failed to fetch national tests');
      }
      return response.json();
    },
  });

  // Fetch user's exam instances to show registration status
  const { data: userExamInstances, isLoading: isLoadingUserInstances } = useQuery<any[]>({
    queryKey: ['/api/all-india-exams/my-exams'],
    queryFn: async () => {
      const response = await fetch('/api/all-india-exams/my-exams');
      if (!response.ok) {
        throw new Error('Failed to fetch user exam instances');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading national tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-national-tests-title">
          🎯 National Tests
        </h1>
        <p className="text-muted-foreground">
          Compete with thousands of students across India in our All India mock tests
        </p>
      </div>

      {/* Tests Content */}
      <div className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {tests && tests.length > 0 ? (
            tests.map((test) => (
              <TestCard 
                key={test.id} 
                test={test} 
                userExamInstances={userExamInstances || []}
                isAdmin={typedUser?.isAdmin || false}
              />
            ))
          ) : (
            <div className="col-span-2 text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tests scheduled</h3>
              <p className="text-muted-foreground">
                Check back soon for upcoming {validExamType.toUpperCase()} national tests!
              </p>
            </div>
          )}
        </div>

        {/* User's Test History */}
        {userExamInstances && userExamInstances.length > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span>Your {validExamType.toUpperCase()} Test History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userExamInstances
                    .filter(instance => instance.examType?.toLowerCase() === validExamType)
                    .slice(0, 5)
                    .map((instance, index) => (
                      <div key={instance.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{instance.examTitle || `${validExamType.toUpperCase()} Test`}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(instance.registeredAt), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          {instance.status === 'completed' && (
                            <div className="text-right">
                              <p className="font-medium">{instance.percentage?.toFixed(1)}%</p>
                              <p className="text-sm text-muted-foreground">Score</p>
                            </div>
                          )}
                          <Badge 
                            variant={instance.status === 'completed' ? 'default' : instance.status === 'in_progress' ? 'secondary' : 'outline'}
                          >
                            {instance.status === 'completed' ? 'Completed' : 
                             instance.status === 'in_progress' ? 'In Progress' : 
                             'Registered'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* How it Works */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>🚀 How National Tests Work</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg font-bold text-blue-600">1</span>
            </div>
            <h3 className="font-semibold mb-2">Register</h3>
            <p className="text-sm text-muted-foreground">
              Register for upcoming tests and get notified before they start
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg font-bold text-green-600">2</span>
            </div>
            <h3 className="font-semibold mb-2">Take Test</h3>
            <p className="text-sm text-muted-foreground">
              Appear for the test at the scheduled time with real exam conditions
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg font-bold text-purple-600">3</span>
            </div>
            <h3 className="font-semibold mb-2">Get Results</h3>
            <p className="text-sm text-muted-foreground">
              Get detailed analysis, All India rank, and performance insights
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}