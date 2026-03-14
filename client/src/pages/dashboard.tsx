import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  Briefcase,
  FileText,
  Video,
  CheckCircle2,
  Clock,
  Users,
  Globe,
  TrendingUp,
  Calendar,
  UserCheck,
  XCircle,
  Eye
} from "lucide-react";
import { PaginatedResponse, SelectJob, SelectApplication } from "@shared/schema";

interface JobWithExtras extends SelectJob {
  platformPostingCount?: number;
  latestPostedAt?: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const userRole = (user as any)?.role;
  const companyId = (user as any)?.companyId;

  // Fetch company jobs
  const { data: jobsData, isLoading: jobsLoading } = useQuery<PaginatedResponse<JobWithExtras>>({
    queryKey: ['/api/jobs/company'],
    enabled: !!user && (userRole === 'recruiter' || userRole === 'company_admin'),
  });

  // Fetch company applications
  const { data: applicationsData, isLoading: applicationsLoading } = useQuery<PaginatedResponse<SelectApplication>>({
    queryKey: ['/api/applications'],
    enabled: !!user && (userRole === 'recruiter' || userRole === 'company_admin'),
  });

  const isLoading = jobsLoading || applicationsLoading;

  // Calculate job stats
  const jobs = jobsData?.data || [];
  const totalJobs = jobs.length;
  const publishedJobs = jobs.filter(j => j.status === 'active' || j.status === 'posted').length;
  const draftJobs = jobs.filter(j => j.status === 'draft').length;
  const closedJobs = jobs.filter(j => j.status === 'closed').length;
  const jobsOnPlatforms = jobs.filter(j => (j.platformPostingCount || 0) > 0).length;

  // Calculate application stats
  const applications = applicationsData?.data || [];
  const totalApplications = applications.length;
  const pendingReview = applications.filter(a => 
    a.status === 'submitted' || a.status === 'screening' || a.status === 'new'
  ).length;
  const interviewScheduled = applications.filter(a => 
    a.status === 'interview_scheduled' || a.status === 'interview_pending'
  ).length;
  const interviewCompleted = applications.filter(a => 
    a.status === 'interviewed' || a.status === 'interview_complete'
  ).length;
  const shortlisted = applications.filter(a => 
    a.status === 'shortlisted' || a.status === 'selected'
  ).length;
  const rejected = applications.filter(a => a.status === 'rejected').length;

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-dashboard">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview of your recruitment pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" data-testid="badge-user-role">
            {userRole === 'company_admin' ? 'Company Admin' : 'Recruiter'}
          </Badge>
          <Link href="/jobs/new">
            <Button data-testid="button-create-job">
              <Briefcase className="h-4 w-4 mr-2" />
              Post New Job
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Jobs */}
        <Card className="hover-elevate" data-testid="card-stat-total-jobs">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-sm">Total Jobs</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <Skeleton className="h-12 w-16" />
            ) : (
              <div className="text-4xl font-bold" data-testid="metric-total-jobs">
                {totalJobs}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">All job postings</p>
          </CardContent>
        </Card>

        {/* Published Jobs */}
        <Card className="hover-elevate" data-testid="card-stat-published-jobs">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-600" />
              <CardTitle className="text-sm">Published</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <Skeleton className="h-12 w-16" />
            ) : (
              <div className="text-4xl font-bold" data-testid="metric-published-jobs">
                {publishedJobs}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Live on platforms</p>
          </CardContent>
        </Card>

        {/* Total Applications */}
        <Card className="hover-elevate" data-testid="card-stat-total-applications">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-sm">Applications</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {applicationsLoading ? (
              <Skeleton className="h-12 w-16" />
            ) : (
              <div className="text-4xl font-bold" data-testid="metric-total-applications">
                {totalApplications}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">All candidates</p>
          </CardContent>
        </Card>

        {/* Interviews Completed */}
        <Card className="hover-elevate" data-testid="card-stat-interviews">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-sm">Interviewed</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {applicationsLoading ? (
              <Skeleton className="h-12 w-16" />
            ) : (
              <div className="text-4xl font-bold" data-testid="metric-interviews">
                {interviewCompleted}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Completed interviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Job Status Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Job Status
          </h2>
          <Link href="/jobs">
            <Button variant="outline" size="sm" data-testid="button-view-all-jobs">
              <Eye className="h-4 w-4 mr-2" />
              View All Jobs
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Published */}
          <Card data-testid="card-job-status-published">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Published
              </CardTitle>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-3xl font-bold text-green-600" data-testid="status-job-published">
                  {publishedJobs}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Draft */}
          <Card data-testid="card-job-status-draft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                Draft
              </CardTitle>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-3xl font-bold text-amber-600" data-testid="status-job-draft">
                  {draftJobs}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Closed */}
          <Card data-testid="card-job-status-closed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                Closed
              </CardTitle>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-3xl font-bold text-red-600" data-testid="status-job-closed">
                  {closedJobs}
                </div>
              )}
            </CardContent>
          </Card>

          {/* On Platforms */}
          <Card data-testid="card-job-status-platforms">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-600" />
                On Platforms
              </CardTitle>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-3xl font-bold text-blue-600" data-testid="status-job-platforms">
                  {jobsOnPlatforms}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Application Pipeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Application Pipeline
          </h2>
          <Link href="/applications">
            <Button variant="outline" size="sm" data-testid="button-view-all-applications">
              <Eye className="h-4 w-4 mr-2" />
              View All Applications
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Pending Review */}
          <Card data-testid="card-app-status-pending">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              {applicationsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-3xl font-bold" data-testid="status-app-pending">
                  {pendingReview}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interview Scheduled */}
          <Card data-testid="card-app-status-scheduled">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Scheduled
              </CardTitle>
            </CardHeader>
            <CardContent>
              {applicationsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-3xl font-bold" data-testid="status-app-scheduled">
                  {interviewScheduled}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interviewed */}
          <Card data-testid="card-app-status-interviewed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Video className="h-4 w-4" />
                Interviewed
              </CardTitle>
            </CardHeader>
            <CardContent>
              {applicationsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-3xl font-bold" data-testid="status-app-interviewed">
                  {interviewCompleted}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shortlisted */}
          <Card data-testid="card-app-status-shortlisted">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-600" />
                Shortlisted
              </CardTitle>
            </CardHeader>
            <CardContent>
              {applicationsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-3xl font-bold text-green-600" data-testid="status-app-shortlisted">
                  {shortlisted}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rejected */}
          <Card data-testid="card-app-status-rejected">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              {applicationsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-3xl font-bold text-red-600" data-testid="status-app-rejected">
                  {rejected}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Quick Actions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/jobs/new">
            <Card className="hover-elevate cursor-pointer" data-testid="card-action-new-job">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Post New Job</h3>
                    <p className="text-sm text-muted-foreground">Create a new job posting</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/applications">
            <Card className="hover-elevate cursor-pointer" data-testid="card-action-review-applications">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Review Applications</h3>
                    <p className="text-sm text-muted-foreground">
                      {pendingReview > 0 ? `${pendingReview} pending review` : 'No pending applications'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/job-posting">
            <Card className="hover-elevate cursor-pointer" data-testid="card-action-manage-postings">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Globe className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Manage Job Postings</h3>
                    <p className="text-sm text-muted-foreground">Post jobs to platforms</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
