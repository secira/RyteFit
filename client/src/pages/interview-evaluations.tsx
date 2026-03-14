import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Video, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  TrendingUp,
  Award,
  Clock,
  User,
  Calendar,
  Plus,
  CalendarClock,
  Send,
  Trash2,
  Play
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function InterviewEvaluations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedJobAppId, setSelectedJobAppId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [selectedInterviewDetails, setSelectedInterviewDetails] = useState<any>(null);
  const [videoData, setVideoData] = useState<{ hasVideo: boolean; videoUrl: string | null; isLoading: boolean }>({
    hasVideo: false,
    videoUrl: null,
    isLoading: false
  });
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [offerData, setOfferData] = useState({ salary: "", benefits: "", letter: "" });
  const [rejectReason, setRejectReason] = useState("");
  const [rescheduleData, setRescheduleData] = useState({
    scheduledDate: "",
    scheduledTime: ""
  });
  const [newInterview, setNewInterview] = useState({
    applicationId: "",
    scheduledDate: "",
    scheduledTime: "",
    interviewType: "ai_async"
  });
  const isRecruiter = (user as any)?.role === 'recruiter' || (user as any)?.role === 'company_admin';

  const handleViewDetails = (interview: any) => {
    setSelectedInterviewDetails(interview);
    setIsDetailsDialogOpen(true);
  };

  const handleViewVideo = async (interview: any) => {
    setSelectedInterviewDetails(interview);
    setVideoData({ hasVideo: false, videoUrl: null, isLoading: true });
    setIsVideoDialogOpen(true);
    
    try {
      // interview.id is the application ID in this context
      const applicationId = interview.applicationId || interview.id;
      const response = await fetch(`/api/applications/${applicationId}/interview-video`);
      if (response.ok) {
        const data = await response.json();
        setVideoData({
          hasVideo: data.hasVideo,
          videoUrl: data.videoUrl,
          isLoading: false
        });
      } else {
        setVideoData({ hasVideo: false, videoUrl: null, isLoading: false });
        toast({
          title: "Video Not Available",
          description: "No interview recording found for this candidate.",
          variant: "destructive"
        });
      }
    } catch (error) {
      setVideoData({ hasVideo: false, videoUrl: null, isLoading: false });
      toast({
        title: "Error",
        description: "Failed to load interview video.",
        variant: "destructive"
      });
    }
  };

  const handleReschedule = (interview: any) => {
    setSelectedInterviewDetails(interview);
    setRescheduleData({
      scheduledDate: interview.interviewDate || "",
      scheduledTime: interview.interviewTime?.split(" ")[0] || ""
    });
    setIsRescheduleDialogOpen(true);
  };

  const handleConfirmReschedule = () => {
    if (!rescheduleData.scheduledDate || !rescheduleData.scheduledTime) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Interview Rescheduled",
      description: `Interview has been rescheduled for ${rescheduleData.scheduledDate} at ${rescheduleData.scheduledTime}`,
    });
    setIsRescheduleDialogOpen(false);
    setRescheduleData({
      scheduledDate: "",
      scheduledTime: ""
    });
  };

  // Fetch applications and jobs
  const { data: applicationsResponse } = useQuery<{ data: any[]; total: number; limit: number; offset: number }>({
    queryKey: ['/api/applications'],
    enabled: isRecruiter && !!user
  });

  const { data: jobsResponse } = useQuery<{ data: any[]; total: number; limit: number; offset: number }>({
    queryKey: ['/api/jobs/company'],
    enabled: isRecruiter && !!user
  });

  const applicationsData = applicationsResponse?.data || [];
  const jobsData = jobsResponse?.data || [];
  
  // Create map of jobs by ID for quick lookup
  const jobMap = new Map(jobsData.map((j: any) => [j.id, j]));
  
  // Build job posting IDs from actual jobs
  const jobPostingIds = jobsData.map((job: any) => ({
    id: job.jobPostingId,
    title: job.title,
    jobId: job.id
  }));

  // Group applications by job ID to create scheduled interviews data
  const scheduledInterviews: Record<string, any[]> = {};
  applicationsData.forEach((app: any) => {
    const jobPostingId = app.jobPostingId || jobMap.get(app.jobId)?.jobPostingId;
    if (jobPostingId) {
      if (!scheduledInterviews[jobPostingId]) {
        scheduledInterviews[jobPostingId] = [];
      }
      
      // Map application status to display status
      let displayStatus = 'pending';
      if (app.status === 'interview_complete') {
        displayStatus = 'interview_complete';
      } else if (app.status === 'interview_scheduled' || app.status === 'interviewing') {
        displayStatus = 'scheduled';
      } else if (app.interviewOutcome) {
        displayStatus = 'completed';
      }
      
      // Determine interview date/time - prefer actual completion time over scheduled time
      let interviewDate = '';
      let interviewTime = '';
      
      // Check if interview was completed (use completedAt from metadata)
      const completedAt = app.metadata?.completedAt || app.interviewCompletedAt;
      const dateToUse = completedAt || app.interviewScheduledAt;
      
      if (dateToUse) {
        const date = new Date(dateToUse);
        interviewDate = date.toISOString().split('T')[0];
        interviewTime = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      }
      
      scheduledInterviews[jobPostingId].push({
        id: app.id,
        candidateName: app.candidateName || 'Unknown Candidate',
        email: app.candidateEmail || '',
        phone: app.candidatePhone || '',
        location: app.candidateLocation || '',
        aiScore: app.aiScore || 0,
        yourScore: app.recruiterScore || 0,
        interviewDate: interviewDate,
        interviewTime: interviewTime,
        status: displayStatus,
        // Interview Evaluation Scores
        interviewScore: app.evaluation?.overallScore || null,
        technicalScore: app.evaluation?.technicalScore || null,
        communicationScore: app.evaluation?.communicationScore || null,
        recommendation: app.evaluation?.recommendation || null,
        evaluationId: app.evaluation?.id || null
      });
    }
  });

  // Create interview mutation
  const offerMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/applications/${selectedInterviewDetails?.applicationId}/offer`, {
        method: 'POST',
        body: JSON.stringify({
          offeredSalary: data.salary ? parseInt(data.salary) : null,
          offeredCurrency: 'INR',
          offeredBenefits: data.benefits || null,
          offerLetter: data.letter || null,
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Offer Extended",
        description: "Job offer has been sent to the candidate.",
      });
      setIsOfferDialogOpen(false);
      setOfferData({ salary: "", benefits: "", letter: "" });
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      setIsDetailsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to extend offer",
        variant: "destructive",
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/applications/${selectedInterviewDetails?.applicationId}/reject`, {
        method: 'POST',
        body: JSON.stringify({
          rejectionReason: rejectReason || null,
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Candidate Rejected",
        description: "Rejection notification will be sent to the candidate.",
      });
      setIsRejectDialogOpen(false);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      setIsDetailsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject candidate",
        variant: "destructive",
      });
    }
  });

  const createInterviewMutation = useMutation({
    mutationFn: async (data: { applicationId: string; scheduledAt: string; interviewType: string }) => {
      return await apiRequest(`/api/applications/${data.applicationId}/schedule-interview`, {
        method: 'POST',
        body: JSON.stringify({
          scheduledAt: data.scheduledAt,
          interviewType: data.interviewType
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Interview Created",
        description: "The interview has been successfully scheduled.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      setIsCreateDialogOpen(false);
      setNewInterview({
        applicationId: "",
        scheduledDate: "",
        scheduledTime: "",
        interviewType: "ai_async"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create interview. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleCreateInterview = () => {
    if (!newInterview.applicationId || !newInterview.scheduledDate || !newInterview.scheduledTime) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const scheduledAt = `${newInterview.scheduledDate}T${newInterview.scheduledTime}:00`;
    createInterviewMutation.mutate({
      applicationId: newInterview.applicationId,
      scheduledAt,
      interviewType: newInterview.interviewType
    });
  };


  const selectedInterviews = selectedJobAppId ? (scheduledInterviews[selectedJobAppId as keyof typeof scheduledInterviews] || []) : [];

  const filteredInterviews = selectedInterviews.filter((interview) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      interview.candidateName.toLowerCase().includes(searchLower) ||
      interview.email.toLowerCase().includes(searchLower) ||
      interview.location.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Calendar className="w-3 h-3 mr-1" />
            Scheduled
          </Badge>
        );
      case 'interview_complete':
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Interview Complete
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85) {
      return (
        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-sm font-semibold">
          {score}%
        </Badge>
      );
    } else if (score >= 70) {
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-sm font-semibold">
          {score}%
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 text-sm font-semibold">
          {score}%
        </Badge>
      );
    }
  };

  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
    return `${formattedDate} at ${time}`;
  };

  // Calculate summary stats for selected job
  const totalScheduled = selectedInterviews.length;
  const avgAiScore = selectedInterviews.length > 0 
    ? Math.round(selectedInterviews.reduce((sum, i) => sum + i.aiScore, 0) / selectedInterviews.length)
    : 0;
  const topScores = selectedInterviews.filter(i => i.aiScore >= 85).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-interview-evaluations">
            Interview Evaluations
          </h1>
          <p className="text-muted-foreground mt-1">
            Schedule and manage AI-powered interviews
          </p>
        </div>
        <Button 
          data-testid="button-create-interview"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Interview
        </Button>
      </div>

      {/* Job Posting ID Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Job Posting</CardTitle>
          <CardDescription>Choose a job posting to view scheduled interviews</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="flex-1 space-y-2">
              <Label htmlFor="job-app-id">Job ID</Label>
              <Select 
                value={selectedJobAppId} 
                onValueChange={setSelectedJobAppId}
              >
                <SelectTrigger id="job-app-id" data-testid="select-job-app-id">
                  <SelectValue placeholder="Select or type Job ID..." />
                </SelectTrigger>
                <SelectContent>
                  {jobPostingIds.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-primary">{job.id}</span>
                        <span className="text-muted-foreground">-</span>
                        <span>{job.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 space-y-2">
              <Label htmlFor="manual-input">Or Type Manually</Label>
              <Input
                id="manual-input"
                placeholder="e.g., TESO20251114001"
                value={selectedJobAppId}
                onChange={(e) => setSelectedJobAppId(e.target.value)}
                data-testid="input-job-app-id"
                className="font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats - Only show when job is selected */}
      {selectedJobAppId && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled Interviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {totalScheduled}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Candidates lined up</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top Candidates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {topScores}
              </div>
              <p className="text-xs text-muted-foreground mt-1">AI Score ≥ 85%</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg AI Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {avgAiScore}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Overall quality</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search - Only show when job is selected */}
      {selectedJobAppId && selectedInterviews.length > 0 && (
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by candidate name, email, or location..."
              className="pl-10"
              data-testid="input-search-interviews"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Interviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Interviews</CardTitle>
          <CardDescription>
            {selectedJobAppId 
              ? `Candidates scheduled for interview - ${selectedJobAppId}` 
              : "Select a job application to view scheduled interviews"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedJobAppId ? (
            <div className="text-center py-12">
              <CalendarClock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Job Selected</h3>
              <p className="text-muted-foreground">
                Please select a Job Application ID above to view scheduled interviews
              </p>
            </div>
          ) : filteredInterviews.length === 0 ? (
            <div className="text-center py-12">
              <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No interviews scheduled</h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "No matching interviews found" 
                  : "No interviews have been scheduled for this job yet"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Candidate</TableHead>
                  <TableHead className="w-[140px]">Contact</TableHead>
                  <TableHead className="w-[55px] text-center">AI</TableHead>
                  <TableHead className="w-[50px] text-center">Tech</TableHead>
                  <TableHead className="w-[50px] text-center">Comm</TableHead>
                  <TableHead className="w-[60px] text-center">Rec</TableHead>
                  <TableHead className="w-[50px] text-center">You</TableHead>
                  <TableHead className="w-[80px]">Date</TableHead>
                  <TableHead className="w-[70px]">Status</TableHead>
                  <TableHead className="text-center w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInterviews.map((interview) => (
                  <TableRow key={interview.id} className="hover-elevate" data-testid={`row-interview-${interview.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium text-sm truncate max-w-[110px]" title={interview.candidateName}>
                          {interview.candidateName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <div className="truncate max-w-[140px]" title={interview.email}>{interview.email}</div>
                        <div className="text-muted-foreground">{interview.phone || '-'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {interview.interviewScore !== null ? (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs font-semibold">
                          {Math.round(interview.interviewScore)}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {interview.technicalScore !== null ? (
                        <Badge className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 text-xs font-semibold">
                          {Math.round(interview.technicalScore)}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {interview.communicationScore !== null ? (
                        <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 text-xs font-semibold">
                          {Math.round(interview.communicationScore)}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {interview.recommendation ? (
                        <Badge variant={
                          interview.recommendation === 'strong_hire' ? 'default' :
                          interview.recommendation === 'hire' ? 'secondary' :
                          interview.recommendation === 'maybe' ? 'outline' : 'destructive'
                        } className="text-xs font-semibold">
                          {interview.recommendation === 'strong_hire' ? 'Strong' : 
                           interview.recommendation === 'hire' ? 'Hire' :
                           interview.recommendation === 'maybe' ? 'Maybe' : 'No'}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {interview.yourScore > 0 ? (
                        <Badge className="bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800 text-xs font-semibold">
                          {interview.yourScore}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(interview.interviewDate, interview.interviewTime)}
                    </TableCell>
                    <TableCell>{getStatusBadge(interview.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1.5 justify-center flex-wrap">
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`button-details-${interview.id}`}
                          onClick={() => handleViewDetails(interview)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Details
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`button-reschedule-${interview.id}`}
                          onClick={() => handleReschedule(interview)}
                        >
                          <CalendarClock className="h-3.5 w-3.5 mr-1" />
                          Reschedule
                        </Button>
                        <Button 
                          size="sm"
                          data-testid={`button-view-${interview.id}`}
                          onClick={() => handleViewVideo(interview)}
                        >
                          <Play className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reschedule Interview Dialog */}
      <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reschedule Interview</DialogTitle>
            <DialogDescription>
              Change the interview date and time for {selectedInterviewDetails?.candidateName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reschedule-date">Interview Date *</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={rescheduleData.scheduledDate}
                onChange={(e) => setRescheduleData({ ...rescheduleData, scheduledDate: e.target.value })}
                data-testid="input-reschedule-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reschedule-time">Interview Time *</Label>
              <Input
                id="reschedule-time"
                type="time"
                value={rescheduleData.scheduledTime}
                onChange={(e) => setRescheduleData({ ...rescheduleData, scheduledTime: e.target.value })}
                data-testid="input-reschedule-time"
              />
            </div>
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <span className="font-semibold">Note:</span> Interviews can start ±10 minutes before or after the scheduled time.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRescheduleDialogOpen(false)} data-testid="button-cancel-reschedule">
              Cancel
            </Button>
            <Button onClick={handleConfirmReschedule} data-testid="button-confirm-reschedule">
              Confirm Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Interview Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-background z-10">
            <DialogTitle>Interview Details</DialogTitle>
            <DialogDescription>
              Candidate interview information and evaluation scores
            </DialogDescription>
          </DialogHeader>
          {selectedInterviewDetails && (
            <div className="grid gap-6 py-4 pr-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Candidate Name</label>
                  <p className="text-base font-semibold mt-1">{selectedInterviewDetails.candidateName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-base font-semibold mt-1">{selectedInterviewDetails.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-base font-semibold mt-1">{selectedInterviewDetails.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <p className="text-base font-semibold mt-1">{selectedInterviewDetails.location}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Interview Scores</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                    <p className="text-sm text-muted-foreground">AI Score</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedInterviewDetails.aiScore}%</p>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-md">
                    <p className="text-sm text-muted-foreground">Interview Score</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {selectedInterviewDetails.interviewScore !== null ? `${Math.round(selectedInterviewDetails.interviewScore)}%` : '-'}
                    </p>
                  </div>
                  <div className="p-3 bg-cyan-50 dark:bg-cyan-950 rounded-md">
                    <p className="text-sm text-muted-foreground">Technical Score</p>
                    <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                      {selectedInterviewDetails.technicalScore !== null ? `${Math.round(selectedInterviewDetails.technicalScore)}%` : '-'}
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950 rounded-md">
                    <p className="text-sm text-muted-foreground">Communication Score</p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {selectedInterviewDetails.communicationScore !== null ? `${Math.round(selectedInterviewDetails.communicationScore)}%` : '-'}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <p className="text-sm text-muted-foreground">Your Score</p>
                    <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                      {selectedInterviewDetails.yourScore > 0 ? `${selectedInterviewDetails.yourScore}%` : '-'}
                    </p>
                  </div>
                  {selectedInterviewDetails.recommendation && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-md">
                      <p className="text-sm text-muted-foreground">Recommendation</p>
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400 capitalize">
                        {selectedInterviewDetails.recommendation === 'strong_hire' ? 'Strong Hire' :
                         selectedInterviewDetails.recommendation === 'hire' ? 'Hire' :
                         selectedInterviewDetails.recommendation === 'maybe' ? 'Maybe' : 'No Hire'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Interview Recording</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewVideo(selectedInterviewDetails)}
                    data-testid="button-view-interview-video"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    View Interview Video
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Interview Schedule</h3>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date & Time</p>
                    <p className="font-semibold">{formatDateTime(selectedInterviewDetails.interviewDate, selectedInterviewDetails.interviewTime)}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Status</h3>
                {getStatusBadge(selectedInterviewDetails.status)}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sticky bottom-0 bg-background z-10 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)} data-testid="button-close-details">
              Close
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setIsRejectDialogOpen(true)}
              data-testid="button-reject-candidate"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => setIsOfferDialogOpen(true)}
              data-testid="button-make-offer"
            >
              <Send className="h-4 w-4 mr-2" />
              Make Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Interview Video Dialog */}
      <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Interview Recording</DialogTitle>
            <DialogDescription>
              Recorded interview video for {selectedInterviewDetails?.candidateName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
              {videoData.isLoading ? (
                <div className="text-center text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p>Loading video...</p>
                </div>
              ) : videoData.hasVideo && videoData.videoUrl ? (
                <video 
                  src={videoData.videoUrl}
                  controls 
                  className="w-full h-full"
                  data-testid="video-player"
                  preload="metadata"
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No interview recording available</p>
                  <p className="text-sm mt-1">The candidate may not have completed their interview yet.</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVideoDialogOpen(false)} data-testid="button-close-video">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Make Offer Dialog */}
      <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Extend Job Offer</DialogTitle>
            <DialogDescription>
              Send a job offer to {selectedInterviewDetails?.candidateName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="offer-salary">Annual Salary (₹)</Label>
              <Input
                id="offer-salary"
                type="number"
                placeholder="e.g., 1000000"
                value={offerData.salary}
                onChange={(e) => setOfferData({ ...offerData, salary: e.target.value })}
                data-testid="input-offer-salary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="offer-benefits">Benefits</Label>
              <Input
                id="offer-benefits"
                placeholder="e.g., Health Insurance, 30 PTO days"
                value={offerData.benefits}
                onChange={(e) => setOfferData({ ...offerData, benefits: e.target.value })}
                data-testid="input-offer-benefits"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="offer-letter">Offer Letter (Optional)</Label>
              <textarea
                id="offer-letter"
                className="w-full p-2 border rounded-md min-h-24 text-sm"
                placeholder="Enter the offer letter content..."
                value={offerData.letter}
                onChange={(e) => setOfferData({ ...offerData, letter: e.target.value })}
                data-testid="textarea-offer-letter"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOfferDialogOpen(false)} data-testid="button-cancel-offer">
              Cancel
            </Button>
            <Button 
              onClick={() => offerMutation.mutate(offerData)}
              disabled={offerMutation.isPending}
              data-testid="button-confirm-offer"
            >
              {offerMutation.isPending ? "Sending..." : "Send Offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reject Candidate</DialogTitle>
            <DialogDescription>
              Inform {selectedInterviewDetails?.candidateName} about the rejection decision
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Rejection Reason (Optional)</Label>
              <textarea
                id="reject-reason"
                className="w-full p-2 border rounded-md min-h-24 text-sm"
                placeholder="Provide feedback for the candidate..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                data-testid="textarea-reject-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} data-testid="button-cancel-reject">
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Interview Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule New Interview</DialogTitle>
            <DialogDescription>
              Schedule an AI-powered interview for a candidate
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="application-select">Candidate Application *</Label>
              <Select 
                value={newInterview.applicationId} 
                onValueChange={(value) => setNewInterview({ ...newInterview, applicationId: value })}
              >
                <SelectTrigger id="application-select" data-testid="select-application">
                  <SelectValue placeholder="Select an application" />
                </SelectTrigger>
                <SelectContent>
                  {applicationsData.length === 0 ? (
                    <SelectItem value="no-applications" disabled>
                      No applications available
                    </SelectItem>
                  ) : (
                    applicationsData.map((app: any) => (
                      <SelectItem key={app.id} value={app.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{app.candidate?.name || app.candidateId}</span>
                          <span className="text-muted-foreground">-</span>
                          <span className="text-muted-foreground text-sm">{app.job?.title}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interview-type">Interview Type *</Label>
              <Select 
                value={newInterview.interviewType} 
                onValueChange={(value) => setNewInterview({ ...newInterview, interviewType: value })}
              >
                <SelectTrigger id="interview-type" data-testid="select-interview-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai_async">AI Asynchronous</SelectItem>
                  <SelectItem value="ai_live">AI Live</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled-date">Date *</Label>
                <Input
                  id="scheduled-date"
                  type="date"
                  value={newInterview.scheduledDate}
                  onChange={(e) => setNewInterview({ ...newInterview, scheduledDate: e.target.value })}
                  data-testid="input-interview-date"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled-time">Time *</Label>
                <Input
                  id="scheduled-time"
                  type="time"
                  value={newInterview.scheduledTime}
                  onChange={(e) => setNewInterview({ ...newInterview, scheduledTime: e.target.value })}
                  data-testid="input-interview-time"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateInterview}
              disabled={createInterviewMutation.isPending}
              data-testid="button-submit-interview"
            >
              {createInterviewMutation.isPending ? "Creating..." : "Schedule Interview"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
