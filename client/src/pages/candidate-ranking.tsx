import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Award, 
  TrendingUp, 
  Star, 
  Trophy,
  Search,
  Eye,
  Medal,
  Crown,
  CheckCircle,
  Circle,
  UserPlus,
  AlertCircle,
  FileText
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, CheckCircle2, XCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function CandidateRanking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedJobPostingId, setSelectedJobPostingId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isShortlistDialogOpen, setIsShortlistDialogOpen] = useState(false);
  const [isBulkShortlistDialogOpen, setIsBulkShortlistDialogOpen] = useState(false);
  const [isInterviewDetailsDialogOpen, setIsInterviewDetailsDialogOpen] = useState(false);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [selectedCandidateDetails, setSelectedCandidateDetails] = useState<any>(null);
  const [shortlistData, setShortlistData] = useState({
    recommendation: "selected" as "selected" | "maybe",
    notes: ""
  });
  const isRecruiter = (user as any)?.role === 'recruiter' || (user as any)?.role === 'company_admin';

  const handleViewDetails = (candidate: any) => {
    setSelectedCandidateDetails(candidate);
    setIsDetailsDialogOpen(true);
  };

  const handleAddToShortlist = (candidate: any) => {
    setSelectedCandidateDetails(candidate);
    setShortlistData({
      recommendation: "selected",
      notes: ""
    });
    setIsShortlistDialogOpen(true);
  };

  // Add to shortlist mutation (single candidate)
  const addToShortlistMutation = useMutation({
    mutationFn: async (data: { applicationId: string; recommendation: string; notes: string }) => {
      return await apiRequest('/api/shortlist/add', {
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to Shortlist",
        description: `${selectedCandidateDetails.name} has been added to the shortlist`,
      });
      setIsShortlistDialogOpen(false);
      setShortlistData({ recommendation: "selected", notes: "" });
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/selection-report'] });
      queryClient.invalidateQueries({ queryKey: ['/api/selection-decisions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add to shortlist",
        variant: "destructive",
      });
    }
  });

  // Bulk add to shortlist mutation
  const bulkAddToShortlistMutation = useMutation({
    mutationFn: async (data: { recommendation: string; notes: string }) => {
      const applicationIds = selectedCandidates.map(id => {
        const candidate = rankedCandidates.find((c: any) => c.id === id);
        return candidate?.applicationId || candidate?.id;
      });

      return await apiRequest('/api/shortlist/bulk-add', {
        method: 'POST',
        body: {
          applicationIds,
          recommendation: data.recommendation,
          notes: data.notes
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to Shortlist",
        description: `${selectedCandidates.length} candidates added to shortlist`,
      });
      setIsBulkShortlistDialogOpen(false);
      setShortlistData({ recommendation: "selected", notes: "" });
      setSelectedCandidates([]);
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/selection-report'] });
      queryClient.invalidateQueries({ queryKey: ['/api/selection-decisions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add to shortlist",
        variant: "destructive",
      });
    }
  });

  // Fetch applications and jobs
  const { data: applicationsResponse } = useQuery<{ data: any[]; total: number; limit: number; offset: number }>({
    queryKey: ['/api/applications'],
    enabled: isRecruiter && !!user
  });

  const { data: jobsResponse } = useQuery<{ data: any[]; total: number; limit: number; offset: number }>({
    queryKey: ['/api/jobs/company'],
    enabled: isRecruiter && !!user
  });

  // Fetch selection decisions to know which candidates are already selected
  const { data: selectionDecisionsResponse } = useQuery<any[]>({
    queryKey: ['/api/selection-decisions'],
    enabled: isRecruiter && !!user
  });

  const applicationsData = applicationsResponse?.data || [];
  const jobsData = jobsResponse?.data || [];
  const selectionDecisionsData = selectionDecisionsResponse || [];
  
  // Create a Set of application IDs that are already in selection decisions
  const alreadySelectedAppIds = new Set(
    selectionDecisionsData
      .filter((d: any) => d.decision === 'selected' || d.decision === 'shortlisted')
      .map((d: any) => d.applicationId)
  );
  
  // Function to check if a candidate is already selected in DB
  const isCandidateAlreadySelected = (applicationId: string) => {
    return alreadySelectedAppIds.has(applicationId);
  };
  
  // Create map of jobs by ID for quick lookup
  const jobMap = new Map(jobsData.map((j: any) => [j.id, j]));
  
  // Build job posting IDs from actual jobs
  const jobPostingIds = jobsData.map((job: any) => ({
    id: job.jobPostingId,
    title: job.title,
    jobId: job.id
  }));

  // Group applications by job posting ID and rank by overallScore
  const rankedCandidatesByJob: Record<string, any[]> = {};
  applicationsData.forEach((app: any, index: number) => {
    const jobPostingId = app.jobPostingId || jobMap.get(app.jobId)?.jobPostingId;
    // Only rank candidates who have completed interviews with evaluations
    if (jobPostingId && app.evaluation) {
      if (!rankedCandidatesByJob[jobPostingId]) {
        rankedCandidatesByJob[jobPostingId] = [];
      }
      rankedCandidatesByJob[jobPostingId].push({
        id: app.id,
        rank: 0, // Will be set after sorting
        name: app.candidateName || 'Unknown Candidate',
        jobTitle: jobMap.get(app.jobId)?.title || '',
        overallScore: app.evaluation?.overallScore || 0,
        technicalScore: app.evaluation?.technicalScore || 0,
        communicationScore: app.evaluation?.communicationScore || 0,
        culturalFitScore: app.evaluation?.culturalFitScore || 0,
        recommendation: app.evaluation?.recommendation || 'maybe',
        strengths: app.evaluation?.strengths || [],
        weaknesses: app.evaluation?.weaknesses || [],
        keyInsights: app.evaluation?.keyInsights || '',
        status: app.status === 'offer_extended' ? 'selected' : (app.status === 'interview_complete' ? 'interviewed' : 'screening'),
        interviewDate: app.interviewScheduledAt ? new Date(app.interviewScheduledAt).toISOString().split('T')[0] : '',
        applicationId: app.id,
        evaluation: app.evaluation
      });
    }
  });

  // Sort candidates by overall score and assign ranks
  Object.keys(rankedCandidatesByJob).forEach(jobId => {
    rankedCandidatesByJob[jobId].sort((a, b) => b.overallScore - a.overallScore);
    rankedCandidatesByJob[jobId].forEach((candidate, index) => {
      candidate.rank = index + 1;
    });
  });

  const rankedCandidates = selectedJobPostingId ? (rankedCandidatesByJob[selectedJobPostingId] || []) : [];

  const filteredCandidates = rankedCandidates.filter((candidate) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      candidate.name.toLowerCase().includes(searchLower) ||
      candidate.jobTitle.toLowerCase().includes(searchLower)
    );
  });

  const toggleCandidateSelection = (candidateId: number) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId) 
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const isCandidateSelected = (candidateId: number) => {
    return selectedCandidates.includes(candidateId);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return null;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 80) return "text-blue-600 dark:text-blue-400";
    if (score >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      interviewed: { 
        label: "Interviewed", 
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" 
      },
      selected: { 
        label: "Selected", 
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
      },
      screening: { 
        label: "Screening", 
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" 
      },
    };
    const config = statusMap[status] || { label: status, className: "" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Calculate summary stats for selected job
  const totalRanked = rankedCandidates.length;
  const avgOverallScore = rankedCandidates.length > 0 
    ? Math.round(rankedCandidates.reduce((sum, c) => sum + c.overallScore, 0) / rankedCandidates.length)
    : 0;
  const topCandidate = rankedCandidates.length > 0 ? rankedCandidates[0] : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-candidate-ranking">
            Candidate Ranking
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered candidate rankings based on multiple criteria
          </p>
        </div>
        <Button 
          data-testid="button-add-to-shortlist"
          onClick={() => setIsBulkShortlistDialogOpen(true)}
          disabled={selectedCandidates.length === 0}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add to Shortlist ({selectedCandidates.length})
        </Button>
      </div>

      {/* Job ID Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Job Posting</CardTitle>
          <CardDescription>Choose a job posting to view candidate rankings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="flex-1 space-y-2">
              <Label htmlFor="job-posting-id">Job ID</Label>
              <Select 
                value={selectedJobPostingId} 
                onValueChange={(value) => {
                  setSelectedJobPostingId(value);
                  setSelectedCandidates([]);
                }}
              >
                <SelectTrigger id="job-posting-id" data-testid="select-job-posting-id">
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
                value={selectedJobPostingId}
                onChange={(e) => {
                  setSelectedJobPostingId(e.target.value);
                  setSelectedCandidates([]);
                }}
                data-testid="input-job-posting-id"
                className="font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats - Only show when job is selected */}
      {selectedJobPostingId && rankedCandidates.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top Candidate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                    {topCandidate?.name}
                  </div>
                  <p className="text-xs text-muted-foreground">Score: {topCandidate?.overallScore}/100</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {avgOverallScore}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Across all candidates</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Ranked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {totalRanked}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Candidates evaluated</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {rankedCandidates.filter(c => c.overallScore >= 90).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Score ≥ 90</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search - Only show when job is selected */}
      {selectedJobPostingId && rankedCandidates.length > 0 && (
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by candidate name or job title..."
              className="pl-10"
              data-testid="input-search-ranking"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Ranked Candidates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ranked Candidates</CardTitle>
          <CardDescription>
            {selectedJobPostingId 
              ? `Candidates ranked for ${selectedJobPostingId}` 
              : "Select a job posting to view candidate rankings"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedJobPostingId ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Job Selected</h3>
              <p className="text-muted-foreground">
                Please select a Job ID above to view candidate rankings
              </p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No ranked candidates</h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "No matching candidates found" 
                  : "No candidates have been ranked for this job yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[80px] text-center">Rank</TableHead>
                    <TableHead className="min-w-[220px]">Candidate</TableHead>
                    <TableHead className="min-w-[200px]">Job Title</TableHead>
                    <TableHead className="min-w-[120px] text-center">Overall Score</TableHead>
                    <TableHead className="min-w-[100px] text-center">Technical</TableHead>
                    <TableHead className="min-w-[140px] text-center">Communication</TableHead>
                    <TableHead className="min-w-[120px] text-center">Cultural Fit</TableHead>
                    <TableHead className="min-w-[120px]">Status</TableHead>
                    <TableHead className="min-w-[140px]">Interview Date</TableHead>
                    <TableHead className="text-center min-w-[300px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map((candidate) => (
                    <TableRow key={candidate.id} className="hover-elevate" data-testid={`row-candidate-rank-${candidate.id}`}>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          {getRankIcon(candidate.rank)}
                          <span className="text-xl font-bold text-muted-foreground">
                            #{candidate.rank}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {getInitials(candidate.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{candidate.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{candidate.jobTitle}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-2xl font-bold ${getScoreColor(candidate.overallScore)}`}>
                            {candidate.overallScore}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i}
                                className={`w-3 h-3 ${
                                  i < Math.floor(candidate.overallScore / 20) 
                                    ? 'fill-amber-400 text-amber-400' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-semibold ${getScoreColor(candidate.technicalScore)}`}>
                          {candidate.technicalScore}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-semibold ${getScoreColor(candidate.communicationScore)}`}>
                          {candidate.communicationScore}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-semibold ${getScoreColor(candidate.culturalFitScore)}`}>
                          {candidate.culturalFitScore}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(candidate.status)}</TableCell>
                      <TableCell>{formatDate(candidate.interviewDate)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-center flex-wrap">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            data-testid={`button-details-${candidate.id}`}
                            onClick={() => handleViewDetails(candidate)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Show Details
                          </Button>
                          {isCandidateAlreadySelected(candidate.applicationId) ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Already Selected
                            </Badge>
                          ) : (
                            <>
                              <Button 
                                variant={isCandidateSelected(candidate.id) ? "default" : "outline"}
                                size="sm" 
                                onClick={() => toggleCandidateSelection(candidate.id)}
                                data-testid={`button-select-${candidate.id}`}
                              >
                                {isCandidateSelected(candidate.id) ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Deselect
                                  </>
                                ) : (
                                  <>
                                    <Circle className="h-4 w-4 mr-1" />
                                    Select
                                  </>
                                )}
                              </Button>
                              <Button 
                                variant="default" 
                                size="sm" 
                                data-testid={`button-shortlist-${candidate.id}`}
                                onClick={() => handleAddToShortlist(candidate)}
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Add to Shortlist
                              </Button>
                            </>
                          )}
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

      {/* Add to Shortlist Dialog */}
      <Dialog open={isShortlistDialogOpen} onOpenChange={setIsShortlistDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add to Shortlist</DialogTitle>
            <DialogDescription>
              Add {selectedCandidateDetails?.name} to the shortlist for {selectedCandidateDetails?.jobTitle}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recommendation">Recommendation</Label>
              <Select 
                value={shortlistData.recommendation} 
                onValueChange={(value: "selected" | "maybe") => setShortlistData({ ...shortlistData, recommendation: value })}
              >
                <SelectTrigger id="recommendation" data-testid="select-recommendation">
                  <SelectValue placeholder="Select recommendation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="selected">Selected - Proceed to offer</SelectItem>
                  <SelectItem value="maybe">Maybe - Keep for consideration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                className="w-full p-2 border rounded-md min-h-20 text-sm bg-background"
                placeholder="Add any notes about this candidate..."
                value={shortlistData.notes}
                onChange={(e) => setShortlistData({ ...shortlistData, notes: e.target.value })}
                data-testid="textarea-shortlist-notes"
              />
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <span className="font-semibold">Candidate Details:</span>
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1">
                <li>Rank: #{selectedCandidateDetails?.rank}</li>
                <li>Overall Score: {selectedCandidateDetails?.overallScore}/100</li>
                <li>Interview Recommendation: {selectedCandidateDetails?.recommendation}</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsShortlistDialogOpen(false)} 
              data-testid="button-cancel-shortlist"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                addToShortlistMutation.mutate({
                  applicationId: selectedCandidateDetails?.applicationId || selectedCandidateDetails?.id,
                  recommendation: shortlistData.recommendation,
                  notes: shortlistData.notes
                });
              }}
              disabled={addToShortlistMutation.isPending}
              data-testid="button-confirm-shortlist"
            >
              {addToShortlistMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add to Shortlist
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Candidate Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Candidate Details</DialogTitle>
            <DialogDescription>
              Comprehensive ranking and evaluation information
            </DialogDescription>
          </DialogHeader>
          {selectedCandidateDetails && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Candidate Name</label>
                  <p className="text-base font-semibold mt-1">{selectedCandidateDetails.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Position</label>
                  <p className="text-base font-semibold mt-1">{selectedCandidateDetails.jobTitle}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Rank</label>
                  <p className="text-base font-semibold mt-1 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    #{selectedCandidateDetails.rank}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Interview Date</label>
                  <p className="text-base font-semibold mt-1">{formatDate(selectedCandidateDetails.interviewDate)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Evaluation Scores</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedCandidateDetails.overallScore}</p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-md">
                    <p className="text-sm text-muted-foreground">Technical Score</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{selectedCandidateDetails.technicalScore}</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-md">
                    <p className="text-sm text-muted-foreground">Communication Score</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedCandidateDetails.communicationScore}</p>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-md">
                    <p className="text-sm text-muted-foreground">Cultural Fit Score</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{selectedCandidateDetails.culturalFitScore}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Recommendation</h3>
                <Badge className={
                  selectedCandidateDetails.recommendation === 'strong_hire' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  selectedCandidateDetails.recommendation === 'hire' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  selectedCandidateDetails.recommendation === 'maybe' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }>
                  {selectedCandidateDetails.recommendation === 'strong_hire' ? 'Strong Hire' :
                   selectedCandidateDetails.recommendation === 'hire' ? 'Hire' :
                   selectedCandidateDetails.recommendation === 'maybe' ? 'Maybe' : 'No Hire'}
                </Badge>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Status</h3>
                {getStatusBadge(selectedCandidateDetails.status)}
              </div>

              {selectedCandidateDetails.strengths && selectedCandidateDetails.strengths.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Key Strengths</h3>
                  <ul className="space-y-2">
                    {selectedCandidateDetails.strengths.map((strength: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedCandidateDetails.weaknesses && selectedCandidateDetails.weaknesses.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Areas for Development</h3>
                  <ul className="space-y-2">
                    {selectedCandidateDetails.weaknesses.map((weakness: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedCandidateDetails.keyInsights && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Key Insights</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedCandidateDetails.keyInsights}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Interview & Verification</h3>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsInterviewDetailsDialogOpen(true)}
                    data-testid="button-interview-details"
                  >
                    View Interview Details
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsVideoDialogOpen(true)}
                    data-testid="button-view-interview-video"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Watch Interview Video
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)} data-testid="button-close-details">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Interview Details Dialog */}
      <Dialog open={isInterviewDetailsDialogOpen} onOpenChange={setIsInterviewDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Interview Details</DialogTitle>
            <DialogDescription>
              Questions asked and candidate responses for {selectedCandidateDetails?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-xs text-muted-foreground font-medium">Total Asked</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">4</p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <p className="text-xs text-muted-foreground font-medium">Total Answered</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">4</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-xs text-muted-foreground font-medium">Total Correct</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">3</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                <p className="text-xs text-muted-foreground font-medium">Accuracy</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">75%</p>
              </div>
            </div>

            {/* Interview Q&A Data */}
            <div className="space-y-4 border-t pt-4">
              {/* Question 1 - Correct */}
              <div className="border-l-4 border-l-green-500 pl-4 py-2 space-y-2">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-muted-foreground">Question 1</p>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-600">Correct</span>
                </div>
                <p className="text-base font-medium">Tell us about your experience with React and state management solutions.</p>
                
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded">
                    <p className="text-sm font-medium mb-2 text-slate-600 dark:text-slate-400">Candidate's Answer:</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      I have 5 years of experience with React. I've worked extensively with Redux for complex state management in large applications. Recently, I've also explored Context API and TanStack Query for simpler use cases. I believe in choosing the right tool based on the application's complexity.
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium mb-2 text-green-900 dark:text-green-100">Expected Answer:</p>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Candidate should demonstrate knowledge of React fundamentals, state management patterns (Redux, Context API, hooks), and ability to choose appropriate solutions based on complexity.
                    </p>
                  </div>
                </div>
              </div>

              {/* Question 2 - Correct */}
              <div className="border-l-4 border-l-green-500 pl-4 py-2 space-y-2">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-muted-foreground">Question 2</p>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-600">Correct</span>
                </div>
                <p className="text-base font-medium">Describe your approach to handling API errors and edge cases.</p>
                
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded">
                    <p className="text-sm font-medium mb-2 text-slate-600 dark:text-slate-400">Candidate's Answer:</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      I implement comprehensive error handling by validating responses, implementing retry logic with exponential backoff, and providing meaningful error messages to users. I also log errors to monitoring services like Sentry for analysis. Testing edge cases through unit and integration tests is essential.
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium mb-2 text-green-900 dark:text-green-100">Expected Answer:</p>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Should cover validation, error logging, user feedback, and testing strategies. Mention of retry logic and monitoring tools is preferred.
                    </p>
                  </div>
                </div>
              </div>

              {/* Question 3 - Incorrect */}
              <div className="border-l-4 border-l-red-500 pl-4 py-2 space-y-2">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-muted-foreground">Question 3</p>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-medium text-red-600">Incorrect</span>
                </div>
                <p className="text-base font-medium">How do you approach code review and feedback?</p>
                
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded">
                    <p className="text-sm font-medium mb-2 text-slate-600 dark:text-slate-400">Candidate's Answer:</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      I view code reviews as learning opportunities for everyone on the team. I provide constructive feedback focusing on the code, not the person. I look for architectural improvements, potential bugs, and knowledge-sharing moments. I'm also open to feedback on my code and use it to improve.
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
                    <p className="text-sm font-medium mb-2 text-red-900 dark:text-red-100">Expected Answer:</p>
                    <p className="text-sm text-red-800 dark:text-red-200">
                      Should specifically mention automated tools (linters, CI/CD), PR comments best practices, and process for handling disagreements. Response lacked mention of tools and processes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Question 4 - Correct */}
              <div className="border-l-4 border-l-green-500 pl-4 py-2 space-y-2">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-muted-foreground">Question 4</p>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-600">Correct</span>
                </div>
                <p className="text-base font-medium">Tell us about a challenging problem you solved recently.</p>
                
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded">
                    <p className="text-sm font-medium mb-2 text-slate-600 dark:text-slate-400">Candidate's Answer:</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      I recently solved a performance bottleneck in our dashboard where rendering was taking 5+ seconds. I identified unnecessary re-renders using React DevTools, implemented memoization with useMemo and useCallback, and refactored the component hierarchy. This reduced rendering time to under 500ms, significantly improving user experience.
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium mb-2 text-green-900 dark:text-green-100">Expected Answer:</p>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Should describe a specific problem, diagnostic approach, solution implemented, and measurable results. Candidate demonstrated all criteria with clear technical depth.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInterviewDetailsDialogOpen(false)} data-testid="button-close-interview-details">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add to Shortlist Dialog */}
      <Dialog open={isBulkShortlistDialogOpen} onOpenChange={setIsBulkShortlistDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add {selectedCandidates.length} Candidates to Shortlist</DialogTitle>
            <DialogDescription>
              Add all selected candidates to the shortlist for the hiring manager
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-recommendation">Recommendation</Label>
              <Select 
                value={shortlistData.recommendation} 
                onValueChange={(value: "selected" | "maybe") => setShortlistData({ ...shortlistData, recommendation: value })}
              >
                <SelectTrigger id="bulk-recommendation" data-testid="select-bulk-recommendation">
                  <SelectValue placeholder="Select recommendation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="selected">Selected - Proceed to offer</SelectItem>
                  <SelectItem value="maybe">Maybe - Keep for consideration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-notes">Notes (Optional)</Label>
              <textarea
                id="bulk-notes"
                className="w-full p-2 border rounded-md min-h-20 text-sm bg-background"
                placeholder="Add any notes about these candidates..."
                value={shortlistData.notes}
                onChange={(e) => setShortlistData({ ...shortlistData, notes: e.target.value })}
                data-testid="textarea-bulk-notes"
              />
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <span className="font-semibold">Summary:</span>
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1">
                <li>{selectedCandidates.length} candidates will be added to shortlist</li>
                <li>Selection Report will be updated</li>
                <li>Hiring manager can review the report</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsBulkShortlistDialogOpen(false);
                setShortlistData({ recommendation: "selected", notes: "" });
              }} 
              data-testid="button-cancel-bulk-shortlist"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                bulkAddToShortlistMutation.mutate({
                  recommendation: shortlistData.recommendation,
                  notes: shortlistData.notes
                });
              }}
              disabled={bulkAddToShortlistMutation.isPending}
              data-testid="button-confirm-bulk-shortlist"
            >
              {bulkAddToShortlistMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add {selectedCandidates.length} to Shortlist
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Dialog */}
      <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Interview Video</DialogTitle>
            <DialogDescription>
              Video recording from interview conducted on {formatDate(selectedCandidateDetails?.interviewDate)}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
                    <Play className="h-8 w-8 text-white fill-white" />
                  </div>
                </div>
                <p className="text-slate-300 font-medium mb-2">Interview Recording</p>
                <p className="text-slate-400 text-sm mb-4">Duration: 45 minutes 23 seconds</p>
                <Button 
                  variant="default"
                  data-testid="button-play-video"
                  onClick={() => {
                    toast({
                      title: "Video Player",
                      description: "In production, this would open a secure video player. Video URL: /api/interview-videos/{selectedCandidateDetails?.id}"
                    });
                  }}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Play Video
                </Button>
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 rounded-md">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">Verification Information:</p>
              <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                <li>• Video recorded with candidate's face and surroundings visible</li>
                <li>• Recording started at interview initiation - anti-cheating measures active</li>
                <li>• Timestamp metadata embedded for audit purposes</li>
                <li>• All interactions logged for compliance</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVideoDialogOpen(false)} data-testid="button-close-video">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
