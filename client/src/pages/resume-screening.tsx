import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Search, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Award,
  User,
  FileText,
  Filter,
  Briefcase,
  BookOpen,
  Users,
  MessageSquare,
  Eye,
  Sparkles,
  Target,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Star,
  Upload,
  Loader2,
  Trash2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function ResumeScreening() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedJobPostingId, setSelectedJobPostingId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedCandidateDetails, setSelectedCandidateDetails] = useState<any>(null);
  const [isRecruiterScoreDialogOpen, setIsRecruiterScoreDialogOpen] = useState(false);
  const [isSelectInterviewDialogOpen, setIsSelectInterviewDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [recruiterScore, setRecruiterScore] = useState("");
  const [recruiterComments, setRecruiterComments] = useState("");
  const [internalRating, setInternalRating] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const isRecruiter = (user as any)?.role === 'recruiter' || (user as any)?.role === 'company_admin';

  // Fetch applications and jobs
  const { data: applicationsResponse } = useQuery<{ data: any[] }>({
    queryKey: ['/api/applications'],
    enabled: isRecruiter && !!user
  });

  const { data: jobsResponse } = useQuery<{ data: any[] }>({
    queryKey: ['/api/jobs/company'],
    enabled: isRecruiter && !!user
  });

  const applicationsData = applicationsResponse?.data || [];
  const jobsData = jobsResponse?.data || [];
  
  // Create map of jobs by ID for quick lookup
  const jobMap = new Map(jobsData.map((j: any) => [j.id, j]));

  // Score/Re-score candidate mutation
  const scoreMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      return await apiRequest(`/api/applications/${applicationId}/score`, {
        method: 'POST'
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Candidate Scored",
        description: `AI screening completed with ${data.score}% match`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to score candidate. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Recruiter score mutation
  const recruiterScoreMutation = useMutation({
    mutationFn: async ({ applicationId, data }: { applicationId: string; data: any }) => {
      return await apiRequest(`/api/applications/${applicationId}/recruiter-score`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({
        title: "Score Saved",
        description: "Your score and comments have been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      setIsRecruiterScoreDialogOpen(false);
      setRecruiterScore("");
      setRecruiterComments("");
      setInternalRating("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save score",
        variant: "destructive",
      });
    }
  });

  // Create interview session mutation (standalone, parallel-capable)
  const selectInterviewMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const response = await apiRequest(`/api/applications/${applicationId}/create-interview`, {
        method: 'POST'
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Interview Session Created",
        description: "Redirecting to interview...",
      });
      // Navigate to public interview page with token (not scheduling page)
      setTimeout(() => {
        navigate(`/public/interview/${data.interviewToken}`);
      }, 300);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create interview",
        variant: "destructive",
      });
    }
  });

  // Reject candidate mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ applicationId, reason }: { applicationId: string; reason: string }) => {
      return await apiRequest(`/api/applications/${applicationId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejectionReason: reason }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({
        title: "Candidate Rejected",
        description: "Application has been marked as rejected",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      setIsRejectDialogOpen(false);
      setRejectionReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject candidate",
        variant: "destructive",
      });
    }
  });

  // Delete candidate mutation
  const deleteMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      return await apiRequest(`/api/applications/${applicationId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Candidate Deleted",
        description: "Application has been permanently deleted",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete candidate",
        variant: "destructive",
      });
    }
  });

  // Bulk upload resumes mutation
  const uploadResumesMutation = useMutation({
    mutationFn: async () => {
      if (!selectedJobPostingId) {
        throw new Error("Please select a job posting first");
      }
      if (uploadedFiles.length === 0) {
        throw new Error("Please select resume files to upload");
      }

      const formData = new FormData();
      formData.append('jobPostingId', selectedJobPostingId);
      uploadedFiles.forEach((file) => {
        formData.append('resumes', file);
      });

      const response = await fetch('/api/resumes/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload resumes");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Resumes Uploaded Successfully",
        description: `${data.successful} candidates added, ${data.failed} failed`,
      });
      setUploadedFiles([]);
      setIsUploadDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload and process resumes",
        variant: "destructive",
      });
    }
  });

  const handleViewDetails = (candidate: any) => {
    setSelectedCandidateDetails(candidate);
    setIsDetailsDialogOpen(true);
  };

  const handleScore = (applicationId: string) => {
    scoreMutation.mutate(applicationId);
  };

  const handleOpenRecruiterScore = (applicationId: string) => {
    setSelectedCandidateId(applicationId);
    setIsRecruiterScoreDialogOpen(true);
  };

  const handleSaveRecruiterScore = () => {
    if (!selectedCandidateId) return;
    
    recruiterScoreMutation.mutate({
      applicationId: selectedCandidateId,
      data: {
        recruiterMatchScore: recruiterScore ? parseFloat(recruiterScore) : undefined,
        recruiterNotes: recruiterComments || undefined,
        internalRating: internalRating ? parseInt(internalRating) : undefined,
      }
    });
  };

  const handleOpenSelectInterview = (applicationId: string, candidate: any) => {
    // Immediately create interview session and navigate (standalone module)
    selectInterviewMutation.mutate(applicationId);
  };

  const handleConfirmSelectInterview = () => {
    if (!selectedCandidateId) return;
    selectInterviewMutation.mutate(selectedCandidateId);
  };

  const handleOpenReject = (applicationId: string) => {
    setSelectedCandidateId(applicationId);
    setIsRejectDialogOpen(true);
  };

  const handleConfirmReject = () => {
    if (!selectedCandidateId) return;
    rejectMutation.mutate({
      applicationId: selectedCandidateId,
      reason: rejectionReason
    });
  };

  const handleOpenDelete = (applicationId: string) => {
    setSelectedCandidateId(applicationId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedCandidateId) return;
    deleteMutation.mutate(selectedCandidateId);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const resumeFiles = files.filter(f => 
      f.type === 'application/pdf' || 
      f.name.endsWith('.pdf') ||
      f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      f.name.endsWith('.docx')
    );
    setUploadedFiles(prev => [...prev, ...resumeFiles]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...files]);
    }
  };
  
  // Build job posting IDs from actual jobs - EXACTLY LIKE Interview Evaluations
  const jobPostingIds = jobsData.map((job) => ({
    id: job.jobPostingId,
    title: job.title,
    jobId: job.id
  }));

  // Group applications by job posting ID (with duplicate prevention)
  const screeningByJobPosting: Record<string, any[]> = {};
  const seenAppIds = new Set<string>();
  
  applicationsData.forEach((app: any) => {
    // Skip if we've already processed this application ID
    if (seenAppIds.has(app.id)) return;
    seenAppIds.add(app.id);
    
    const jobPostingId = app.jobPostingId || jobMap.get(app.jobId)?.jobPostingId;
    if (jobPostingId) {
      if (!screeningByJobPosting[jobPostingId]) {
        screeningByJobPosting[jobPostingId] = [];
      }
      screeningByJobPosting[jobPostingId].push({
        id: app.id,
        jobId: app.jobId,
        jobPostingId: jobPostingId,
        candidateName: app.candidateName || 'Unknown Candidate',
        email: app.candidateEmail || '',
        phone: app.candidatePhone || '',
        location: app.candidateLocation || '',
        screeningScore: app.screeningScore || app.aiScore || 0,
        recruiterScore: app.recruiterMatchScore || 0,
        status: app.screeningStatus || 'pending',
        createdAt: app.createdAt || new Date().toISOString(),
        screeningData: app.screeningData || {}
      });
    }
  });

  const selectedCandidates = selectedJobPostingId ? (screeningByJobPosting[selectedJobPostingId as keyof typeof screeningByJobPosting] || []) : [];

  const filteredCandidates = selectedCandidates.filter((candidate) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      candidate.candidateName.toLowerCase().includes(searchLower) ||
      candidate.email.toLowerCase().includes(searchLower) ||
      candidate.location.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
      case 'shortlisted':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Shortlisted
          </Badge>
        );
      case 'failed':
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline">
            <Filter className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return (
        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-sm font-semibold">
          {score}%
        </Badge>
      );
    } else if (score >= 60) {
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

  // Calculate summary stats for selected job
  const totalCandidates = selectedCandidates.length;
  const shortlistedCount = selectedCandidates.filter(c => c.status === 'passed' || c.status === 'shortlisted').length;
  const avgScore = selectedCandidates.length > 0 
    ? Math.round(selectedCandidates.reduce((sum, c) => sum + c.screeningScore, 0) / selectedCandidates.length)
    : 0;
  const topScores = selectedCandidates.filter(c => c.screeningScore >= 80).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-resume-screening">
            Resume Screening
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and score candidate resumes
          </p>
        </div>
      </div>

      {/* Job Posting ID Selection */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Select Job Posting</CardTitle>
            <CardDescription>Choose a job posting to view candidate resumes</CardDescription>
          </div>
          {selectedJobPostingId && (
            <Button
              onClick={() => setIsUploadDialogOpen(true)}
              variant="default"
              className="gap-2"
              data-testid="button-upload-resumes"
            >
              <Upload className="h-4 w-4" />
              Upload Resumes
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="flex-1 space-y-2">
              <Label htmlFor="job-posting-id">Job ID</Label>
              <Select 
                value={selectedJobPostingId} 
                onValueChange={setSelectedJobPostingId}
              >
                <SelectTrigger id="job-posting-id" data-testid="select-job-posting-id">
                  <SelectValue placeholder="Select or type Job ID..." />
                </SelectTrigger>
                <SelectContent>
                  {jobPostingIds.map((job: any) => (
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
                placeholder="e.g., TESO20251121071"
                value={selectedJobPostingId}
                onChange={(e) => setSelectedJobPostingId(e.target.value)}
                data-testid="input-job-posting-id"
                className="font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats - Only show when job is selected */}
      {selectedJobPostingId && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Candidates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {totalCandidates}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Applied for position</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Shortlisted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {shortlistedCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Passed screening</p>
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
              <p className="text-xs text-muted-foreground mt-1">Score ≥ 80%</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {avgScore}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Overall quality</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search - Only show when job is selected */}
      {selectedJobPostingId && selectedCandidates.length > 0 && (
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by candidate name, email, or location..."
              className="pl-10"
              data-testid="input-search-candidates"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Resume Screening Table */}
      <Card>
        <CardHeader>
          <CardTitle>Candidate Resumes</CardTitle>
          <CardDescription>
            {selectedJobPostingId 
              ? `Resume screening results - ${selectedJobPostingId}` 
              : "Select a job posting to view candidate resumes"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedJobPostingId ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Job Selected</h3>
              <p className="text-muted-foreground">
                Please select a Job ID above to view candidate resumes
              </p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No candidates found</h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "No matching candidates found" 
                  : "No candidates have applied for this job yet"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[130px]">Candidate</TableHead>
                  <TableHead className="w-[150px]">Contact</TableHead>
                  <TableHead className="w-[60px] text-center">AI</TableHead>
                  <TableHead className="w-[60px] text-center">You</TableHead>
                  <TableHead className="w-[80px]">Status</TableHead>
                  <TableHead className="w-[70px]">Applied</TableHead>
                  <TableHead className="text-center w-[280px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((candidate) => (
                  <TableRow key={candidate.id} className="hover-elevate" data-testid={`row-candidate-${candidate.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium text-sm truncate max-w-[120px]" title={candidate.candidateName}>
                          {candidate.candidateName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <div className="truncate max-w-[150px]" title={candidate.email}>{candidate.email}</div>
                        <div className="text-muted-foreground">{candidate.phone || '-'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {getScoreBadge(candidate.screeningScore)}
                    </TableCell>
                    <TableCell className="text-center">
                      {candidate.recruiterScore > 0 ? (
                        <Badge className="bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800 text-xs font-semibold">
                          {candidate.recruiterScore}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(candidate.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(candidate.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5 justify-center flex-wrap">
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`button-details-${candidate.id}`}
                          onClick={() => handleViewDetails(candidate)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Details
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          data-testid={`button-interview-${candidate.id}`}
                          onClick={() => handleOpenSelectInterview(candidate.id, candidate)}
                        >
                          <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                          Interview
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          data-testid={`button-reject-${candidate.id}`}
                          onClick={() => handleOpenReject(candidate.id)}
                        >
                          <ThumbsDown className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                          data-testid={`button-delete-${candidate.id}`}
                          onClick={() => handleOpenDelete(candidate.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
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

      {/* Candidate Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidate Screening Details</DialogTitle>
            <DialogDescription>
              Detailed AI screening results and analysis
            </DialogDescription>
          </DialogHeader>
          {selectedCandidateDetails && (
            <div className="grid gap-6 py-4">
              {/* Candidate Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Candidate Name</label>
                  <p className="text-base font-semibold mt-1">{selectedCandidateDetails.candidateName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-base mt-1">{selectedCandidateDetails.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-base mt-1">{selectedCandidateDetails.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <p className="text-base mt-1">{selectedCandidateDetails.location || 'N/A'}</p>
                </div>
              </div>

              {/* Overall Scores */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">AI Score</p>
                      <div className="text-3xl font-bold text-primary">
                        {selectedCandidateDetails.screeningScore}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Recruiter Score</p>
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedCandidateDetails.recruiterScore || 0}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Status</p>
                      <div className="mt-2">
                        {getStatusBadge(selectedCandidateDetails.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Scoring Breakdown by Category */}
              {selectedCandidateDetails.screeningData && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Scoring Breakdown</CardTitle>
                    <CardDescription>Detailed evaluation across different parameters</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Skills Match */}
                      {selectedCandidateDetails.screeningData.skillsScore !== undefined && (
                        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Skills Match</span>
                          </div>
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-sm">
                            {selectedCandidateDetails.screeningData.skillsScore}%
                          </Badge>
                        </div>
                      )}

                      {/* Experience Match */}
                      {selectedCandidateDetails.screeningData.experienceScore !== undefined && (
                        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-purple-600" />
                            <span className="font-medium">Experience Match</span>
                          </div>
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-sm">
                            {selectedCandidateDetails.screeningData.experienceScore}%
                          </Badge>
                        </div>
                      )}

                      {/* Education Match */}
                      {selectedCandidateDetails.screeningData.educationScore !== undefined && (
                        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-green-600" />
                            <span className="font-medium">Education Match</span>
                          </div>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-sm">
                            {selectedCandidateDetails.screeningData.educationScore}%
                          </Badge>
                        </div>
                      )}

                      {/* Work History Relevance */}
                      {selectedCandidateDetails.screeningData.workHistoryScore !== undefined && (
                        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-orange-600" />
                            <span className="font-medium">Work History Relevance</span>
                          </div>
                          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-sm">
                            {selectedCandidateDetails.screeningData.workHistoryScore}%
                          </Badge>
                        </div>
                      )}

                      {/* Keywords */}
                      {selectedCandidateDetails.screeningData.keywordsScore !== undefined && (
                        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                          <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-indigo-600" />
                            <span className="font-medium">Keywords Match</span>
                          </div>
                          <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 text-sm">
                            {selectedCandidateDetails.screeningData.keywordsScore}%
                          </Badge>
                        </div>
                      )}

                      {/* Cultural Fit */}
                      {selectedCandidateDetails.screeningData.culturalFitScore !== undefined && (
                        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-pink-600" />
                            <span className="font-medium">Cultural Fit</span>
                          </div>
                          <Badge className="bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200 text-sm">
                            {selectedCandidateDetails.screeningData.culturalFitScore}%
                          </Badge>
                        </div>
                      )}

                      {/* If no detailed scores available, show summary */}
                      {!selectedCandidateDetails.screeningData.skillsScore && 
                       !selectedCandidateDetails.screeningData.experienceScore && 
                       !selectedCandidateDetails.screeningData.educationScore && 
                       !selectedCandidateDetails.screeningData.workHistoryScore && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Detailed scoring breakdown will appear after AI screening
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Screening Analysis */}
              {selectedCandidateDetails.screeningData && Object.keys(selectedCandidateDetails.screeningData).length > 0 && (
                <div className="space-y-4">
                  {/* Matched Skills */}
                  {selectedCandidateDetails.screeningData.matchedSkills && selectedCandidateDetails.screeningData.matchedSkills.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold text-green-600 dark:text-green-400">Matched Skills</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidateDetails.screeningData.matchedSkills.map((skill: string, idx: number) => (
                          <Badge key={idx} className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Skills */}
                  {selectedCandidateDetails.screeningData.missingSkills && selectedCandidateDetails.screeningData.missingSkills.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        <h4 className="font-semibold text-orange-600 dark:text-orange-400">Missing Skills</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidateDetails.screeningData.missingSkills.map((skill: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-orange-600 border-orange-600">
                            <XCircle className="h-3 w-3 mr-1" />
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths */}
                  {selectedCandidateDetails.screeningData.strengths && selectedCandidateDetails.screeningData.strengths.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Award className="h-5 w-5 text-purple-600" />
                        <h4 className="font-semibold text-purple-600 dark:text-purple-400">Key Strengths</h4>
                      </div>
                      <ul className="space-y-2">
                        {selectedCandidateDetails.screeningData.strengths.map((strength: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Concerns */}
                  {selectedCandidateDetails.screeningData.concerns && selectedCandidateDetails.screeningData.concerns.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <h4 className="font-semibold text-red-600 dark:text-red-400">Concerns</h4>
                      </div>
                      <ul className="space-y-2">
                        {selectedCandidateDetails.screeningData.concerns.map((concern: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{concern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Reasoning */}
                  {selectedCandidateDetails.screeningData.reasoning && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-600 dark:text-blue-400">AI Assessment</h4>
                      </div>
                      <p className="text-sm bg-muted p-4 rounded-md">
                        {selectedCandidateDetails.screeningData.reasoning}
                      </p>
                    </div>
                  )}

                  {/* Experience Match */}
                  {selectedCandidateDetails.screeningData.experienceMatch !== undefined && (
                    <div className="bg-muted p-4 rounded-md">
                      <div className="flex items-center gap-2">
                        {selectedCandidateDetails.screeningData.experienceMatch ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-green-600 dark:text-green-400">
                              Meets experience requirements
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5 text-orange-600" />
                            <span className="font-medium text-orange-600 dark:text-orange-400">
                              Does not meet experience requirements
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* No screening data available */}
              {(!selectedCandidateDetails.screeningData || Object.keys(selectedCandidateDetails.screeningData).length === 0) && (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    No detailed screening data available.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t mt-4">
                <Button 
                  variant="default" 
                  size="sm" 
                  data-testid={`button-details-score-${selectedCandidateDetails?.id}`}
                  onClick={() => handleScore(selectedCandidateDetails?.id)}
                  disabled={scoreMutation.isPending}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  {scoreMutation.isPending ? 'Scoring...' : 'Score'}
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  data-testid={`button-details-your-score-${selectedCandidateDetails?.id}`}
                  onClick={() => {
                    setSelectedCandidateId(selectedCandidateDetails?.id);
                    setIsRecruiterScoreDialogOpen(true);
                  }}
                >
                  <Star className="h-4 w-4 mr-1" />
                  Your Score
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Recruiter Score Dialog */}
      <Dialog open={isRecruiterScoreDialogOpen} onOpenChange={setIsRecruiterScoreDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Your Score & Comments</DialogTitle>
            <DialogDescription>
              Provide your manual assessment and notes for this candidate
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="recruiter-score">Your Match Score (0-100%)</Label>
              <Input
                id="recruiter-score"
                type="number"
                min="0"
                max="100"
                placeholder="Enter score (0-100)"
                value={recruiterScore}
                onChange={(e) => setRecruiterScore(e.target.value)}
                data-testid="input-recruiter-score"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="internal-rating">Internal Rating (1-5 stars)</Label>
              <Select value={internalRating} onValueChange={setInternalRating}>
                <SelectTrigger data-testid="select-rating">
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">⭐ 1 Star</SelectItem>
                  <SelectItem value="2">⭐⭐ 2 Stars</SelectItem>
                  <SelectItem value="3">⭐⭐⭐ 3 Stars</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐ 4 Stars</SelectItem>
                  <SelectItem value="5">⭐⭐⭐⭐⭐ 5 Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="recruiter-comments">Your Comments / Notes</Label>
              <Textarea
                id="recruiter-comments"
                placeholder="Add your assessment, feedback, or notes about this candidate..."
                value={recruiterComments}
                onChange={(e) => setRecruiterComments(e.target.value)}
                rows={4}
                data-testid="textarea-recruiter-comments"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRecruiterScoreDialogOpen(false)} data-testid="button-cancel-score">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveRecruiterScore} 
              disabled={recruiterScoreMutation.isPending}
              data-testid="button-save-score"
            >
              {recruiterScoreMutation.isPending ? 'Saving...' : 'Save Score'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Select for Interview Dialog */}
      <AlertDialog open={isSelectInterviewDialogOpen} onOpenChange={setIsSelectInterviewDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Schedule Interview</AlertDialogTitle>
            <AlertDialogDescription>
              This will send an email to the candidate with a link to schedule their interview date and time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-interview">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmSelectInterview}
              disabled={selectInterviewMutation.isPending}
              data-testid="button-confirm-interview"
              className="bg-green-600 hover:bg-green-700"
            >
              {selectInterviewMutation.isPending ? 'Processing...' : 'Send Scheduling Email'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Candidate Dialog */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Candidate</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the application as rejected. You can optionally provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="rejection-reason">Rejection Reason (Optional)</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Provide feedback or reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              data-testid="textarea-rejection-reason"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-reject">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmReject}
              disabled={rejectMutation.isPending}
              data-testid="button-confirm-reject"
              className="bg-red-600 hover:bg-red-700"
            >
              {rejectMutation.isPending ? 'Processing...' : 'Confirm Rejection'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Candidate Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Candidate</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The candidate application will be permanently deleted from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Upload Resumes Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Resumes for {selectedJobPostingId}
            </DialogTitle>
            <DialogDescription>
              Drag and drop PDF or Word resumes or click to browse. AI will automatically parse and score each candidate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragActive 
                  ? 'border-primary bg-primary/10' 
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              data-testid="drop-zone-resumes"
            >
              <input
                type="file"
                id="file-input"
                multiple
                accept=".pdf,.docx"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
              <label htmlFor="file-input" className="cursor-pointer block">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="font-semibold mb-1">Drag resumes here or click to browse</p>
                <p className="text-sm text-muted-foreground">Supported formats: PDF, Word (.docx)</p>
              </label>
            </div>

            {/* File List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files ({uploadedFiles.length})</Label>
                <div className="bg-muted p-4 rounded-lg space-y-2 max-h-48 overflow-y-auto">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-background p-2 rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                        data-testid={`button-remove-file-${idx}`}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsUploadDialogOpen(false);
                  setUploadedFiles([]);
                }}
                data-testid="button-cancel-upload"
              >
                Cancel
              </Button>
              <Button
                onClick={() => uploadResumesMutation.mutate()}
                disabled={uploadedFiles.length === 0 || uploadResumesMutation.isPending}
                data-testid="button-submit-upload"
              >
                {uploadResumesMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload & Process ({uploadedFiles.length})
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
