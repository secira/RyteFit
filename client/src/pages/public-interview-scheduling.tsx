import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Briefcase, Building2, User, Phone, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function PublicInterviewScheduling() {
  const { token } = useParams<{ token: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Fetch scheduling details
  const { data: schedulingInfo, isLoading, error } = useQuery({
    queryKey: [`/api/public/interview-scheduling/${token}`],
    enabled: !!token,
  });

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !selectedTime) {
        throw new Error("Please select date and time");
      }

      console.log('[FRONTEND] Submitting interview scheduling:', { token, selectedDate, selectedTime });
      const response = await apiRequest(
        `/api/public/interview-scheduling/${token}`,
        {
          method: 'POST',
          body: {
            interviewDate: selectedDate,
            interviewTime: selectedTime,
          }
        }
      );
      console.log('[FRONTEND] Interview scheduling response:', response);
      const data = await response.json();
      console.log('[FRONTEND] Interview scheduling JSON:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('[FRONTEND] Interview scheduled successfully:', data);
      setIsSubmitted(true);
      toast({
        title: "Interview Scheduled Successfully!",
        description: "Check your email for the interview link. You will be redirected shortly.",
      });
      
      // Redirect to interview page after 3 seconds
      setTimeout(() => {
        if (data?.interviewToken) {
          navigate(`/public/interview/${data.interviewToken}`);
        }
      }, 3000);
    },
    onError: (error: any) => {
      console.error('[FRONTEND] Interview scheduling error:', error);
      toast({
        title: "Scheduling Failed",
        description: error.message || "Could not schedule interview. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <h1 className="text-xl font-semibold">Invalid or Expired Link</h1>
              <p className="text-sm text-muted-foreground">
                This interview scheduling link is no longer valid. Please contact your recruiter.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Schedule Your Interview
          </CardTitle>
          <CardDescription>
            Select a convenient date and time for your interview
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Job Details Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Job Position</h3>
            
            <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <p className="font-semibold text-lg" data-testid="text-job-title">
                    {schedulingInfo?.job?.title}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {schedulingInfo?.company?.name}
                  </p>
                </div>
              </div>

              {schedulingInfo?.job?.location && (
                <p className="text-sm text-muted-foreground">
                  📍 {schedulingInfo.job.location}
                </p>
              )}

              {schedulingInfo?.job?.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {schedulingInfo.job.description}
                </p>
              )}
            </div>
          </div>

          {/* Recruiter Contact Section */}
          {schedulingInfo?.recruiter && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg">Your Recruiter</h3>
              
              <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                <p className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{schedulingInfo.recruiter.firstName} {schedulingInfo.recruiter.lastName}</span>
                </p>
                {schedulingInfo.recruiter.mobileNumber && (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {schedulingInfo.recruiter.mobileNumber}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Scheduling Section */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-lg">Select Interview Date & Time</h3>

            {isSubmitted ? (
              <div className="space-y-4 text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                <div>
                  <p className="font-semibold text-lg">Interview Scheduled!</p>
                  <p className="text-sm text-muted-foreground">
                    Redirecting to your interview...
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Interview Date
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      data-testid="input-interview-date"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Interview Time
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      data-testid="input-interview-time"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => scheduleMutation.mutate()}
                  disabled={!selectedDate || !selectedTime || scheduleMutation.isPending}
                  className="w-full"
                  size="lg"
                  data-testid="button-schedule-interview"
                >
                  {scheduleMutation.isPending ? "Scheduling..." : "Schedule Interview"}
                </Button>
              </div>
            )}
          </div>

          {/* Info Message */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              After scheduling, you'll receive a link to start your AI-powered interview. The interview will be conducted via video and will take approximately 30-45 minutes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
