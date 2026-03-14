import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Video, Briefcase, Calendar, Eye, Building2, User, Mail, CheckCircle, Clock, MapPin, ExternalLink, AlertCircle } from "lucide-react";
import { RoleGate } from "@/components/RoleGate";
import { Link, useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function MyInterviewsPage() {
  return (
    <RoleGate allowedRoles={['candidate']}>
      <MyInterviewsContent />
    </RoleGate>
  );
}

// Helper function to map database status to display status
function getDisplayStatus(dbStatus: string): string {
  switch (dbStatus) {
    case 'completed':
      return 'Attended';
    case 'scheduled':
    case 'in_progress':
      return 'Scheduled';
    case 'expired':
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Scheduled';
  }
}

function MyInterviewsContent() {
  const { user } = useAuth();
  const userRole = (user as any)?.role;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [reschedulingInterview, setReschedulingInterview] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [startInterviewInterview, setStartInterviewInterview] = useState<any>(null);

  const { data: interviews = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/interviews/my/sessions'],
    enabled: !!user && userRole === 'candidate',
  });

  // Check if current time is within +/- 10 minutes of scheduled time
  const isInterviewTimeValid = (scheduledAt: string | null | undefined): boolean => {
    if (!scheduledAt) return true; // No time restriction if not scheduled
    
    // Parse scheduled time (ISO string in UTC)
    const scheduledTime = new Date(scheduledAt).getTime();
    const currentTime = new Date().getTime();
    const timeDifference = Math.abs(scheduledTime - currentTime);
    const tenMinutesMs = 10 * 60 * 1000;
    
    console.log('Time validation:', {
      scheduled: new Date(scheduledAt).toISOString(),
      current: new Date(currentTime).toISOString(),
      diffMs: timeDifference,
      diffMinutes: timeDifference / 60000,
      isValid: timeDifference <= tenMinutesMs
    });
    
    return timeDifference <= tenMinutesMs;
  };

  // Get time until interview starts
  const getTimeUntilInterview = (scheduledAt: string | null | undefined): string => {
    if (!scheduledAt) return '';
    
    const scheduledTime = new Date(scheduledAt).getTime();
    const currentTime = new Date().getTime();
    const timeDifference = scheduledTime - currentTime;
    
    if (timeDifference > 0) {
      const minutes = Math.floor(timeDifference / 60000);
      const seconds = Math.floor((timeDifference % 60000) / 1000);
      return `Interview starts in ${minutes}m ${seconds}s`;
    } else {
      const minutes = Math.floor(-timeDifference / 60000);
      const seconds = Math.floor((-timeDifference % 60000) / 1000);
      return `Interview started ${minutes}m ${seconds}s ago`;
    }
  };

  // Reschedule interview mutation
  const rescheduleInterviewMutation = useMutation({
    mutationFn: async () => {
      if (!rescheduleDate || !rescheduleTime) {
        throw new Error("Please select both date and time");
      }
      // Create date in UTC by parsing the local date/time and converting to UTC ISO string
      const localDateTime = new Date(`${rescheduleDate}T${rescheduleTime}`);
      const utcISOString = new Date(localDateTime.getTime() - localDateTime.getTimezoneOffset() * 60000).toISOString();
      
      console.log('Reschedule request:', {
        localInput: `${rescheduleDate}T${rescheduleTime}`,
        utcISO: utcISOString,
      });
      
      return await apiRequest(`/api/applications/${reschedulingInterview.applicationId}/my-schedule-interview`, {
        method: 'POST',
        body: { scheduledAt: utcISOString },
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Interview rescheduled successfully",
      });
      setReschedulingInterview(null);
      setRescheduleDate("");
      setRescheduleTime("");
      queryClient.invalidateQueries({ queryKey: ['/api/interviews/my/sessions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reschedule interview",
        variant: "destructive",
      });
    },
  });

  // Reschedule for now mutation
  const rescheduleNowMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      return await apiRequest(`/api/applications/${reschedulingInterview.applicationId}/my-schedule-interview`, {
        method: 'POST',
        body: { scheduledAt: now.toISOString() },
      });
    },
    onSuccess: () => {
      toast({
        title: "Interview Starting",
        description: "Your interview is starting now.",
      });
      setReschedulingInterview(null);
      setRescheduleDate("");
      setRescheduleTime("");
      setSelectedInterview(null);
      queryClient.invalidateQueries({ queryKey: ['/api/interviews/my/sessions'] });
      handleStartInterview(reschedulingInterview.applicationId, reschedulingInterview);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start interview",
        variant: "destructive",
      });
    },
  });

  // Handler for starting/resuming interview - show time check modal
  const handleStartInterview = (applicationId: string, interview: any) => {
    // Show time check modal instead of directly navigating
    setStartInterviewInterview(interview);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading interviews...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const displayStatus = getDisplayStatus(status);
    switch (displayStatus) {
      case 'Attended':
        return 'default';
      case 'Cancelled':
        return 'destructive';
      case 'Scheduled':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-my-interviews-title">My Interviews</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your scheduled and completed interviews
        </p>
      </div>

      <div className="grid gap-4">
        {interviews.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Video className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No interviews yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Your scheduled and completed interviews will appear here
              </p>
              <Link href="/dashboard">
                <Button data-testid="button-go-to-dashboard">
                  Go to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          interviews.map((interview: any) => (
            <Card key={interview.id} className="hover-elevate" data-testid={`card-interview-${interview.id}`}>
              <CardHeader>
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-1">
                      <CardTitle className="text-xl">{interview.job?.title}</CardTitle>
                      {interview.application?.jobApplicationId && (
                        <div className="text-sm font-semibold text-primary" data-testid={`text-job-app-id-${interview.id}`}>
                          Job ID: {interview.application.jobApplicationId}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium">{interview.company?.name || 'Company'}</span>
                      </div>
                      {interview.recruiter && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4 flex-shrink-0" />
                          <span>
                            Contact: {interview.recruiter.firstName} {interview.recruiter.lastName}
                          </span>
                        </div>
                      )}
                      {interview.recruiter?.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span>{interview.recruiter.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={getStatusColor(interview.status)} data-testid={`badge-status-${interview.id}`}>
                      {interview.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {interview.status === 'scheduled' && <Clock className="h-3 w-3 mr-1" />}
                      {getDisplayStatus(interview.status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Job Description */}
                  {interview.job?.description && (
                    <div className="bg-muted/50 p-3 rounded-md">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {interview.job.description}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {interview.scheduledAt 
                          ? `Scheduled: ${new Date(interview.scheduledAt).toLocaleDateString()}`
                          : interview.completedAt
                          ? `Completed: ${new Date(interview.completedAt).toLocaleDateString()}`
                          : interview.createdAt
                          ? `Created: ${new Date(interview.createdAt).toLocaleDateString()}`
                          : 'Not scheduled'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      <span>{interview.job?.location || 'Remote'}</span>
                    </div>
                    {interview.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{Math.floor(interview.duration / 60)} minutes</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Interview Details */}
                  {interview.status === 'completed' && (
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3 rounded-md">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Interview Completed
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        {interview.questionsAnswered || 0} / {interview.totalQuestions || 10} questions answered
                      </p>
                    </div>
                  )}

                  {interview.status === 'scheduled' && interview.scheduledAt && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 rounded-md">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Interview Scheduled
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Scheduled for {new Date(interview.scheduledAt).toLocaleString()}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      data-testid={`button-view-interview-${interview.id}`}
                      onClick={() => setSelectedInterview(interview)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {(interview.status === 'scheduled' || interview.status === 'pending') && interview.scheduledAt && interview.applicationId && (
                      <Button 
                        size="sm" 
                        data-testid={`button-start-interview-${interview.id}`}
                        onClick={() => handleStartInterview(interview.applicationId, interview)}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Start Interview
                      </Button>
                    )}
                    {interview.status === 'in_progress' && interview.applicationId && (
                      <Button 
                        size="sm" 
                        data-testid={`button-resume-interview-${interview.id}`}
                        onClick={() => handleStartInterview(interview.applicationId, interview)}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Resume Interview
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Interview Details Dialog */}
      <Dialog open={!!selectedInterview} onOpenChange={() => setSelectedInterview(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedInterview?.job?.title}</DialogTitle>
            <DialogDescription>
              Application ID: {selectedInterview?.application?.jobApplicationId}
            </DialogDescription>
          </DialogHeader>
          
          {selectedInterview && (
            <div className="space-y-6 py-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={getStatusColor(selectedInterview.status)}>
                  {selectedInterview.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {selectedInterview.status === 'scheduled' && <Clock className="h-3 w-3 mr-1" />}
                  {getDisplayStatus(selectedInterview.status)}
                </Badge>
              </div>

              {/* Interview Timeline */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Interview Timeline
                </h3>
                <div className="bg-muted/50 p-4 rounded-md space-y-2 text-sm">
                  {selectedInterview.scheduledAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Scheduled:</span>
                      <span className="font-medium">
                        {new Date(selectedInterview.scheduledAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedInterview.completedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed:</span>
                      <span className="font-medium">
                        {new Date(selectedInterview.completedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedInterview.createdAt && !selectedInterview.scheduledAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span className="font-medium">
                        {new Date(selectedInterview.createdAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedInterview.duration && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">
                        {Math.floor(selectedInterview.duration / 60)} minutes {selectedInterview.duration % 60} seconds
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Interview Progress */}
              {selectedInterview.status === 'completed' && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Interview Progress
                  </h3>
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 rounded-md space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-800 dark:text-green-200 font-medium">Questions Answered:</span>
                      <span className="text-green-700 dark:text-green-300 font-bold">
                        {selectedInterview.questionsAnswered || 0} / {selectedInterview.totalQuestions || 10}
                      </span>
                    </div>
                    <div className="w-full bg-green-200 dark:bg-green-900 rounded-full h-2">
                      <div 
                        className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all"
                        style={{ 
                          width: `${((selectedInterview.questionsAnswered || 0) / (selectedInterview.totalQuestions || 10)) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Company Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </h3>
                <div className="bg-muted/50 p-4 rounded-md space-y-2">
                  <p className="font-medium text-lg">{selectedInterview.company?.name}</p>
                  {selectedInterview.company?.industry && (
                    <p className="text-sm text-muted-foreground">
                      Industry: {selectedInterview.company.industry}
                    </p>
                  )}
                  {selectedInterview.company?.website && (
                    <a 
                      href={selectedInterview.company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Visit Website
                    </a>
                  )}
                </div>
              </div>

              {/* Job Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Job Details
                </h3>
                <div className="bg-muted/50 p-4 rounded-md space-y-3">
                  {selectedInterview.job?.description && (
                    <div>
                      <p className="text-sm font-medium mb-1">Description</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedInterview.job.description}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {selectedInterview.job?.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{selectedInterview.job.location}</span>
                      </div>
                    )}
                    {selectedInterview.job?.employmentType && (
                      <div>
                        <span className="font-medium">Type:</span> {selectedInterview.job.employmentType}
                      </div>
                    )}
                    {selectedInterview.job?.salaryRange && (
                      <div>
                        <span className="font-medium">Annual Salary:</span> {selectedInterview.job.salaryRange}
                      </div>
                    )}
                  </div>
                </div>
              </div>


              {/* Recruiter Contact */}
              {selectedInterview.recruiter && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Recruiter Contact
                  </h3>
                  <div className="bg-muted/50 p-4 rounded-md space-y-2">
                    <p className="font-medium">
                      {selectedInterview.recruiter.firstName} {selectedInterview.recruiter.lastName}
                    </p>
                    {selectedInterview.recruiter.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4" />
                        <a 
                          href={`mailto:${selectedInterview.recruiter.email}`}
                          className="text-primary hover:underline"
                        >
                          {selectedInterview.recruiter.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Interview Feedback/Notes */}
              {selectedInterview.feedback && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Interview Feedback</h3>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedInterview.feedback}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-end pt-4 border-t">
                {selectedInterview.status === 'scheduled' && selectedInterview.applicationId && (
                  <Button 
                    onClick={() => {
                      setSelectedInterview(null);
                      handleStartInterview(selectedInterview.applicationId, selectedInterview);
                    }}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Start Interview
                  </Button>
                )}
                {selectedInterview.status === 'in_progress' && selectedInterview.applicationId && (
                  <Button 
                    onClick={() => {
                      setSelectedInterview(null);
                      handleStartInterview(selectedInterview.applicationId, selectedInterview);
                    }}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Resume Interview
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reschedule Interview Dialog */}
      <Dialog open={!!reschedulingInterview} onOpenChange={() => setReschedulingInterview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Reschedule Interview
            </DialogTitle>
            <DialogDescription>
              Choose your new preferred date and time for the interview
            </DialogDescription>
          </DialogHeader>
          {reschedulingInterview && (
            <div className="space-y-6 py-4">
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="font-medium">{reschedulingInterview.job?.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{reschedulingInterview.company?.name}</p>
                {reschedulingInterview.scheduledAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Current: {new Date(reschedulingInterview.scheduledAt).toLocaleString()}
                  </p>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reschedule-date">Interview Date</Label>
                  <Input
                    id="reschedule-date"
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    data-testid="input-reschedule-date"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reschedule-time">Interview Time</Label>
                  <Input
                    id="reschedule-time"
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    data-testid="input-reschedule-time"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setReschedulingInterview(null)}
                  data-testid="button-cancel-reschedule"
                >
                  Cancel
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary"
                    onClick={() => rescheduleNowMutation.mutate()}
                    disabled={rescheduleNowMutation.isPending}
                    data-testid="button-reschedule-now"
                  >
                    {rescheduleNowMutation.isPending ? 'Starting...' : 'Now'}
                  </Button>
                  <Button 
                    onClick={() => rescheduleInterviewMutation.mutate()}
                    disabled={rescheduleInterviewMutation.isPending || !rescheduleDate || !rescheduleTime}
                    data-testid="button-confirm-reschedule"
                  >
                    {rescheduleInterviewMutation.isPending ? 'Rescheduling...' : 'Reschedule Interview'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Start Interview - Time Check Modal */}
      <Dialog open={!!startInterviewInterview} onOpenChange={() => setStartInterviewInterview(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Interview Time Check
            </DialogTitle>
          </DialogHeader>
          
          {startInterviewInterview && (
            <div className="space-y-6 py-4">
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="font-medium">{startInterviewInterview.job?.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{startInterviewInterview.company?.name}</p>
                {startInterviewInterview.application?.jobApplicationId && (
                  <p className="text-xs text-muted-foreground font-mono mt-2">
                    Job ID: {startInterviewInterview.application.jobApplicationId}
                  </p>
                )}
              </div>

              {isInterviewTimeValid(startInterviewInterview.scheduledAt) ? (
                // Time is valid - show success message
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 rounded-md">
                  <div className="flex gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">
                        Interview Ready
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        You are within the interview window. Click "Start Interview" to begin.
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                        Scheduled: {new Date(startInterviewInterview.scheduledAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // Time is not valid - show warning with reschedule option
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-md">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        Not Yet Available
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        You can start this interview within ±10 minutes of the scheduled time.
                      </p>
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mt-2">
                        Scheduled: {new Date(startInterviewInterview.scheduledAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        {getTimeUntilInterview(startInterviewInterview.scheduledAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button 
                  variant="outline"
                  onClick={() => setStartInterviewInterview(null)}
                  data-testid="button-time-check-close"
                >
                  Close
                </Button>
                {isInterviewTimeValid(startInterviewInterview.scheduledAt) ? (
                  <Button 
                    onClick={() => {
                      setStartInterviewInterview(null);
                      if (startInterviewInterview.applicationId) {
                        setLocation(`/ai-interview/${startInterviewInterview.applicationId}`);
                      }
                    }}
                    data-testid="button-start-from-check"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Start Interview
                  </Button>
                ) : (
                  <Button 
                    onClick={() => {
                      setStartInterviewInterview(null);
                      setReschedulingInterview(startInterviewInterview);
                    }}
                    data-testid="button-reschedule-from-check"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Reschedule
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
