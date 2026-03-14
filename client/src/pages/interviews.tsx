import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Video, Calendar, Clock, PlayCircle, TrendingUp, MessageCircle, Award, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleGate } from "@/components/RoleGate";
import { PaginatedResponse, SelectApplication, SelectJob } from "@shared/schema";
import { useState } from "react";

export default function InterviewsPage() {
  return (
    <RoleGate allowedRoles={['recruiter', 'company_admin']}>
      <InterviewsContent />
    </RoleGate>
  );
}

function InterviewsContent() {
  const { user } = useAuth();
  const userRole = (user as any)?.role;
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

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

  const { data: applicationsData, isLoading } = useQuery<PaginatedResponse<SelectApplication>>({
    queryKey: ['/api/applications', selectedJobId],
    enabled: !!user && !!selectedJobId && (userRole === 'recruiter' || userRole === 'company_admin'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading interviews...</p>
        </div>
      </div>
    );
  }

  const applications = applicationsData?.data || [];
  
  // Filter applications that have evaluation scores
  const completedInterviews = applications.filter((app: any) => app.evaluationScore && app.evaluationScore > 0);
  const scheduledInterviews = applications.filter((app: any) => app.status === 'interview_scheduled');
  const inProgressInterviews = applications.filter((app: any) => app.status === 'interviewing');

  // Calculate summary stats
  const totalInterviews = completedInterviews.length;
  const avgEvaluationScore = completedInterviews.length > 0
    ? (completedInterviews.reduce((sum: number, app: any) => sum + (app.evaluationScore || 0), 0) / completedInterviews.length).toFixed(1)
    : '0';
  const strongPerformers = completedInterviews.filter((app: any) => (app.evaluationScore || 0) > 80).length;
  const avgDuration = "32 min"; // Placeholder

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-interviews-title">Interview Evaluation</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered interview analysis and candidate assessment
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
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400" data-testid="metric-total-interviews">
              {totalInterviews}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="metric-avg-score">
              {avgEvaluationScore}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Strong Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400" data-testid="metric-strong">
              {strongPerformers}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400" data-testid="metric-duration">
              {avgDuration}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="completed" className="space-y-4">
        <TabsList>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Evaluated ({completedInterviews.length})
          </TabsTrigger>
          <TabsTrigger value="scheduled" data-testid="tab-scheduled">
            Scheduled ({scheduledInterviews.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress" data-testid="tab-in-progress">
            In Progress ({inProgressInterviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="completed" className="space-y-4">
          {completedInterviews.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Video className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No completed interviews</h3>
                <p className="text-muted-foreground text-center">
                  Completed interviews will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            completedInterviews.map((interview: any) => (
              <EvaluatedInterviewCard key={interview.id} interview={interview} />
            ))
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          {scheduledInterviews.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No scheduled interviews</h3>
                <p className="text-muted-foreground text-center">
                  Schedule interviews with candidates to see them here
                </p>
              </CardContent>
            </Card>
          ) : (
            scheduledInterviews.map((interview: any) => (
              <InterviewCard key={interview.id} interview={interview} />
            ))
          )}
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-4">
          {inProgressInterviews.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Video className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No interviews in progress</h3>
              </CardContent>
            </Card>
          ) : (
            inProgressInterviews.map((interview: any) => (
              <InterviewCard key={interview.id} interview={interview} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EvaluatedInterviewCard({ interview }: { interview: any }) {
  const evaluationScore = interview.evaluationScore || 0;
  const initials = `${interview.candidate?.firstName?.[0] || ''}${interview.candidate?.lastName?.[0] || ''}`.toUpperCase();
  
  return (
    <Card className="hover-elevate" data-testid={`card-interview-${interview.id}`}>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={interview.candidate?.profileImageUrl} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-primary">{interview.jobApplicationId}</span>
                  <span className="text-muted-foreground">
                    [{interview.candidate?.firstName} {interview.candidate?.lastName} - {interview.job?.title}]
                  </span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Interview completed
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {evaluationScore > 80 && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <Award className="w-3 h-3 mr-1" />
                    Strong Hire
                  </Badge>
                )}
                {evaluationScore > 70 && evaluationScore <= 80 && (
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    <Star className="w-3 h-3 mr-1" />
                    Hire
                  </Badge>
                )}
                {evaluationScore <= 70 && (
                  <Badge variant="secondary">
                    Consider
                  </Badge>
                )}
                <div className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-md">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="font-bold text-primary">{Math.round(evaluationScore)}</span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="bg-muted/50 p-2 rounded-md">
              <div className="text-xs text-muted-foreground">Technical</div>
              <div className="font-semibold">85/100</div>
            </div>
            <div className="bg-muted/50 p-2 rounded-md">
              <div className="text-xs text-muted-foreground">Communication</div>
              <div className="font-semibold">78/100</div>
            </div>
            <div className="bg-muted/50 p-2 rounded-md">
              <div className="text-xs text-muted-foreground">Problem Solving</div>
              <div className="font-semibold">82/100</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {interview.evaluatedAt 
                  ? new Date(interview.evaluatedAt).toLocaleDateString()
                  : 'Recently'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>32 minutes</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>5 questions</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 flex-wrap">
            <Button variant="outline" size="sm" data-testid={`button-view-transcript-${interview.id}`}>
              <PlayCircle className="h-4 w-4 mr-2" />
              View Transcript
            </Button>
            <Button variant="outline" size="sm" data-testid={`button-view-evaluation-${interview.id}`}>
              View Full Evaluation
            </Button>
            <Button size="sm" data-testid={`button-move-to-ranking-${interview.id}`}>
              Move to Ranking
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InterviewCard({ interview }: { interview: any }) {
  const initials = `${interview.candidate?.firstName?.[0] || ''}${interview.candidate?.lastName?.[0] || ''}`.toUpperCase();
  
  return (
    <Card className="hover-elevate" data-testid={`card-interview-${interview.id}`}>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={interview.candidate?.profileImageUrl} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-primary">{interview.jobApplicationId}</span>
                  <span className="text-muted-foreground">
                    [{interview.candidate?.firstName} {interview.candidate?.lastName} - {interview.job?.title}]
                  </span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Scheduled
                </CardDescription>
              </div>
              <Badge variant={interview.status === 'evaluated' || interview.status === 'interviewed' ? 'default' : 'secondary'}>
                {interview.status}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {interview.interviewScheduledAt 
                  ? new Date(interview.interviewScheduledAt).toLocaleDateString()
                  : 'Not scheduled'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>30 minutes</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button size="sm" data-testid={`button-start-interview-${interview.id}`}>
              <Video className="h-4 w-4 mr-2" />
              Start Interview
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
