import { useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import { 
  Search, 
  ArrowLeft,
  FileText,
  Trash2,
  Upload,
  TrendingUp,
  Copy,
  Eye,
  Edit,
  Zap,
  Calendar,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ApplicantsDetail() {
  const [matchMain] = useRoute("/resume-screening/:jobPostingId");
  const [matchDetail] = useRoute("/resume-screening/:jobPostingId/:candidateId");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showTopOnly, setShowTopOnly] = useState(false);
  const [selectedApplicants, setSelectedApplicants] = useState<string[]>([]);
  const [scoringId, setScoringId] = useState<string | null>(null);
  const [batchScoringInProgress, setBatchScoringInProgress] = useState(false);
  const [editingRecruiterScore, setEditingRecruiterScore] = useState<{ id: string; name: string; score: number } | null>(null);
  const [showScheduleConfirm, setShowScheduleConfirm] = useState(false);

  const params = matchDetail || matchMain;
  const jobPostingId = params?.jobPostingId || "";
  const candidateId = params?.candidateId || "";

  // Fetch real applications data
  const { data: applicationsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/applications'],
  });

  const { data: jobsData } = useQuery({
    queryKey: ['/api/jobs/company'],
  });

  // Score mutation
  const scoreMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      setScoringId(applicationId);
      const response = await apiRequest(`/api/applications/${applicationId}/score`, {
        method: 'POST',
      });
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Scoring Complete",
        description: `Score: ${data?.score || 'N/A'}% - ${data?.reasoning || 'Scoring completed'}`,
      });
      refetch();
      setScoringId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Scoring Failed",
        description: error.message || "Failed to score application",
        variant: "destructive",
      });
      setScoringId(null);
    },
  });

  // Recruiter score mutation
  const recruiterScoreMutation = useMutation({
    mutationFn: async (data: { applicationId: string; recruiterMatchScore: number }) => {
      return await apiRequest(`/api/applications/${data.applicationId}`, {
        method: 'PATCH',
        body: { recruiterMatchScore: data.recruiterMatchScore },
      });
    },
    onSuccess: () => {
      toast({
        title: "Recruiter Score Updated",
        description: "Your recruiter score has been saved successfully",
      });
      refetch();
      setEditingRecruiterScore(null);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to save recruiter score",
        variant: "destructive",
      });
    },
  });

  // Batch score mutation
  const batchScoreMutation = useMutation({
    mutationFn: async () => {
      const jobsArray = Array.isArray(jobsData) ? jobsData : [];
      const jobId = jobsArray.find((j: any) => j.jobPostingId === jobPostingId)?.id;
      if (!jobId) throw new Error("Job not found");
      
      setBatchScoringInProgress(true);
      const response = await apiRequest(`/api/jobs/${jobId}/score-batch`, {
        method: 'POST',
      });
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Batch Scoring Complete",
        description: `Scored ${data.scored} of ${data.total} candidates successfully`,
      });
      refetch();
      setBatchScoringInProgress(false);
    },
    onError: (error: any) => {
      toast({
        title: "Batch Scoring Failed",
        description: error.message || "Failed to score candidates",
        variant: "destructive",
      });
      setBatchScoringInProgress(false);
    },
  });

  // Schedule interviews mutation
  const scheduleInterviewsMutation = useMutation({
    mutationFn: async (applicationIds: string[]) => {
      const results = await Promise.all(
        applicationIds.map(appId =>
          apiRequest(`/api/applications/${appId}`, {
            method: 'PATCH',
            body: { status: 'interview_scheduled' },
          })
        )
      );
      return results;
    },
    onSuccess: () => {
      toast({
        title: "Interview Scheduled",
        description: `${selectedApplicants.length} candidate(s) notified to schedule interview dates`,
      });
      refetch();
      setSelectedApplicants([]);
      setShowScheduleConfirm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Scheduling Failed",
        description: error.message || "Failed to schedule interviews",
        variant: "destructive",
      });
    },
  });

  // Filter applications for this specific job
  const applicantsData = useMemo(() => {
    if (!applicationsData || !jobsData) return [];

    const jobs = Array.isArray(jobsData) ? jobsData : [];
    const applications = Array.isArray(applicationsData) ? applicationsData : [];
    const job = jobs.find((j: any) => j.jobPostingId === jobPostingId);

    if (!job) return [];

    return applications
      .filter((app: any) => app.jobId === job.id)
      .map((app: any) => ({
        id: app.id,
        candidateId: app.candidateId,
        name: app.candidateName || 'Unknown',
        email: app.candidateEmail || '-',
        phone: app.candidatePhone || '-',
        location: app.candidate?.location || '-',
        experience: app.candidate?.currentTitle || '-',
        relevantExperience: app.screeningData?.keyHighlights || '-',
        aiScore: app.screeningScore || 0,
        yourScore: app.recruiterMatchScore || 0,
        resumeUrl: app.resumeUrl || "#"
      }));
  }, [applicationsData, jobsData, jobPostingId]);

  const filteredApplicants = applicantsData.filter((applicant: any) => {
    const matchesSearch = !searchQuery || 
      applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      applicant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      applicant.experience.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTopFilter = !showTopOnly || applicant.aiScore >= 85;
    
    return matchesSearch && matchesTopFilter;
  });

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApplicants(filteredApplicants.map((a: any) => String(a.id)));
    } else {
      setSelectedApplicants([]);
    }
  };

  const handleSelectApplicant = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedApplicants([...selectedApplicants, id]);
    } else {
      setSelectedApplicants(selectedApplicants.filter(aid => aid !== id));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setLocation('/resume-screening')}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold" data-testid="heading-applicants">
            Applicants
          </h1>
          <p className="text-muted-foreground mt-1">
            Job Application ID: <span className="font-mono text-primary font-semibold">{jobPostingId}</span>
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search applicants by name, contact, or experience..."
                className="pl-10"
                data-testid="input-search-applicants"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="top-applicants" 
                  checked={showTopOnly}
                  onCheckedChange={(checked) => setShowTopOnly(checked as boolean)}
                  data-testid="checkbox-show-top"
                />
                <Label htmlFor="top-applicants" className="text-sm font-medium cursor-pointer">
                  Show top applicants only
                </Label>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Button 
                  variant="default"
                  disabled={batchScoringInProgress || !applicantsData.some((a: any) => !a.screeningScore || a.screeningScore === 0)}
                  onClick={() => batchScoreMutation.mutate()}
                  data-testid="button-score-all"
                >
                  {batchScoringInProgress ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Score All Unscored
                </Button>
                <Button 
                  variant="default"
                  disabled={selectedApplicants.length === 0}
                  onClick={() => setShowScheduleConfirm(true)}
                  data-testid="button-schedule-interview"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Interview ({selectedApplicants.length})
                </Button>
                <Button 
                  variant="default"
                  data-testid="button-start-ranking"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Start Ranking
                </Button>
                <Button 
                  variant="destructive"
                  disabled={selectedApplicants.length === 0}
                  data-testid="button-delete"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button 
                  variant="outline"
                  data-testid="button-upload-resumes"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Resumes
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applicants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resume Screening Results</CardTitle>
          <CardDescription>
            Showing {filteredApplicants.length} of {applicantsData.length} applicants
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredApplicants.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No applicants found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try adjusting your search criteria" : "No applicants have been screened yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedApplicants.length === filteredApplicants.length}
                        onCheckedChange={handleSelectAll}
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead className="min-w-[80px]">Resume</TableHead>
                    <TableHead className="min-w-[160px]">Name</TableHead>
                    <TableHead className="min-w-[200px]">Contact</TableHead>
                    <TableHead className="min-w-[120px]">Location</TableHead>
                    <TableHead className="min-w-[250px]">Experience</TableHead>
                    <TableHead className="min-w-[250px]">Relevant Exp.</TableHead>
                    <TableHead className="min-w-[100px] text-center">
                      <div className="flex items-center justify-center gap-1">
                        AI Score
                        <TrendingUp className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[120px] text-center">Your Score</TableHead>
                    <TableHead className="min-w-[100px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplicants.map((applicant: any) => (
                    <TableRow 
                      key={applicant.id} 
                      className="hover-elevate"
                      data-testid={`row-applicant-${applicant.id}`}
                    >
                      <TableCell>
                        <Checkbox 
                          checked={selectedApplicants.includes(applicant.id)}
                          onCheckedChange={(checked) => handleSelectApplicant(applicant.id, checked as boolean)}
                          data-testid={`checkbox-applicant-${applicant.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <FileText className="h-5 w-5 text-red-500" />
                          <span className="text-xs text-muted-foreground">pdf</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{applicant.name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">{applicant.email}</div>
                          <div className="text-sm text-muted-foreground">{applicant.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{applicant.location}</TableCell>
                      <TableCell className="text-sm">{applicant.experience}</TableCell>
                      <TableCell className="text-sm">{applicant.relevantExperience}</TableCell>
                      <TableCell className="text-center">
                        {applicant.aiScore > 0 ? (
                          getScoreBadge(applicant.aiScore)
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {applicant.yourScore > 0 ? (
                          <Badge className="bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800 text-sm font-semibold">
                            {applicant.yourScore}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => scoreMutation.mutate(applicant.id)}
                            disabled={scoringId === applicant.id}
                            data-testid={`button-score-${applicant.id}`}
                            title="Run AI Scoring"
                          >
                            {scoringId === applicant.id ? (
                              <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                            ) : (
                              <Zap className="h-4 w-4 text-yellow-600" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              toast({
                                title: "Candidate Profile",
                                description: `${applicant.name} - ${applicant.email} (${applicant.experience})`,
                              });
                            }}
                            data-testid={`button-view-${applicant.id}`}
                            title="View Candidate"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingRecruiterScore({ 
                              id: applicant.id, 
                              name: applicant.name, 
                              score: applicant.yourScore 
                            })}
                            data-testid={`button-edit-score-${applicant.id}`}
                            title="Edit Recruiter Score"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            data-testid={`button-delete-${applicant.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {filteredApplicants.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing 1 to {filteredApplicants.length} of {filteredApplicants.length} applicants
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Interview Confirmation Dialog */}
      <Dialog open={showScheduleConfirm} onOpenChange={setShowScheduleConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Interviews
            </DialogTitle>
            <DialogDescription>
              Send interview scheduling notifications to selected candidates
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                {selectedApplicants.length} candidate(s) will be notified to select their preferred interview date and time from their dashboard.
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-sm">Selected Candidates:</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredApplicants
                  .filter((a: any) => selectedApplicants.includes(a.id))
                  .map((a: any) => (
                    <div key={a.id} className="text-sm text-muted-foreground flex justify-between">
                      <span>{a.name}</span>
                      <span className="text-xs">{a.email}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setShowScheduleConfirm(false)}
              data-testid="button-cancel-schedule"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => scheduleInterviewsMutation.mutate(selectedApplicants)}
              disabled={scheduleInterviewsMutation.isPending}
              data-testid="button-confirm-schedule"
            >
              {scheduleInterviewsMutation.isPending ? 'Scheduling...' : 'Confirm & Notify'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recruiter Score Dialog */}
      <Dialog open={!!editingRecruiterScore} onOpenChange={(open) => !open && setEditingRecruiterScore(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Recruiter Score</DialogTitle>
            <DialogDescription>
              Set your manual recruiter match score for {editingRecruiterScore?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recruiter-score">Score (0-100)</Label>
              <Input
                id="recruiter-score"
                type="number"
                min="0"
                max="100"
                value={editingRecruiterScore?.score ?? 0}
                onChange={(e) => {
                  if (editingRecruiterScore) {
                    const value = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                    setEditingRecruiterScore({ ...editingRecruiterScore, score: value });
                  }
                }}
                data-testid="input-recruiter-score"
                placeholder="Enter score 0-100"
              />
              <p className="text-xs text-muted-foreground">
                Enter a value between 0 and 100 to represent your recruiter assessment
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setEditingRecruiterScore(null)}
              data-testid="button-cancel-score"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingRecruiterScore) {
                  recruiterScoreMutation.mutate({
                    applicationId: editingRecruiterScore.id,
                    recruiterMatchScore: editingRecruiterScore.score,
                  });
                }
              }}
              disabled={recruiterScoreMutation.isPending}
              data-testid="button-save-score"
            >
              {recruiterScoreMutation.isPending ? "Saving..." : "Save Score"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
