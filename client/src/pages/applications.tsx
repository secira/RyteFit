import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Briefcase, Calendar, Eye, Building2, User, Mail, MapPin, ExternalLink, Search, Clock, Gift } from "lucide-react";
import { RoleGate } from "@/components/RoleGate";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ApplicationsPage() {
  return (
    <RoleGate allowedRoles={['candidate']}>
      <ApplicationsContent />
    </RoleGate>
  );
}

// Helper function to map database status to display status
function getDisplayStatus(dbStatus: string): string {
  switch (dbStatus) {
    case 'submitted':
    case 'screening':
      return 'Applied';
    case 'interview_scheduled':
    case 'interviewing':
    case 'interviewed':
      return 'Interview';
    case 'interview_complete':
      return 'Interview Complete';
    case 'rejected':
      return 'Rejected';
    case 'offer_extended':
    case 'accepted':
      return 'Job Offered';
    default:
      return 'Applied';
  }
}

function ApplicationsContent() {
  const { user } = useAuth();
  const userRole = (user as any)?.role;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [schedulingApp, setSchedulingApp] = useState<any>(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");

  // Handler for starting interview
  const handleStartInterview = (applicationId: string) => {
    if (applicationId) {
      setLocation(`/ai-interview/${applicationId}`);
    }
  };

  const { data: applications = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ['/api/applications/my'],
    enabled: !!user && userRole === 'candidate',
  });

  // Schedule interview mutation
  const scheduleInterviewMutation = useMutation({
    mutationFn: async () => {
      if (!interviewDate || !interviewTime) {
        throw new Error("Please select both date and time");
      }
      const dateTime = new Date(`${interviewDate}T${interviewTime}`);
      return await apiRequest(`/api/applications/${schedulingApp.id}/my-schedule-interview`, {
        method: 'POST',
        body: { scheduledAt: dateTime.toISOString() },
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Interview Scheduled",
        description: "Your interview has been scheduled successfully.",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/interviews/my/sessions'] });
      setSchedulingApp(null);
      setInterviewDate("");
      setInterviewTime("");
    },
    onError: (error: any) => {
      toast({
        title: "Scheduling Failed",
        description: error.message || "Failed to schedule interview",
        variant: "destructive",
      });
    },
  });

  // Schedule interview for now mutation
  const scheduleNowMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      return await apiRequest(`/api/applications/${schedulingApp.id}/my-schedule-interview`, {
        method: 'POST',
        body: { scheduledAt: now.toISOString() },
      });
    },
    onSuccess: () => {
      toast({
        title: "Interview Starting",
        description: "Your interview is starting now.",
      });
      setSchedulingApp(null);
      setInterviewDate("");
      setInterviewTime("");
      handleStartInterview(schedulingApp.id);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Start Interview",
        description: error.message || "Failed to start interview",
        variant: "destructive",
      });
    },
  });

  // Filter applications based on search query
  const filteredApplications = applications.filter((application: any) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      application.job?.title?.toLowerCase().includes(searchLower) ||
      application.job?.jobPostingId?.toLowerCase().includes(searchLower) ||
      application.company?.name?.toLowerCase().includes(searchLower) ||
      application.job?.location?.toLowerCase().includes(searchLower) ||
      application.job?.department?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const displayStatus = getDisplayStatus(status);
    switch (displayStatus) {
      case 'Job Offered':
        return 'default';
      case 'Interview Complete':
        return 'secondary';
      case 'Rejected':
        return 'destructive';
      case 'Interview':
        return 'secondary';
      case 'Applied':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-applications-title">My Applications</h1>
        <p className="text-muted-foreground mt-1">
          Track your job applications and interview status
        </p>
      </div>

      {/* Search Bar */}
      {applications.length > 0 && (
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Job ID, Job Title, Company, Location, or Department..."
              className="pl-10"
              data-testid="input-search-applications"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {applications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Start applying to jobs to see your applications here
              </p>
              <Button data-testid="button-browse-jobs">
                Browse Jobs
              </Button>
            </CardContent>
          </Card>
        ) : filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No matching applications</h3>
              <p className="text-muted-foreground text-center mb-4">
                Try adjusting your search query
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((application: any) => (
            <Card key={application.id} className="hover-elevate" data-testid={`card-application-${application.id}`}>
              <CardHeader>
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl">{application.job?.title}</CardTitle>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium">{application.company?.name || 'Company'}</span>
                      </div>
                      {application.recruiter && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4 flex-shrink-0" />
                          <span>
                            Recruiter: {application.recruiter.firstName} {application.recruiter.lastName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={getStatusColor(application.status)} data-testid={`badge-status-${application.id}`}>
                      {getDisplayStatus(application.status)}
                    </Badge>
                    {application.job?.jobPostingId && (
                      <span className="text-xs text-muted-foreground font-mono" data-testid={`text-job-posting-id-${application.id}`}>
                        {application.job.jobPostingId}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Applied {new Date(application.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      <span>{application.job?.location || 'Remote'}</span>
                    </div>
                  </div>
                  
                  {application.recruiter?.email && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Contact:</span> {application.recruiter.email}
                    </div>
                  )}
                  
                  {application.screeningScore && (
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm font-medium">Screening Score</p>
                      <p className="text-lg font-bold text-primary">
                        {application.screeningScore.toFixed(1)}%
                      </p>
                    </div>
                  )}

                  {application.status === 'offer_extended' && (
                    <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Gift className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <p className="text-sm font-semibold text-green-700 dark:text-green-300">Job Offer Received</p>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-300">
                        Congratulations! You've received a job offer. Click View Details to see the offer details.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      data-testid={`button-view-application-${application.id}`}
                      onClick={() => setSelectedApplication(application)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {application.status === 'scheduled' && !application.interviewScheduledAt && (
                      <Button 
                        size="sm" 
                        onClick={() => setSchedulingApp(application)}
                        data-testid={`button-schedule-interview-${application.id}`}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Interview
                      </Button>
                    )}
                    {application.status === 'scheduled' && application.interviewScheduledAt && (
                      <Button 
                        size="sm" 
                        data-testid={`button-start-interview-${application.id}`}
                        onClick={() => handleStartInterview(application.id)}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Start Interview
                      </Button>
                    )}
                    {application.status === 'interview_complete' && (
                      <div className="text-xs text-muted-foreground">
                        Awaiting evaluation results
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Schedule Interview Dialog */}
      <Dialog open={!!schedulingApp} onOpenChange={() => setSchedulingApp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Your Interview
            </DialogTitle>
            <DialogDescription>
              Choose your preferred date and time for the interview with {schedulingApp?.company?.name}
            </DialogDescription>
          </DialogHeader>
          {schedulingApp && (
            <div className="space-y-6 py-4">
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="font-medium">{schedulingApp.job?.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{schedulingApp.company?.name}</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="interview-date">Interview Date</Label>
                  <Input
                    id="interview-date"
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    data-testid="input-interview-date"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="interview-time">Interview Time</Label>
                  <Input
                    id="interview-time"
                    type="time"
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    data-testid="input-interview-time"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setSchedulingApp(null)}
                  data-testid="button-cancel-schedule"
                >
                  Cancel
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary"
                    onClick={() => scheduleNowMutation.mutate()}
                    disabled={scheduleNowMutation.isPending}
                    data-testid="button-schedule-now"
                  >
                    {scheduleNowMutation.isPending ? 'Starting...' : 'Now'}
                  </Button>
                  <Button 
                    onClick={() => scheduleInterviewMutation.mutate()}
                    disabled={scheduleInterviewMutation.isPending || !interviewDate || !interviewTime}
                    data-testid="button-confirm-schedule"
                  >
                    {scheduleInterviewMutation.isPending ? 'Scheduling...' : 'Schedule Interview'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Application Details Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedApplication?.job?.title}</DialogTitle>
            <DialogDescription>
              Job ID: {selectedApplication?.job?.jobPostingId}
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6 py-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={getStatusColor(selectedApplication.status)}>
                  {getDisplayStatus(selectedApplication.status)}
                </Badge>
              </div>

              {/* Company Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </h3>
                <div className="bg-muted/50 p-4 rounded-md space-y-2">
                  <p className="font-medium text-lg">{selectedApplication.company?.name}</p>
                  {selectedApplication.company?.industry && (
                    <p className="text-sm text-muted-foreground">
                      Industry: {selectedApplication.company.industry}
                    </p>
                  )}
                  {selectedApplication.company?.website && (
                    <a 
                      href={selectedApplication.company.website} 
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
                  {selectedApplication.job?.description && (
                    <div>
                      <p className="text-sm font-medium mb-1">Description</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedApplication.job.description}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {selectedApplication.job?.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{selectedApplication.job.location}</span>
                      </div>
                    )}
                    {selectedApplication.job?.employmentType && (
                      <div>
                        <span className="font-medium">Type:</span> {selectedApplication.job.employmentType}
                      </div>
                    )}
                    {selectedApplication.job?.salaryRange && (
                      <div>
                        <span className="font-medium">Annual Salary:</span> {selectedApplication.job.salaryRange}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recruiter Contact */}
              {selectedApplication.recruiter && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Recruiter Contact
                  </h3>
                  <div className="bg-muted/50 p-4 rounded-md space-y-2">
                    <p className="font-medium">
                      {selectedApplication.recruiter.firstName} {selectedApplication.recruiter.lastName}
                    </p>
                    {selectedApplication.recruiter.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4" />
                        <a 
                          href={`mailto:${selectedApplication.recruiter.email}`}
                          className="text-primary hover:underline"
                        >
                          {selectedApplication.recruiter.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Application Timeline */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline
                </h3>
                <div className="bg-muted/50 p-4 rounded-md space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Applied:</span>
                    <span className="font-medium">
                      {new Date(selectedApplication.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {selectedApplication.interviewScheduledAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interview Scheduled:</span>
                      <span className="font-medium">
                        {new Date(selectedApplication.interviewScheduledAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedApplication.interviewCompletedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interview Completed:</span>
                      <span className="font-medium">
                        {new Date(selectedApplication.interviewCompletedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Screening Score */}
              {selectedApplication.aiMatchScore && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">AI Match Score</h3>
                  <div className="bg-primary/10 p-4 rounded-md">
                    <p className="text-3xl font-bold text-primary">
                      {selectedApplication.aiMatchScore.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Based on resume analysis and job requirements
                    </p>
                  </div>
                </div>
              )}

              {/* Offer Details */}
              {selectedApplication.status === 'offer_extended' && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Gift className="h-5 w-5 text-green-600" />
                    Job Offer Details
                  </h3>
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 rounded-md space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground font-medium mb-1">Offered Salary</p>
                        <p className="text-lg font-bold">
                          {selectedApplication.offeredSalary 
                            ? `₹${selectedApplication.offeredSalary.toLocaleString('en-IN')}` 
                            : 'Not specified'}
                        </p>
                      </div>
                      {selectedApplication.offeredBenefits && (
                        <div>
                          <p className="text-muted-foreground font-medium mb-1">Benefits</p>
                          <p className="text-sm font-semibold">{selectedApplication.offeredBenefits}</p>
                        </div>
                      )}
                    </div>
                    {selectedApplication.offerLetter && (
                      <div className="border-t border-green-200 dark:border-green-800 pt-3">
                        <p className="text-sm font-medium mb-2">Offer Letter</p>
                        <div className="bg-white dark:bg-gray-900 p-3 rounded text-sm whitespace-pre-wrap max-h-48 overflow-y-auto text-muted-foreground">
                          {selectedApplication.offerLetter}
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-green-700 dark:text-green-300 pt-2 border-t border-green-200 dark:border-green-800">
                      Please review the offer carefully and reach out to your recruiter if you have any questions.
                    </p>
                  </div>
                </div>
              )}

              {/* Recruiter Notes */}
              {selectedApplication.recruiterNotes && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Recruiter Notes</h3>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedApplication.recruiterNotes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
