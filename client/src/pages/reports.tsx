import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Video, 
  Clock, 
  CheckCircle,
  Bell,
  Mail,
  AlertCircle,
  Info,
  FileText,
  Download,
  Search,
  Eye,
  XCircle,
  FileDown,
  Trophy,
  Star,
  HelpCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { RoleGate } from "@/components/RoleGate";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ReportsPage() {
  return (
    <RoleGate allowedRoles={['recruiter', 'company_admin']}>
      <ReportsContent />
    </RoleGate>
  );
}

function ReportsContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const userRole = (user as any)?.role;
  const [activeTab, setActiveTab] = useState("reports");
  const [activeReportTab, setActiveReportTab] = useState("summary");
  const [selectedJobPostingId, setSelectedJobPostingId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selection Report state
  const [selectedSelectionJobId, setSelectedSelectionJobId] = useState("");
  const [selectionSearchQuery, setSelectionSearchQuery] = useState("");
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  
  // Job Summary and Details Report state
  const [isSummaryEmailDialogOpen, setIsSummaryEmailDialogOpen] = useState(false);
  const [isDetailsEmailDialogOpen, setIsDetailsEmailDialogOpen] = useState(false);
  const [summaryEmailRecipient, setSummaryEmailRecipient] = useState("");
  const [detailsEmailRecipient, setDetailsEmailRecipient] = useState("");

  const { data: stats, isLoading } = useQuery<{
    totalJobs: number;
    totalApplications: number;
    completedInterviews: number;
  }>({
    queryKey: ['/api/company/stats'],
    enabled: !!user && (userRole === 'recruiter' || userRole === 'company_admin'),
  });

  // Fetch jobs and applications
  const { data: jobsResponse } = useQuery<{ data: any[]; total: number; limit: number; offset: number }>({
    queryKey: ['/api/jobs/company'],
    enabled: !!user && (userRole === 'recruiter' || userRole === 'company_admin'),
  });

  const { data: applicationsResponse } = useQuery<{ data: any[]; total: number; limit: number; offset: number }>({
    queryKey: ['/api/applications'],
    enabled: !!user && (userRole === 'recruiter' || userRole === 'company_admin'),
  });

  // Fetch evaluations for detailed report
  const { data: evaluationsResponse } = useQuery<{ data: any[]; total: number; limit: number; offset: number }>({
    queryKey: ['/api/interview-evaluations'],
    enabled: !!user && (userRole === 'recruiter' || userRole === 'company_admin'),
  });

  // Fetch interview sessions for accurate interviewed count
  const { data: interviewSessionsResponse } = useQuery<{ data: any[] }>({
    queryKey: ['/api/interview-sessions'],
    enabled: !!user && (userRole === 'recruiter' || userRole === 'company_admin'),
  });

  // Fetch selection decisions for accurate selected count
  const { data: selectionDecisionsResponse } = useQuery<any[]>({
    queryKey: ['/api/selection-decisions'],
    enabled: !!user && (userRole === 'recruiter' || userRole === 'company_admin'),
  });

  // Selection Report queries
  const { data: selectionReportData, isLoading: isLoadingSelectionReport } = useQuery<{ 
    job: any; 
    candidates: any[]; 
    totalCandidates: number;
    selected: number;
    maybe: number;
  }>({
    queryKey: ['/api/selection-report', selectedSelectionJobId],
    enabled: !!user && (userRole === 'recruiter' || userRole === 'company_admin') && !!selectedSelectionJobId
  });

  const selectionCandidates = selectionReportData?.candidates || [];
  
  const filteredSelectionCandidates = selectionCandidates.filter((candidate) => {
    if (!selectionSearchQuery) return true;
    const searchLower = selectionSearchQuery.toLowerCase();
    return (
      candidate.candidateName.toLowerCase().includes(searchLower) ||
      candidate.candidateEmail.toLowerCase().includes(searchLower)
    );
  });

  // Selection Report helper functions
  const getScoreColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 80) return "text-blue-600 dark:text-blue-400";
    if (score >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getRecommendationBadge = (recommendation: string) => {
    if (recommendation === 'Selected') {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Selected</Badge>;
    }
    if (recommendation === 'Maybe') {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Maybe</Badge>;
    }
    return <Badge variant="secondary">{recommendation}</Badge>;
  };

  const exportSelectionToCSV = () => {
    if (!selectionReportData || selectionCandidates.length === 0) {
      toast({
        title: "No Data",
        description: "Please select a job with shortlisted candidates first",
        variant: "destructive"
      });
      return;
    }

    const headers = [
      'Rank',
      'Candidate Name',
      'Email',
      'Phone',
      'Resume Score',
      'Interview Score',
      'Technical Score',
      'Communication Score',
      'Recommendation',
      'Notes'
    ];

    const rows = selectionCandidates.map(c => [
      c.rank || '-',
      c.candidateName,
      c.candidateEmail || '-',
      c.candidatePhone || '-',
      c.resumeScreeningScore || '-',
      c.interviewScore || '-',
      c.technicalScore || '-',
      c.communicationScore || '-',
      c.recommendation,
      c.notes || '-'
    ]);

    const csvContent = [
      `Selection Report - ${selectionReportData.job.title} (${selectionReportData.job.jobPostingId})`,
      `Generated: ${new Date().toLocaleDateString('en-IN')}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `selection-report-${selectionReportData.job.jobPostingId}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Report Downloaded",
      description: "Selection report has been exported as CSV",
    });
  };

  // Export Job Summary to CSV
  const exportJobSummaryToCSV = () => {
    if (jobSummaryData.length === 0) {
      toast({
        title: "No Data",
        description: "No job summary data available to export",
        variant: "destructive"
      });
      return;
    }

    const headers = [
      'Job ID',
      'Job Title',
      'Start Date',
      'End Date',
      'Candidates Applied',
      'Candidates Interviewed',
      'Candidates Selected',
      'Posting Platforms'
    ];

    const rows = jobSummaryData.map(job => [
      job.jobPostingId,
      job.title,
      formatDate(job.startDate),
      formatDate(job.endDate),
      job.candidatesApplied,
      job.candidatesInterviewed,
      job.candidatesSelected,
      job.platforms.join('; ')
    ]);

    const csvContent = [
      `Job Summary Report`,
      `Generated: ${new Date().toLocaleDateString('en-IN')}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `job-summary-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Report Downloaded",
      description: "Job summary report has been exported as CSV",
    });
  };

  // Export Job Details to CSV
  const exportJobDetailsToCSV = () => {
    if (!selectedJobPostingId || filteredJobDetails.length === 0) {
      toast({
        title: "No Data",
        description: "Please select a job with candidates first",
        variant: "destructive"
      });
      return;
    }

    const headers = [
      'Candidate Name',
      'Email',
      'Phone Number',
      'Interview Date',
      'Questions Asked',
      'Questions Answered',
      'Wrong Questions',
      'AI Ranking',
      'Our Ranking',
      'Status'
    ];

    const rows = filteredJobDetails.map(c => [
      c.candidateName,
      c.email,
      c.phone,
      c.interviewDate,
      c.questionsAsked,
      c.questionsAnswered,
      c.wrongQuestions,
      c.aiRanking,
      c.ourRanking,
      c.status
    ]);

    const csvContent = [
      `Job Details Report - ${selectedJobPostingId}`,
      `Generated: ${new Date().toLocaleDateString('en-IN')}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `job-details-report-${selectedJobPostingId}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Report Downloaded",
      description: "Job details report has been exported as CSV",
    });
  };

  // Email mutations for Job Summary and Job Details
  const sendSummaryEmailMutation = useMutation({
    mutationFn: async (data: { recipientEmail: string; reportType: string }) => {
      return await apiRequest('/api/reports/send-email', {
        method: 'POST',
        body: { ...data, reportData: jobSummaryData }
      });
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Job summary report has been sent successfully",
      });
      setIsSummaryEmailDialogOpen(false);
      setSummaryEmailRecipient("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    }
  });

  const sendDetailsEmailMutation = useMutation({
    mutationFn: async (data: { recipientEmail: string; reportType: string; jobPostingId: string }) => {
      return await apiRequest('/api/reports/send-email', {
        method: 'POST',
        body: { ...data, reportData: filteredJobDetails }
      });
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Job details report has been sent successfully",
      });
      setIsDetailsEmailDialogOpen(false);
      setDetailsEmailRecipient("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    }
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: { recipientEmail: string; jobId: string }) => {
      return await apiRequest('/api/selection-report/send-email', {
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Selection report has been sent to the hiring manager",
      });
      setIsEmailDialogOpen(false);
      setEmailRecipient("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    }
  });

  const jobsData = jobsResponse?.data || [];
  const applicationsData = applicationsResponse?.data || [];
  const evaluationsData = evaluationsResponse?.data || [];
  const interviewSessionsData = interviewSessionsResponse?.data || [];
  const selectionDecisionsData = selectionDecisionsResponse || [];

  // Create evaluation map for quick lookup
  const evaluationMap = new Map(evaluationsData.map((ev: any) => [ev.applicationId, ev]));
  
  // Create maps for interview sessions and selection decisions by job
  const interviewSessionsByJob = new Map<string, Set<string>>();
  const selectionsByJob = new Map<string, Set<string>>();
  
  // Build interview sessions map (count unique applications with completed/in-progress interviews per job)
  interviewSessionsData.forEach((session: any) => {
    if (session.status === 'completed' || session.status === 'in_progress') {
      const app = applicationsData.find((a: any) => a.id === session.applicationId);
      if (app?.jobId) {
        if (!interviewSessionsByJob.has(app.jobId)) {
          interviewSessionsByJob.set(app.jobId, new Set());
        }
        interviewSessionsByJob.get(app.jobId)!.add(session.applicationId);
      }
    }
  });
  
  // Build selection decisions map (count unique applications with selected/shortlisted decisions per job)
  // Also create a map by applicationId for quick lookup in job details
  const selectionDecisionsByApp = new Map<string, string>();
  selectionDecisionsData.forEach((decision: any) => {
    if (decision.decision === 'selected' || decision.decision === 'shortlisted') {
      // Map applicationId to decision type
      selectionDecisionsByApp.set(decision.applicationId, decision.decision);
      if (decision.jobId) {
        if (!selectionsByJob.has(decision.jobId)) {
          selectionsByJob.set(decision.jobId, new Set());
        }
        selectionsByJob.get(decision.jobId)!.add(decision.applicationId);
      }
    }
  });

  // Build job posting IDs from actual jobs
  const jobPostingIds = jobsData.map((job: any) => ({
    id: job.jobPostingId,
    title: job.title,
    jobId: job.id
  }));

  // Build summary report by aggregating applications per job
  const jobSummaryData = jobsData.map((job: any, idx: number) => {
    const jobApps = applicationsData.filter((app: any) => app.jobId === job.id);
    
    // Get interviewed count from interview_sessions table (more accurate)
    const interviewedSet = interviewSessionsByJob.get(job.id);
    const interviewedCount = interviewedSet ? interviewedSet.size : 0;
    
    // Get selected count from selection_decisions table (more accurate)
    const selectedSet = selectionsByJob.get(job.id);
    const selectedCount = selectedSet ? selectedSet.size : 0;
    
    return {
      id: idx + 1,
      jobPostingId: job.jobPostingId,
      title: job.title,
      startDate: job.createdAt || new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      candidatesApplied: jobApps.length,
      candidatesInterviewed: interviewedCount,
      candidatesSelected: selectedCount,
      platforms: ["RyteFit"]
    };
  });

  // Build details report by grouping applications per job with evaluation data
  const jobDetailsData: Record<string, any[]> = {};
  jobsData.forEach((job: any) => {
    const jobApps = applicationsData.filter((app: any) => app.jobId === job.id);
    jobDetailsData[job.jobPostingId] = jobApps.map((app: any) => {
      const evaluation = evaluationMap.get(app.id);
      
      // Check selection decisions first (from selection_decisions table)
      const getDisplayStatus = (appId: string, status: string): string => {
        // First check if candidate is in selection_decisions table
        const selectionDecision = selectionDecisionsByApp.get(appId);
        if (selectionDecision === 'selected') {
          return 'Selected';
        }
        if (selectionDecision === 'shortlisted') {
          return 'Shortlisted';
        }
        
        // Fall back to application status
        switch (status) {
          case 'submitted':
          case 'screening':
            return 'Applied';
          case 'interview_scheduled':
          case 'interviewing':
          case 'interviewed':
            return 'Interview';
          case 'interview_complete':
            return 'Interview Complete';
          case 'offer_extended':
            return 'Selected';
          case 'accepted':
            return 'Accepted';
          case 'rejected':
            return 'Rejected';
          default:
            return 'Applied';
        }
      };

      // Get interview date priority: scheduledAt > interviewScheduledAt > startedAt (fallback if no schedule)
      const interviewSession = app.interviewSession;
      let interviewDateValue = '-';
      
      const safeFormatDate = (dateInput: any): string => {
        if (!dateInput) return '-';
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      };
      
      // Priority: session.scheduledAt > app.interviewScheduledAt > session.startedAt
      if (interviewSession?.scheduledAt) {
        interviewDateValue = safeFormatDate(interviewSession.scheduledAt);
      } else if (app.interviewScheduledAt) {
        interviewDateValue = safeFormatDate(app.interviewScheduledAt);
      } else if (interviewSession?.startedAt) {
        interviewDateValue = safeFormatDate(interviewSession.startedAt);
      }

      return {
        id: app.id,
        candidateName: app.candidateName || app.candidate?.name || 'Unknown',
        email: app.candidateEmail || app.candidate?.email || '',
        phone: app.candidatePhone || app.candidate?.phone || '',
        interviewDate: interviewDateValue,
        questionsAsked: evaluation?.questionsAsked || app.questionsAsked || 0,
        questionsAnswered: evaluation?.questionsAnswered || app.questionsAnswered || 0,
        wrongQuestions: evaluation?.wrongQuestions || app.wrongQuestions || 0,
        aiRanking: evaluation?.overallScore || app.aiMatchScore || 0,
        ourRanking: evaluation?.overallScore || app.overallScore || 0,
        status: getDisplayStatus(app.id, app.status)
      };
    });
  });

  const selectedJobDetails = selectedJobPostingId ? (jobDetailsData[selectedJobPostingId] || []) : [];

  const filteredJobDetails = selectedJobDetails.filter((candidate) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      candidate.candidateName.toLowerCase().includes(searchLower) ||
      candidate.email.toLowerCase().includes(searchLower)
    );
  });

  // Build notifications from actual applications
  const notifications = applicationsData.slice(0, 6).map((app: any, idx: number) => {
    const job = jobsData.find((j: any) => j.id === app.jobId);
    const types = ["success", "info", "success"];
    return {
      id: idx + 1,
      type: types[idx % 3],
      title: app.interviewOutcome === 'cleared' ? "Candidate Selected" : "Application Received",
      message: `${app.candidateName} applied for ${job?.title || 'a position'}`,
      timestamp: new Date(app.createdAt).toLocaleString('en-IN'),
      read: idx > 1,
      jobPostingId: job?.jobPostingId || null
    };
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '-') return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Selected":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Selected
          </Badge>
        );
      case "Shortlisted":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Shortlisted
          </Badge>
        );
      case "Interview":
      case "Interview Complete":
        return (
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            <Clock className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      case "Applied":
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            <Clock className="w-3 h-3 mr-1" />
            Applied
          </Badge>
        );
      case "Accepted":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        );
      case "Rejected":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            <Clock className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      title: "Total Jobs",
      value: stats?.totalJobs || 0,
      icon: BarChart3,
      description: "Active job postings",
      trend: "+12%",
    },
    {
      title: "Total Candidates",
      value: stats?.totalApplications || 0,
      icon: Users,
      description: "Applications received",
      trend: "+23%",
    },
    {
      title: "Interviews Conducted",
      value: stats?.completedInterviews || 0,
      icon: Video,
      description: "Completed interviews",
      trend: "+8%",
    },
    {
      title: "Avg. Time to Hire",
      value: "14 days",
      icon: Clock,
      description: "From posting to offer",
      trend: "-3 days",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-reports-title">
          Reports
        </h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive hiring reports and analytics
        </p>
      </div>

      <div className="space-y-6 mt-6">
          {/* Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.title} data-testid={`card-metric-${metric.title.toLowerCase().replace(/\s/g, '-')}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-sm font-medium">
                      {metric.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <p className="text-xs text-muted-foreground">
                      {metric.description}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-500">{metric.trend}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Report Type Tabs */}
          <Tabs value={activeReportTab} onValueChange={setActiveReportTab} className="w-full">
            <TabsList>
              <TabsTrigger value="summary" data-testid="tab-job-summary">
                <FileText className="h-4 w-4 mr-2" />
                Job Summary Report
              </TabsTrigger>
              <TabsTrigger value="details" data-testid="tab-job-details">
                <Eye className="h-4 w-4 mr-2" />
                Job Details Report
              </TabsTrigger>
              <TabsTrigger value="selection" data-testid="tab-selection-report">
                <Trophy className="h-4 w-4 mr-2" />
                Selection Report
              </TabsTrigger>
            </TabsList>

            {/* Job Summary Report */}
            <TabsContent value="summary" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <CardTitle>Job Summary Report</CardTitle>
                      <CardDescription>Overview of all job applications and their status</CardDescription>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        variant="outline" 
                        data-testid="button-export-csv-summary"
                        onClick={exportJobSummaryToCSV}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button 
                        variant="default" 
                        data-testid="button-email-summary"
                        onClick={() => setIsSummaryEmailDialogOpen(true)}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Email Report
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[160px]">Job ID</TableHead>
                          <TableHead className="min-w-[220px]">Job Title</TableHead>
                          <TableHead className="min-w-[120px]">Start Date</TableHead>
                          <TableHead className="min-w-[120px]">End Date</TableHead>
                          <TableHead className="min-w-[140px] text-center">Candidates Applied</TableHead>
                          <TableHead className="min-w-[160px] text-center">Candidates Interviewed</TableHead>
                          <TableHead className="min-w-[150px] text-center">Candidates Selected</TableHead>
                          <TableHead className="min-w-[200px]">Posting Platforms</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jobSummaryData.map((job) => (
                          <TableRow key={job.id} className="hover-elevate" data-testid={`row-job-summary-${job.id}`}>
                            <TableCell className="font-mono font-semibold text-primary text-sm">
                              {job.jobPostingId}
                            </TableCell>
                            <TableCell className="font-medium">{job.title}</TableCell>
                            <TableCell>{formatDate(job.startDate)}</TableCell>
                            <TableCell>{formatDate(job.endDate)}</TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {job.candidatesApplied}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                {job.candidatesInterviewed}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                {job.candidatesSelected}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {job.platforms.map((platform, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {platform}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Job Details Report */}
            <TabsContent value="details" className="space-y-4 mt-4">
              {/* Job ID Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Job Posting</CardTitle>
                  <CardDescription>Choose a job to view detailed candidate report</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 flex-col md:flex-row">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="job-posting-id-details">Job ID</Label>
                      <Select 
                        value={selectedJobPostingId} 
                        onValueChange={setSelectedJobPostingId}
                      >
                        <SelectTrigger id="job-posting-id-details" data-testid="select-job-posting-id-details">
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
                      <Label htmlFor="manual-input-details">Or Type Manually</Label>
                      <Input
                        id="manual-input-details"
                        placeholder="e.g., TESO20251114001"
                        value={selectedJobPostingId}
                        onChange={(e) => setSelectedJobPostingId(e.target.value)}
                        data-testid="input-job-posting-id-details"
                        className="font-mono"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Search - Only show when job is selected */}
              {selectedJobPostingId && selectedJobDetails.length > 0 && (
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by candidate name or email..."
                      className="pl-10"
                      data-testid="input-search-details"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Job Details Table */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <CardTitle>Candidate Details Report</CardTitle>
                      <CardDescription>
                        {selectedJobPostingId 
                          ? `Detailed candidate report for ${selectedJobPostingId}` 
                          : "Select a job posting to view candidate details"}
                      </CardDescription>
                    </div>
                    {selectedJobPostingId && selectedJobDetails.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          variant="outline" 
                          data-testid="button-export-csv-details"
                          onClick={exportJobDetailsToCSV}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export CSV
                        </Button>
                        <Button 
                          variant="default" 
                          data-testid="button-email-details"
                          onClick={() => setIsDetailsEmailDialogOpen(true)}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Email Report
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!selectedJobPostingId ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Job Selected</h3>
                      <p className="text-muted-foreground">
                        Please select a Job ID above to view detailed candidate report
                      </p>
                    </div>
                  ) : filteredJobDetails.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No candidates found</h3>
                      <p className="text-muted-foreground">
                        {searchQuery 
                          ? "No matching candidates found" 
                          : "No candidate data available for this job"}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[180px]">Candidate Name</TableHead>
                            <TableHead className="min-w-[200px]">Email</TableHead>
                            <TableHead className="min-w-[150px]">Phone Number</TableHead>
                            <TableHead className="min-w-[140px]">Interview Date</TableHead>
                            <TableHead className="min-w-[140px] text-center">Questions Asked</TableHead>
                            <TableHead className="min-w-[160px] text-center">Questions Answered</TableHead>
                            <TableHead className="min-w-[150px] text-center">Wrong Questions</TableHead>
                            <TableHead className="min-w-[120px] text-center">AI Ranking</TableHead>
                            <TableHead className="min-w-[120px] text-center">Our Ranking</TableHead>
                            <TableHead className="min-w-[120px]">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredJobDetails.map((candidate) => (
                            <TableRow key={candidate.id} className="hover-elevate" data-testid={`row-candidate-detail-${candidate.id}`}>
                              <TableCell className="font-medium">{candidate.candidateName}</TableCell>
                              <TableCell>{candidate.email}</TableCell>
                              <TableCell>{candidate.phone}</TableCell>
                              <TableCell>{candidate.interviewDate}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline">{candidate.questionsAsked}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  {candidate.questionsAnswered}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={candidate.wrongQuestions > 2 
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  : candidate.wrongQuestions > 0 
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                }>
                                  {candidate.wrongQuestions}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                  #{candidate.aiRanking}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800">
                                  #{candidate.ourRanking}
                                </Badge>
                              </TableCell>
                              <TableCell>{getStatusBadge(candidate.status)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Selection Report */}
            <TabsContent value="selection" className="space-y-4 mt-4">
              {/* Job Selection */}
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[250px]">
                  <Label htmlFor="selection-job-select">Select Job</Label>
                  <Select value={selectedSelectionJobId} onValueChange={setSelectedSelectionJobId}>
                    <SelectTrigger id="selection-job-select" data-testid="select-selection-job">
                      <SelectValue placeholder="Select a job to view shortlist" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobsData.map((job: any) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.jobPostingId} - {job.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedSelectionJobId && (
                  <div className="flex-1 min-w-[250px]">
                    <Label htmlFor="selection-search">Search Candidates</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="selection-search"
                        placeholder="Search by name or email..."
                        className="pl-10"
                        value={selectionSearchQuery}
                        onChange={(e) => setSelectionSearchQuery(e.target.value)}
                        data-testid="input-selection-search"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Selection Summary Stats */}
              {selectedSelectionJobId && selectionReportData && (
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                      <CardTitle className="text-sm font-medium">Total Shortlisted</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectionReportData.totalCandidates}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                      <CardTitle className="text-sm font-medium">Selected</CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{selectionReportData.selected}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                      <CardTitle className="text-sm font-medium">Maybe</CardTitle>
                      <HelpCircle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600">{selectionReportData.maybe}</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Selection Report Table */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <CardTitle>Selection Report</CardTitle>
                      <CardDescription>
                        {selectedSelectionJobId 
                          ? `Shortlisted candidates for ${selectionReportData?.job?.title || 'selected job'}` 
                          : "Select a job to view shortlisted candidates"}
                      </CardDescription>
                    </div>
                    {selectedSelectionJobId && selectionCandidates.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          variant="outline"
                          onClick={exportSelectionToCSV}
                          data-testid="button-export-selection-csv"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export CSV
                        </Button>
                        <Button 
                          onClick={() => setIsEmailDialogOpen(true)}
                          data-testid="button-email-selection"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Email Report
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!selectedSelectionJobId ? (
                    <div className="text-center py-12">
                      <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Job Selected</h3>
                      <p className="text-muted-foreground">
                        Please select a Job above to view shortlisted candidates
                      </p>
                    </div>
                  ) : isLoadingSelectionReport ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredSelectionCandidates.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Shortlisted Candidates</h3>
                      <p className="text-muted-foreground">
                        {selectionSearchQuery 
                          ? "No matching candidates found" 
                          : "No candidates have been shortlisted for this job yet"}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[60px] text-center">Rank</TableHead>
                            <TableHead className="min-w-[180px]">Candidate</TableHead>
                            <TableHead className="min-w-[200px]">Email</TableHead>
                            <TableHead className="min-w-[130px]">Phone</TableHead>
                            <TableHead className="min-w-[100px] text-center">Resume Score</TableHead>
                            <TableHead className="min-w-[100px] text-center">Interview Score</TableHead>
                            <TableHead className="min-w-[100px] text-center">Technical</TableHead>
                            <TableHead className="min-w-[100px] text-center">Communication</TableHead>
                            <TableHead className="min-w-[120px]">Recommendation</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSelectionCandidates.map((candidate, index) => (
                            <TableRow key={index} className="hover-elevate" data-testid={`row-selection-candidate-${index}`}>
                              <TableCell className="text-center">
                                {candidate.rank ? (
                                  <Badge className="bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800">
                                    #{candidate.rank}
                                  </Badge>
                                ) : '-'}
                              </TableCell>
                              <TableCell className="font-medium">{candidate.candidateName}</TableCell>
                              <TableCell>{candidate.candidateEmail || '-'}</TableCell>
                              <TableCell>{candidate.candidatePhone || '-'}</TableCell>
                              <TableCell className="text-center">
                                <span className={getScoreColor(candidate.resumeScreeningScore)}>
                                  {candidate.resumeScreeningScore ? `${candidate.resumeScreeningScore}%` : '-'}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={getScoreColor(candidate.interviewScore)}>
                                  {candidate.interviewScore ? `${candidate.interviewScore}%` : '-'}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={getScoreColor(candidate.technicalScore)}>
                                  {candidate.technicalScore ? `${candidate.technicalScore}%` : '-'}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={getScoreColor(candidate.communicationScore)}>
                                  {candidate.communicationScore ? `${candidate.communicationScore}%` : '-'}
                                </span>
                              </TableCell>
                              <TableCell>{getRecommendationBadge(candidate.recommendation)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Email Dialog for Selection Report */}
          <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Email Selection Report</DialogTitle>
                <DialogDescription>
                  Send the selection report to the hiring manager
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Recipient Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="hiring.manager@company.com"
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    data-testid="input-email-recipient"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => sendEmailMutation.mutate({ recipientEmail: emailRecipient, jobId: selectedSelectionJobId })}
                  disabled={!emailRecipient || sendEmailMutation.isPending}
                  data-testid="button-send-email"
                >
                  {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Email Dialog for Job Summary Report */}
          <Dialog open={isSummaryEmailDialogOpen} onOpenChange={setIsSummaryEmailDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Email Job Summary Report</DialogTitle>
                <DialogDescription>
                  Send the job summary report via email
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="summary-email">Recipient Email</Label>
                  <Input
                    id="summary-email"
                    type="email"
                    placeholder="hiring.manager@company.com"
                    value={summaryEmailRecipient}
                    onChange={(e) => setSummaryEmailRecipient(e.target.value)}
                    data-testid="input-summary-email-recipient"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSummaryEmailDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => sendSummaryEmailMutation.mutate({ recipientEmail: summaryEmailRecipient, reportType: 'job_summary' })}
                  disabled={!summaryEmailRecipient || sendSummaryEmailMutation.isPending}
                  data-testid="button-send-summary-email"
                >
                  {sendSummaryEmailMutation.isPending ? "Sending..." : "Send Email"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Email Dialog for Job Details Report */}
          <Dialog open={isDetailsEmailDialogOpen} onOpenChange={setIsDetailsEmailDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Email Job Details Report</DialogTitle>
                <DialogDescription>
                  Send the job details report for {selectedJobPostingId} via email
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="details-email">Recipient Email</Label>
                  <Input
                    id="details-email"
                    type="email"
                    placeholder="hiring.manager@company.com"
                    value={detailsEmailRecipient}
                    onChange={(e) => setDetailsEmailRecipient(e.target.value)}
                    data-testid="input-details-email-recipient"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDetailsEmailDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => sendDetailsEmailMutation.mutate({ recipientEmail: detailsEmailRecipient, reportType: 'job_details', jobPostingId: selectedJobPostingId })}
                  disabled={!detailsEmailRecipient || sendDetailsEmailMutation.isPending}
                  data-testid="button-send-details-email"
                >
                  {sendDetailsEmailMutation.isPending ? "Sending..." : "Send Email"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      </div>
    </div>
  );
}
