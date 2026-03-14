import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  FileText, 
  Download, 
  Mail, 
  Search, 
  Users, 
  CheckCircle, 
  HelpCircle,
  Building,
  MapPin,
  Briefcase,
  Phone,
  AtSign,
  Trophy,
  Star
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function SelectionReport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedJobId, setSelectedJobId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  const isRecruiter = (user as any)?.role === 'recruiter' || (user as any)?.role === 'company_admin';

  const { data: reportsData, isLoading: isLoadingReports } = useQuery<{ reports: any[]; totalJobs: number }>({
    queryKey: ['/api/selection-report'],
    enabled: isRecruiter && !!user
  });

  const { data: reportData, isLoading: isLoadingReport } = useQuery<{ 
    job: any; 
    candidates: any[]; 
    totalCandidates: number;
    selected: number;
    maybe: number;
  }>({
    queryKey: ['/api/selection-report', selectedJobId],
    enabled: isRecruiter && !!user && !!selectedJobId
  });

  const { data: jobsResponse } = useQuery<{ data: any[] }>({
    queryKey: ['/api/jobs/company'],
    enabled: isRecruiter && !!user
  });

  const jobsData = jobsResponse?.data || [];
  const reports = reportsData?.reports || [];
  const candidates = reportData?.candidates || [];

  const filteredCandidates = candidates.filter((candidate) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      candidate.candidateName.toLowerCase().includes(searchLower) ||
      candidate.candidateEmail.toLowerCase().includes(searchLower)
    );
  });

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatSalary = (amount: number | null) => {
    if (!amount) return '-';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const exportToCSV = () => {
    if (!reportData || candidates.length === 0) {
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

    const rows = candidates.map(c => [
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
      `Selection Report - ${reportData.job.title} (${reportData.job.jobPostingId})`,
      `Generated: ${new Date().toLocaleDateString('en-IN')}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `selection-report-${reportData.job.jobPostingId}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Report Downloaded",
      description: "Selection report has been exported as CSV",
    });
  };

  const sendEmailMutation = useMutation({
    mutationFn: async (data: { recipientEmail: string; jobId: string }) => {
      return await apiRequest('/api/selection-report/send-email', {
        method: 'POST',
        body: JSON.stringify(data)
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-selection-report">
            Selection Report
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and share candidate shortlist with hiring managers
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline"
            onClick={exportToCSV}
            disabled={!selectedJobId || candidates.length === 0}
            data-testid="button-export-csv"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            onClick={() => setIsEmailDialogOpen(true)}
            disabled={!selectedJobId || candidates.length === 0}
            data-testid="button-send-report"
          >
            <Mail className="h-4 w-4 mr-2" />
            Send to Hiring Manager
          </Button>
        </div>
      </div>

      {/* Job Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Job</CardTitle>
          <CardDescription>Choose a job to view the selection report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="flex-1 space-y-2">
              <Label htmlFor="job-select">Job Position</Label>
              <Select 
                value={selectedJobId} 
                onValueChange={setSelectedJobId}
              >
                <SelectTrigger id="job-select" data-testid="select-job">
                  <SelectValue placeholder="Select a job..." />
                </SelectTrigger>
                <SelectContent>
                  {jobsData.map((job: any) => (
                    <SelectItem key={job.id} value={job.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-primary">{job.jobPostingId}</span>
                        <span className="text-muted-foreground">-</span>
                        <span>{job.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Details Card */}
      {selectedJobId && reportData?.job && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Job Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-muted-foreground">Job ID</Label>
                <p className="font-mono font-semibold">{reportData.job.jobPostingId}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Title</Label>
                <p className="font-semibold">{reportData.job.title}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Department</Label>
                <p>{reportData.job.department || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Location</Label>
                <p className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {reportData.job.location || '-'}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Employment Type</Label>
                <p>{reportData.job.employmentType || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Salary Range</Label>
                <p>
                  {reportData.job.salaryMin || reportData.job.salaryMax 
                    ? `${formatSalary(reportData.job.salaryMin)} - ${formatSalary(reportData.job.salaryMax)}`
                    : '-'}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Selected Candidates</Label>
                <p className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  {reportData.selected}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Maybe Candidates</Label>
                <p className="text-yellow-600 dark:text-yellow-400 font-semibold flex items-center gap-1">
                  <HelpCircle className="h-4 w-4" />
                  {reportData.maybe}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {selectedJobId && reportData && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Shortlisted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {reportData.totalCandidates}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Selected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {reportData.selected}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Maybe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-yellow-500" />
                <span className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {reportData.maybe}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      {selectedJobId && candidates.length > 0 && (
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by candidate name or email..."
              className="pl-10"
              data-testid="input-search-candidates"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Candidates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Shortlisted Candidates
          </CardTitle>
          <CardDescription>
            {selectedJobId 
              ? `Candidates shortlisted for review` 
              : "Select a job to view shortlisted candidates"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedJobId ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Job Selected</h3>
              <p className="text-muted-foreground">
                Please select a job above to view the selection report
              </p>
            </div>
          ) : isLoadingReport ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading report...</p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Shortlisted Candidates</h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "No matching candidates found" 
                  : "No candidates have been added to the shortlist yet. Go to Candidate Ranking to add candidates."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[80px] text-center">Rank</TableHead>
                    <TableHead className="min-w-[200px]">Candidate</TableHead>
                    <TableHead className="min-w-[200px]">Contact</TableHead>
                    <TableHead className="min-w-[120px] text-center">Resume Score</TableHead>
                    <TableHead className="min-w-[120px] text-center">Interview Score</TableHead>
                    <TableHead className="min-w-[100px] text-center">Technical</TableHead>
                    <TableHead className="min-w-[120px] text-center">Communication</TableHead>
                    <TableHead className="min-w-[120px]">Recommendation</TableHead>
                    <TableHead className="min-w-[200px]">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map((candidate, index) => (
                    <TableRow key={candidate.applicationId || index} data-testid={`row-candidate-${candidate.applicationId}`}>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          {candidate.rank === 1 && <Trophy className="h-5 w-5 text-yellow-500" />}
                          <span className="text-xl font-bold text-muted-foreground">
                            #{candidate.rank || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{candidate.candidateName}</div>
                        <div className="text-sm text-muted-foreground">{candidate.jobTitle}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {candidate.candidateEmail && (
                            <div className="flex items-center gap-1 text-sm">
                              <AtSign className="h-3 w-3" />
                              {candidate.candidateEmail}
                            </div>
                          )}
                          {candidate.candidatePhone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {candidate.candidatePhone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`text-xl font-bold ${getScoreColor(candidate.resumeScreeningScore)}`}>
                          {candidate.resumeScreeningScore ? Math.round(candidate.resumeScreeningScore) : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-xl font-bold ${getScoreColor(candidate.interviewScore)}`}>
                            {candidate.interviewScore ? Math.round(candidate.interviewScore) : '-'}
                          </span>
                          {candidate.interviewScore && (
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < Math.floor(candidate.interviewScore / 20) 
                                      ? 'fill-amber-400 text-amber-400' 
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-semibold ${getScoreColor(candidate.technicalScore)}`}>
                          {candidate.technicalScore ? Math.round(candidate.technicalScore) : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-semibold ${getScoreColor(candidate.communicationScore)}`}>
                          {candidate.communicationScore ? Math.round(candidate.communicationScore) : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getRecommendationBadge(candidate.recommendation)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {candidate.notes || '-'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reports Overview (when no job selected) */}
      {!selectedJobId && reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Selection Reports</CardTitle>
            <CardDescription>Quick overview of jobs with shortlisted candidates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reports.map((report) => (
                <div 
                  key={report.jobId}
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate cursor-pointer"
                  onClick={() => setSelectedJobId(report.jobId)}
                  data-testid={`card-report-${report.jobId}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{report.jobTitle}</div>
                      <div className="text-sm text-muted-foreground font-mono">{report.jobPostingId}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{report.selected}</div>
                      <div className="text-xs text-muted-foreground">Selected</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{report.waitlisted}</div>
                      <div className="text-xs text-muted-foreground">Maybe</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{report.totalShortlisted}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Selection Report</DialogTitle>
            <DialogDescription>
              Send the selection report to the hiring manager for review
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Hiring Manager Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="manager@company.com"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                data-testid="input-email-recipient"
              />
            </div>
            
            {reportData && (
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <span className="font-semibold">Report Summary:</span>
                </p>
                <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1">
                  <li>Job: {reportData.job.title} ({reportData.job.jobPostingId})</li>
                  <li>Total Candidates: {reportData.totalCandidates}</li>
                  <li>Selected: {reportData.selected}</li>
                  <li>Maybe: {reportData.maybe}</li>
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEmailDialogOpen(false)} 
              data-testid="button-cancel-email"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!emailRecipient) {
                  toast({
                    title: "Validation Error",
                    description: "Please enter an email address",
                    variant: "destructive",
                  });
                  return;
                }
                sendEmailMutation.mutate({
                  recipientEmail: emailRecipient,
                  jobId: selectedJobId
                });
              }}
              disabled={sendEmailMutation.isPending}
              data-testid="button-confirm-email"
            >
              {sendEmailMutation.isPending ? "Sending..." : "Send Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
