import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, Mail, Phone, FileText, TrendingUp, Award, CheckCircle, XCircle } from "lucide-react";
import { RoleGate } from "@/components/RoleGate";
import { PaginatedResponse, SelectApplication, SelectJob } from "@shared/schema";
import { useState } from "react";

export default function CandidatesPage() {
  return (
    <RoleGate allowedRoles={['recruiter', 'company_admin']}>
      <CandidatesContent />
    </RoleGate>
  );
}

function CandidatesContent() {
  const { user } = useAuth();
  const userRole = (user as any)?.role;
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all jobs
  const { data: jobsData } = useQuery<PaginatedResponse<SelectJob>>({
    queryKey: ['/api/jobs'],
    enabled: !!user && (userRole === 'recruiter' || userRole === 'company_admin'),
  });

  const jobs = jobsData?.data || [];

  // Auto-select first job
  if (!selectedJobId && jobs.length > 0) {
    setSelectedJobId(jobs[0].id);
  }

  const { data: candidatesData, isLoading } = useQuery<PaginatedResponse<SelectApplication>>({
    queryKey: ['/api/applications', selectedJobId],
    enabled: !!user && !!selectedJobId && (userRole === 'recruiter' || userRole === 'company_admin'),
  });

  const candidates = candidatesData?.data || [];

  // Filter candidates by search query
  const filteredCandidates = candidates.filter((application: any) => {
    if (!searchQuery) return true;
    const fullName = `${application.candidate?.firstName} ${application.candidate?.lastName}`.toLowerCase();
    const email = application.candidate?.email?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  // Calculate summary stats
  const totalCandidates = candidates.length;
  const screenedCandidates = candidates.filter((app: any) => app.screeningStatus === 'passed').length;
  const avgScreeningScore = candidates.length > 0
    ? (candidates.reduce((sum: number, app: any) => sum + (app.screeningScore || 0), 0) / candidates.length).toFixed(1)
    : '0';
  const strongMatches = candidates.filter((app: any) => (app.screeningScore || 0) > 85).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-candidates-title">Resume Screening</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered resume analysis and candidate matching
          </p>
        </div>
        <div className="w-64">
          <Select value={selectedJobId || ""} onValueChange={setSelectedJobId}>
            <SelectTrigger data-testid="select-job">
              <SelectValue placeholder="Select a job" />
            </SelectTrigger>
            <SelectContent>
              {jobs.map((job: any) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400" data-testid="metric-total-candidates">
              {totalCandidates}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Screened</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="metric-screened">
              {screenedCandidates}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400" data-testid="metric-avg-score">
              {avgScreeningScore}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Strong Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400" data-testid="metric-strong-matches">
              {strongMatches}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates by name or email..."
            className="pl-10"
            data-testid="input-search-candidates"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredCandidates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "No matching candidates" : "No candidates yet"}
              </h3>
              <p className="text-muted-foreground text-center">
                {searchQuery ? "Try adjusting your search query" : "Candidates who apply to your jobs will appear here"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCandidates.map((application: any) => {
            const screeningScore = application.screeningScore || 0;
            const screeningStatus = application.screeningStatus;
            const initials = `${application.candidate?.firstName?.[0] || ''}${application.candidate?.lastName?.[0] || ''}`.toUpperCase();
            
            return (
              <Card key={application.id} className="hover-elevate" data-testid={`card-candidate-${application.id}`}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={application.candidate?.profileImageUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <CardTitle className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-primary">{application.jobApplicationId}</span>
                            <span className="text-muted-foreground">
                              [{application.candidate?.firstName} {application.candidate?.lastName} - {application.job?.title}]
                            </span>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Applied {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : ''}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {screeningStatus === 'passed' && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Passed
                            </Badge>
                          )}
                          {screeningStatus === 'failed' && (
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              <XCircle className="w-3 h-3 mr-1" />
                              Not Qualified
                            </Badge>
                          )}
                          <div className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-md">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <span className="font-bold text-primary">{Math.round(screeningScore)}</span>
                            <span className="text-xs text-muted-foreground">/100</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{application.candidate?.email}</span>
                      </div>
                      {application.source && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Award className="h-4 w-4" />
                          <span>Source: {application.source}</span>
                        </div>
                      )}
                    </div>

                    {application.screeningData && (
                      <div className="bg-muted/50 p-3 rounded-md space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Matched Skills: </span>
                          {application.screeningData.matchedSkills?.join(', ') || 'N/A'}
                        </div>
                        {application.screeningData.strengths && application.screeningData.strengths.length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium text-green-600 dark:text-green-400">Strengths: </span>
                            {application.screeningData.strengths[0]}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-end gap-2 flex-wrap">
                      <Button variant="outline" size="sm" data-testid={`button-view-resume-${application.id}`}>
                        <FileText className="h-4 w-4 mr-2" />
                        View Resume
                      </Button>
                      <Button variant="outline" size="sm" data-testid={`button-view-screening-${application.id}`}>
                        View Screening Report
                      </Button>
                      <Button size="sm" data-testid={`button-schedule-interview-${application.id}`}>
                        Schedule Interview
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
