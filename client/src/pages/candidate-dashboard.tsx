import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, FileText, Video, Search, MapPin, Clock, IndianRupee, ArrowRight, Building2, File, Bell, CheckCircle, AlertCircle, Gift, X, Mail, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PaginatedResponse, SelectJob, SelectApplication, SelectCandidateResume } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function CandidateDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState("");
  const [experienceLevelFilter, setExperienceLevelFilter] = useState("");
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [selectedOffer, setSelectedOffer] = useState<any>(null);

  // Fetch all active jobs
  const { data: jobs, isLoading: jobsLoading } = useQuery<PaginatedResponse<SelectJob>>({
    queryKey: ['/api/jobs'],
    enabled: !!user,
  });

  // Fetch user's applications
  const { data: applications, isLoading: applicationsLoading } = useQuery<PaginatedResponse<SelectApplication>>({
    queryKey: ["/api/applications/my"],
    enabled: !!user,
  });

  // Fetch user's resumes
  const { data: resumesData, isLoading: resumesLoading } = useQuery<PaginatedResponse<SelectCandidateResume>>({
    queryKey: ["/api/resumes/my"],
    enabled: !!user,
  });

  const resumes = resumesData?.data || [];
  const myApplications = applications?.data || [];

  // Build notifications from applications
  const notifications = myApplications.map((app: any) => {
    const job = jobs?.data?.find((j: any) => j.id === app.jobId);
    
    if (app.status === 'offer_extended') {
      return {
        id: app.id,
        type: 'success',
        icon: <Gift className="h-5 w-5 text-green-500" />,
        title: 'Job Offer Received',
        message: `You've received a job offer for ${job?.title || 'a position'}`,
        timestamp: new Date(app.updatedAt || app.createdAt).toLocaleString('en-IN'),
      };
    } else if (app.status === 'interview_complete') {
      return {
        id: app.id,
        type: 'info',
        icon: <CheckCircle className="h-5 w-5 text-blue-500" />,
        title: 'Interview Completed',
        message: `Your interview for ${job?.title || 'a position'} has been evaluated`,
        timestamp: new Date(app.updatedAt || app.createdAt).toLocaleString('en-IN'),
      };
    } else if (app.status === 'interview_scheduled' || app.status === 'interviewing') {
      return {
        id: app.id,
        type: 'info',
        icon: <Video className="h-5 w-5 text-blue-500" />,
        title: 'Interview Scheduled',
        message: `Your interview for ${job?.title || 'a position'} is scheduled`,
        timestamp: new Date(app.updatedAt || app.createdAt).toLocaleString('en-IN'),
      };
    } else if (app.status === 'rejected') {
      return {
        id: app.id,
        type: 'error',
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        title: 'Application Update',
        message: `Your application for ${job?.title || 'a position'} has been updated`,
        timestamp: new Date(app.updatedAt || app.createdAt).toLocaleString('en-IN'),
      };
    }
    
    return {
      id: app.id,
      type: 'info',
      icon: <Bell className="h-5 w-5 text-blue-500" />,
      title: 'Application Received',
      message: `Your application for ${job?.title || 'a position'} has been received`,
      timestamp: new Date(app.createdAt).toLocaleString('en-IN'),
    };
  }).slice(0, 5);

  // Filter jobs - only show active jobs
  const filteredJobs = jobs?.data.filter(job => {
    if (job.status !== 'active') return false;
    
    const matchesSearch = !searchTerm || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = !locationFilter || locationFilter === 'all' || job.location === locationFilter;
    const matchesEmploymentType = !employmentTypeFilter || employmentTypeFilter === 'all' || job.employmentType === employmentTypeFilter;
    const matchesExperienceLevel = !experienceLevelFilter || experienceLevelFilter === 'all' || job.experienceLevel === experienceLevelFilter;
    
    return matchesSearch && matchesLocation && matchesEmploymentType && matchesExperienceLevel;
  }) || [];

  // Get unique values for filters
  const locations = Array.from(new Set(jobs?.data?.map(j => j.location).filter(Boolean)));
  const employmentTypes = Array.from(new Set(jobs?.data?.map(j => j.employmentType).filter(Boolean)));
  const experienceLevels = Array.from(new Set(jobs?.data?.map(j => j.experienceLevel).filter(Boolean)));

  const getEmploymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'full_time': 'Full Time',
      'part_time': 'Part Time',
      'contract': 'Contract',
      'internship': 'Internship',
    };
    return labels[type] || type;
  };

  const getExperienceLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      'entry': 'Entry Level',
      'mid': 'Mid Level',
      'senior': 'Senior Level',
      'lead': 'Lead',
      'executive': 'Executive',
    };
    return labels[level] || level;
  };

  // Apply mutation
  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedJob || !selectedResumeId) {
        throw new Error("Please select both a job and a resume");
      }

      const response = await apiRequest("/api/applications", {
        method: "POST",
        body: {
          jobId: selectedJob.id,
          resumeId: selectedResumeId,
        },
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications/my"] });
      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully! Check your My Applications page for status updates.",
      });
      setIsApplyDialogOpen(false);
      setSelectedJob(null);
      setSelectedResumeId("");
    },
    onError: (error: any) => {
      toast({
        title: "Application Failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApplyClick = (job: any) => {
    if (resumes.length === 0) {
      toast({
        title: "No Resumes Found",
        description: "Please upload a resume first on the My Resume page before applying.",
        variant: "destructive",
      });
      return;
    }
    setSelectedJob(job);
    setSelectedResumeId("");
    setIsApplyDialogOpen(true);
  };

  if (jobsLoading || applicationsLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">
          Jobs Listing
        </h1>
        <p className="text-muted-foreground">Browse and apply for available opportunities</p>
      </div>

      {/* Notifications Section */}
      {notifications.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Notifications</CardTitle>
              <Badge variant="outline" className="ml-auto">{notifications.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.map((notification: any) => (
                <div key={notification.id} className="flex gap-3 pb-3 last:pb-0 border-b last:border-b-0">
                  <div className="pt-0.5">{notification.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notification.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Offers Section */}
      {myApplications.filter((app: any) => app.status === 'offer_extended').length > 0 && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-green-600 dark:text-green-400" />
              <CardTitle className="text-lg text-green-900 dark:text-green-100">Job Offers</CardTitle>
              <Badge className="ml-auto bg-green-600 dark:bg-green-700">{myApplications.filter((app: any) => app.status === 'offer_extended').length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myApplications.filter((app: any) => app.status === 'offer_extended').map((offer: any) => (
                <div key={offer.id} className="bg-white dark:bg-gray-900 border border-green-200 dark:border-green-800 p-4 rounded-md">
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-green-900 dark:text-green-100">{offer.job?.title || 'Position'}</p>
                      <p className="text-sm text-muted-foreground">{offer.company?.name || 'Company'}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOffer(offer)}
                      data-testid={`button-view-offer-${offer.id}`}
                    >
                      View Details
                    </Button>
                  </div>
                  {offer.offeredSalary && (
                    <div className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-300">
                      <IndianRupee className="h-4 w-4" />
                      ₹{offer.offeredSalary.toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Briefcase className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-2xl font-bold" data-testid="text-applications-count">
                {applications?.data?.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">My Applications</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Video className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-2xl font-bold" data-testid="text-interviews-count">
                {applications?.data?.filter((a: any) => a.status === "interview_scheduled" || a.status === "interviewed").length || 0}
              </div>
              <div className="text-xs text-muted-foreground">Interviews</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="grid gap-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by job title, department, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-job-search"
            />
          </div>
          <Button data-testid="button-search">Search</Button>
        </div>

        <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
          <div>
            <Label className="text-sm font-medium mb-2 block">Location</Label>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger data-testid="select-location-filter">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(loc => (
                  <SelectItem key={loc} value={loc as string}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Employment Type</Label>
            <Select value={employmentTypeFilter} onValueChange={setEmploymentTypeFilter}>
              <SelectTrigger data-testid="select-employment-type-filter">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {employmentTypes.map(type => (
                  <SelectItem key={type} value={type as string}>
                    {getEmploymentTypeLabel(type as string)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Experience Level</Label>
            <Select value={experienceLevelFilter} onValueChange={setExperienceLevelFilter}>
              <SelectTrigger data-testid="select-experience-level-filter">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {experienceLevels.map(level => (
                  <SelectItem key={level} value={level as string}>
                    {getExperienceLevelLabel(level as string)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      <div>
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
              <p className="text-muted-foreground text-center">
                Try adjusting your search filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="hover-elevate" data-testid={`card-job-${job.id}`}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-semibold text-lg" data-testid={`text-job-title-${job.id}`}>
                            {job.title}
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {job.department || 'General'}
                          </p>
                        </div>
                        <Badge variant="outline" className="flex-shrink-0">
                          {getExperienceLevelLabel(job.experienceLevel || 'mid')}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getEmploymentTypeLabel(job.employmentType || 'full_time')}
                      </span>
                    </div>

                    {(job.salaryMin || job.salaryMax) && (
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <IndianRupee className="h-4 w-4" />
                        {job.salaryMin?.toLocaleString('en-IN')} - {job.salaryMax?.toLocaleString('en-IN')}
                      </div>
                    )}

                    {job.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {job.description.substring(0, 200)}...
                      </p>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex flex-wrap gap-1">
                        {job.extractedSkills?.slice(0, 3).map((skill, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {job.extractedSkills && job.extractedSkills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{job.extractedSkills.length - 3} more
                          </Badge>
                        )}
                      </div>
                      <Button 
                        variant="default" 
                        data-testid={`button-apply-${job.id}`}
                        onClick={() => handleApplyClick(job)}
                        disabled={applyMutation.isPending}
                      >
                        Apply Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Resume Selection Dialog */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Application</DialogTitle>
            <DialogDescription>
              Select which resume to submit for {selectedJob?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {resumesLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : resumes.length === 0 ? (
              <div className="text-center py-4">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No resumes available</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select Resume</Label>
                <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                  <SelectTrigger data-testid="select-resume-to-apply">
                    <SelectValue placeholder="Choose a resume" />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.map((resume) => (
                      <SelectItem key={resume.id} value={resume.id} data-testid={`option-resume-${resume.id}`}>
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4" />
                          {resume.typeName} ({resume.fileName})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsApplyDialogOpen(false);
                setSelectedJob(null);
                setSelectedResumeId("");
              }}
              data-testid="button-cancel-apply"
            >
              Cancel
            </Button>
            <Button
              onClick={() => applyMutation.mutate()}
              disabled={!selectedResumeId || applyMutation.isPending}
              data-testid="button-submit-application"
            >
              {applyMutation.isPending ? "Submitting..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Offer Details Dialog */}
      <Dialog open={!!selectedOffer} onOpenChange={() => setSelectedOffer(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Gift className="h-6 w-6 text-green-600" />
              Job Offer
            </DialogTitle>
            <DialogDescription>
              {selectedOffer?.company?.name} - {selectedOffer?.job?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedOffer && (
            <div className="space-y-6 py-4">
              {/* Position Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Position Details
                </h3>
                <div className="bg-muted/50 p-4 rounded-md space-y-2">
                  <p className="font-medium text-lg">{selectedOffer.job?.title}</p>
                  <p className="text-sm text-muted-foreground">{selectedOffer.company?.name}</p>
                  {selectedOffer.job?.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {selectedOffer.job.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Offer Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Gift className="h-5 w-5 text-green-600" />
                  Offer Terms
                </h3>
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 rounded-md space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {selectedOffer.offeredSalary && (
                      <div>
                        <p className="text-sm text-muted-foreground font-medium mb-1">Offered Salary</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300 flex items-center gap-1">
                          <IndianRupee className="h-5 w-5" />
                          {selectedOffer.offeredSalary.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Per Annum</p>
                      </div>
                    )}
                    {selectedOffer.offeredBenefits && (
                      <div>
                        <p className="text-sm text-muted-foreground font-medium mb-1">Benefits</p>
                        <p className="text-sm font-semibold">{selectedOffer.offeredBenefits}</p>
                      </div>
                    )}
                  </div>

                  {selectedOffer.offerLetter && (
                    <div className="border-t border-green-200 dark:border-green-800 pt-4">
                      <p className="text-sm font-semibold mb-2">Offer Letter</p>
                      <div className="bg-white dark:bg-gray-900 p-4 rounded border border-green-200 dark:border-green-800 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto text-muted-foreground">
                        {selectedOffer.offerLetter}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-green-700 dark:text-green-300 pt-2 border-t border-green-200 dark:border-green-800">
                    Congratulations on your job offer! Please review all terms carefully. Contact your recruiter for any questions or clarifications.
                  </p>
                </div>
              </div>

              {/* Recruiter Contact */}
              {selectedOffer.recruiter && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Recruiter Contact
                  </h3>
                  <div className="bg-muted/50 p-4 rounded-md space-y-2">
                    <p className="font-medium">
                      {selectedOffer.recruiter.firstName} {selectedOffer.recruiter.lastName}
                    </p>
                    {selectedOffer.recruiter.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4" />
                        <a 
                          href={`mailto:${selectedOffer.recruiter.email}`}
                          className="text-primary hover:underline"
                        >
                          {selectedOffer.recruiter.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timeline
                </h3>
                <div className="bg-muted/50 p-4 rounded-md space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Applied:</span>
                    <span className="font-medium">
                      {new Date(selectedOffer.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Offer Received:</span>
                    <span className="font-medium">
                      {new Date(selectedOffer.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedOffer(null)}
              data-testid="button-close-offer"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
