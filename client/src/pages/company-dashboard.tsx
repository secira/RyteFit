import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Users, DollarSign, Clock, TrendingUp, CheckCircle2, XCircle, Star } from "lucide-react";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaginatedResponse, SelectJob, SelectApplication } from "@shared/schema";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const CANDIDATE_SOURCE_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // green
  '#06b6d4', // cyan
  '#6366f1', // indigo
  '#84cc16', // lime
];

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const { data: jobs, isLoading: jobsLoading } = useQuery<PaginatedResponse<SelectJob>>({
    queryKey: ["/api/jobs/company"],
    enabled: !!user,
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery<PaginatedResponse<SelectApplication>>({
    queryKey: ["/api/applications"],
    enabled: !!user,
  });

  // Calculate company-wide summary metrics (across ALL jobs)
  const allApplications = applications?.data || [];
  const allJobs = jobs?.data || [];
  const totalInterviews = allApplications.length;
  
  // Open/Vacant jobs - jobs with status 'active' or 'posted' (published and accepting applications)
  const openJobs = allJobs.filter((j: any) => j.status === 'active' || j.status === 'posted').length;
  const vacantJobs = openJobs;
  
  // Filled jobs - jobs that are closed and have at least one selected candidate
  const filledJobs = allJobs.filter((j: any) => 
    j.status === 'closed' && allApplications.some((a: any) => a.jobId === j.id && a.status === 'selected')
  ).length;
  
  // Suspended - applications in screening/on hold
  const suspendedCount = allApplications.filter((a: any) => a.status === 'screening' || a.status === 'on_hold').length;
  
  // Canceled/Rejected applications
  const canceledCount = allApplications.filter((a: any) => a.status === 'rejected' || a.status === 'withdrawn').length;
  
  // Candidates in Process - applications actively being evaluated (not yet decided)
  const inProcessCount = allApplications.filter((a: any) => 
    ['submitted', 'new', 'screening', 'interview_pending', 'interview_scheduled', 'interviewed', 'shortlisted', 'under_review'].includes(a.status)
  ).length;
  
  // Candidates who declined offers
  const refusalCount = allApplications.filter((a: any) => a.status === 'offer_declined').length;
  
  // Hired candidates
  const hiredTotal = allApplications.filter((a: any) => a.status === 'selected' || a.status === 'hired').length;
  
  // Not hired (rejected)
  const notHiredTotal = allApplications.filter((a: any) => a.status === 'rejected').length;
  
  // Total number of job postings created
  const totalJobIds = allJobs.length;
  
  // Age distribution data for pie chart
  const ageDistributionData = [
    { name: 'Under 25', value: 14, count: 14 },
    { name: '25-30', value: 13, count: 13 },
    { name: '30-35', value: 10, count: 10 },
    { name: '35-40', value: 13, count: 13 },
    { name: '40-50', value: 16, count: 16 },
    { name: 'Over 50', value: 12, count: 12 },
  ];

  // Get selected job details
  const selectedJob = jobs?.data?.find((j: any) => j.id === selectedJobId);
  
  // Filter applications for selected job
  const jobApplications = applications?.data?.filter((a: any) => a.jobId === selectedJobId) || [];
  
  // Calculate job-specific metrics
  const daysOpen = selectedJob && selectedJob.createdAt ? Math.floor((new Date().getTime() - new Date(selectedJob.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const totalCandidates = jobApplications.length;
  const submissions = jobApplications.filter((a: any) => a.status !== 'applied').length;
  const hired = jobApplications.filter((a: any) => a.status === 'selected').length;
  const rejected = jobApplications.filter((a: any) => a.status === 'rejected').length;
  
  // Mock candidate source data - in real implementation, this would come from backend
  const candidateSourceData = [
    { name: 'LinkedIn', value: Math.floor(totalCandidates * 0.3), count: Math.floor(totalCandidates * 0.3) },
    { name: 'Indeed', value: Math.floor(totalCandidates * 0.25), count: Math.floor(totalCandidates * 0.25) },
    { name: 'Company Website', value: Math.floor(totalCandidates * 0.15), count: Math.floor(totalCandidates * 0.15) },
    { name: 'Referrals', value: Math.floor(totalCandidates * 0.12), count: Math.floor(totalCandidates * 0.12) },
    { name: 'CareerSite', value: Math.floor(totalCandidates * 0.10), count: Math.floor(totalCandidates * 0.10) },
    { name: 'Glassdoor', value: Math.floor(totalCandidates * 0.08), count: Math.floor(totalCandidates * 0.08) },
  ].filter(item => item.value > 0);
  
  // Get top candidates based on evaluation score
  const topCandidates = jobApplications
    .filter((a: any) => a.evaluationScore || a.matchScore)
    .sort((a: any, b: any) => (b.evaluationScore || b.matchScore || 0) - (a.evaluationScore || a.matchScore || 0))
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "screening":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "interview_scheduled":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "interviewed":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      case "selected":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (jobsLoading || applicationsLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  // Auto-select first job if none selected
  if (!selectedJobId && jobs?.data && jobs.data.length > 0) {
    setSelectedJobId(jobs.data[0].id);
  }

  return (
    <div className="p-6 space-y-8">
      {/* Company-Wide Summary Section */}
      <div>
        <div className="mb-4">
          <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">
            Company Overview
          </h1>
          <p className="text-muted-foreground">Summary metrics across all jobs</p>
        </div>

        {/* Company-wide KPI Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {/* Total Recruitment Interview */}
          <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white border-0">
            <CardContent className="p-4">
              <p className="text-sm font-medium opacity-90">Total recruitment interview</p>
              <p className="text-4xl font-bold mt-2">{totalInterviews}</p>
            </CardContent>
          </Card>

          {/* Vacant */}
          <Card className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-gray-900 border-0">
            <CardContent className="p-4">
              <p className="text-sm font-medium">Vacant</p>
              <p className="text-4xl font-bold mt-2">{vacantJobs}</p>
            </CardContent>
          </Card>

          {/* Filled */}
          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
            <CardContent className="p-4">
              <p className="text-sm font-medium opacity-90">Filled</p>
              <p className="text-4xl font-bold mt-2">{filledJobs}</p>
            </CardContent>
          </Card>

          {/* Candidate in Process */}
          <Card className="bg-gradient-to-br from-amber-400 to-amber-500 text-gray-900 border-0">
            <CardContent className="p-4">
              <p className="text-sm font-medium">Candidate in Process</p>
              <p className="text-4xl font-bold mt-2">{inProcessCount}</p>
            </CardContent>
          </Card>

          {/* Hired */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <p className="text-sm font-medium opacity-90">Hired</p>
              <p className="text-4xl font-bold mt-2">{hiredTotal}</p>
            </CardContent>
          </Card>

          {/* Total Job IDs */}
          <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white border-0">
            <CardContent className="p-4">
              <p className="text-sm font-medium opacity-90">Total Job IDs</p>
              <p className="text-4xl font-bold mt-2">{totalJobIds}</p>
            </CardContent>
          </Card>
        </div>

        {/* Second Row of Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 mt-4">
          {/* Suspended */}
          <Card className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-gray-900 border-0">
            <CardContent className="p-4">
              <p className="text-sm font-medium">Suspended</p>
              <p className="text-4xl font-bold mt-2">{suspendedCount}</p>
            </CardContent>
          </Card>

          {/* Canceled */}
          <Card className="bg-gradient-to-br from-gray-600 to-gray-700 text-white border-0">
            <CardContent className="p-4">
              <p className="text-sm font-medium opacity-90">Canceled</p>
              <p className="text-4xl font-bold mt-2">{canceledCount}</p>
            </CardContent>
          </Card>

          {/* Candidate Refusal */}
          <Card className="bg-gradient-to-br from-amber-400 to-amber-500 text-gray-900 border-0">
            <CardContent className="p-4">
              <p className="text-sm font-medium">Candidate Refusal</p>
              <p className="text-4xl font-bold mt-2">{refusalCount}</p>
            </CardContent>
          </Card>

          {/* Not Hired */}
          <Card className="bg-gradient-to-br from-red-700 to-red-800 text-white border-0">
            <CardContent className="p-4">
              <p className="text-sm font-medium opacity-90">Not Hired</p>
              <p className="text-4xl font-bold mt-2">{notHiredTotal}</p>
            </CardContent>
          </Card>

          {/* Open Jobs */}
          <Card className="bg-gradient-to-br from-cyan-600 to-cyan-700 text-white border-0">
            <CardContent className="p-4">
              <p className="text-sm font-medium opacity-90">Open Jobs</p>
              <p className="text-4xl font-bold mt-2">{openJobs}</p>
            </CardContent>
          </Card>

          {/* Age Distribution Chart */}
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-3">
              <ResponsiveContainer width="100%" height={80}>
                <PieChart>
                  <Pie
                    data={ageDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={35}
                    fill="#8884d8"
                    dataKey="value"
                    label={false}
                  >
                    {ageDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CANDIDATE_SOURCE_COLORS[index % CANDIDATE_SOURCE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-xs text-center mt-1 opacity-90">Age Distribution</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Job-Specific Data Section */}
      <div className="border-t pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold">Job-Specific Analytics</h2>
            <p className="text-muted-foreground">Detailed metrics for selected job</p>
          </div>
          <div className="w-64">
            <Select value={selectedJobId || ""} onValueChange={setSelectedJobId}>
              <SelectTrigger data-testid="select-job">
                <SelectValue placeholder="Select a job" />
              </SelectTrigger>
              <SelectContent>
                {jobs?.data?.map((job: any) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedJob ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No jobs available. Create a job in the AI Workflow to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Colorful KPI Cards - Zoho Style */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Days Open</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400" data-testid="metric-days-open">
                  {daysOpen}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Candidates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400" data-testid="metric-candidates">
                  {totalCandidates}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-background">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400" data-testid="metric-submissions">
                  {submissions}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Hired</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="metric-hired">
                  {hired}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-rose-500 bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-background">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Spent on Publishing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-rose-600 dark:text-rose-400" data-testid="metric-spent">
                  ₹300
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Analytics Section */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Candidate Source Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Candidate Source ({totalCandidates})</CardTitle>
                <CardDescription>Where candidates are coming from</CardDescription>
              </CardHeader>
              <CardContent>
                {candidateSourceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={candidateSourceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name} (${entry.count})`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {candidateSourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CANDIDATE_SOURCE_COLORS[index % CANDIDATE_SOURCE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    <p>No candidate data yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ideal Candidates Section */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Ideal Candidates</CardTitle>
                <CardDescription>Top-rated candidates for this position</CardDescription>
              </CardHeader>
              <CardContent>
                {topCandidates.length > 0 ? (
                  <div className="space-y-4">
                    {topCandidates.map((app: any) => {
                      const score = app.evaluationScore || app.matchScore || 0;
                      const initials = `${app.candidate?.firstName?.[0] || ''}${app.candidate?.lastName?.[0] || ''}`.toUpperCase();
                      
                      return (
                        <div key={app.id} className="flex items-center gap-4 p-3 rounded-lg border hover-elevate" data-testid={`candidate-${app.id}`}>
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-semibold">
                              {app.candidate?.firstName} {app.candidate?.lastName}
                            </h4>
                            <p className="text-sm text-muted-foreground">{app.candidate?.email}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">{Math.round(score / 10).toFixed(1)}</div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              </div>
                            </div>
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2" />
                    <p>No evaluated candidates yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Job Boards Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>Job Boards</CardTitle>
                  <CardDescription>Where this job is published</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Job Board Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Published Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Published/Updated On</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Expires On</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Applied Candidates</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm">
                        <a href="#" className="text-blue-600 hover:underline">LinkedIn</a>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">Paid</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {selectedJob?.createdAt ? new Date(selectedJob.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-rose-600">
                        {selectedJob?.createdAt ? new Date(new Date(selectedJob.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">{Math.floor(totalCandidates * 0.4)}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className="text-blue-600 hover:underline cursor-pointer">Update</span>
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm">
                        <span className="text-blue-600">Indeed</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">Paid</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {selectedJob?.createdAt ? new Date(selectedJob.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-sm">—</td>
                      <td className="py-3 px-4 text-sm font-medium">{Math.floor(totalCandidates * 0.3)}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className="text-blue-600 hover:underline cursor-pointer">Update</span>
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm">
                        <span className="text-blue-600">Glassdoor</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          Failed
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">Free</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {selectedJob?.createdAt ? new Date(selectedJob.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-sm">—</td>
                      <td className="py-3 px-4 text-sm font-medium">0</td>
                      <td className="py-3 px-4 text-sm">
                        <span className="text-blue-600 hover:underline cursor-pointer">Republish</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      </div>
    </div>
  );
}
