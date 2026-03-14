import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  User,
  Briefcase,
  Calendar,
  Clock,
  Target,
  MessageSquare,
  Brain,
  Shield,
  Heart,
  Award,
  Video,
  Download
} from "lucide-react";

interface InterviewEvaluation {
  id: number;
  sessionId: number;
  overallScore: number;
  recommendation: string;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  confidenceScore: number;
  culturalFitScore: number;
  strengths: string[];
  weaknesses: string[];
  keyInsights: string;
  questionScores: {
    questionId: string;
    question: string;
    answer: string;
    score: number;
    feedback: string;
  }[];
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
  session: {
    id: number;
    status: string;
    startedAt: string;
    completedAt: string;
    duration: number;
    totalQuestions: number;
    questionsAnswered: number;
    application: {
      id: number;
      jobApplicationId: string;
      candidate: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
      };
      job: {
        id: string;
        title: string;
        department: string;
        experienceLevel: string;
      };
    };
  };
}

interface VideoData {
  sessionId: string;
  status: string;
  completedAt: string;
  hasVideo: boolean;
  videoFileName: string;
  videoUploadedAt: string;
  videoBase64: string | null;
  answers: any[];
}

const getRecommendationConfig = (recommendation: string) => {
  switch (recommendation) {
    case "strong_hire":
      return { 
        label: "Strong Hire", 
        color: "bg-green-500 dark:bg-green-600",
        textColor: "text-green-700 dark:text-green-400",
        icon: CheckCircle 
      };
    case "hire":
      return { 
        label: "Hire", 
        color: "bg-blue-500 dark:bg-blue-600",
        textColor: "text-blue-700 dark:text-blue-400",
        icon: CheckCircle 
      };
    case "maybe":
      return { 
        label: "Maybe", 
        color: "bg-yellow-500 dark:bg-yellow-600",
        textColor: "text-yellow-700 dark:text-yellow-400",
        icon: AlertCircle 
      };
    case "no_hire":
      return { 
        label: "No Hire", 
        color: "bg-red-500 dark:bg-red-600",
        textColor: "text-red-700 dark:text-red-400",
        icon: XCircle 
      };
    default:
      return { 
        label: recommendation, 
        color: "bg-gray-500 dark:bg-gray-600",
        textColor: "text-gray-700 dark:text-gray-400",
        icon: AlertCircle 
      };
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-blue-600 dark:text-blue-400";
  if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
};

const getProgressColor = (score: number) => {
  if (score >= 80) return "[&>div]:bg-green-500";
  if (score >= 60) return "[&>div]:bg-blue-500";
  if (score >= 40) return "[&>div]:bg-yellow-500";
  return "[&>div]:bg-red-500";
};

export default function InterviewEvaluation() {
  const [, params] = useRoute("/interview-evaluation/:id");
  const evaluationId = params?.id;

  const { data: evaluation, isLoading } = useQuery<InterviewEvaluation>({
    queryKey: ["/api/interview-evaluations", evaluationId],
    enabled: !!evaluationId,
  });

  const { data: videoData } = useQuery<VideoData>({
    queryKey: ["/api/applications", evaluation?.session?.application?.id, "interview-video"],
    enabled: !!evaluation?.session?.application?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading evaluation...</p>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Evaluation Not Found</h3>
            <p className="text-muted-foreground">
              The interview evaluation you're looking for doesn't exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { session } = evaluation;
  const { application } = session;
  const { candidate, job } = application;
  const recommendationConfig = getRecommendationConfig(evaluation.recommendation);
  const RecommendationIcon = recommendationConfig.icon;

  const dimensionScores = [
    { name: "Technical", score: evaluation.technicalScore, icon: Brain, color: "blue" },
    { name: "Communication", score: evaluation.communicationScore, icon: MessageSquare, color: "green" },
    { name: "Problem Solving", score: evaluation.problemSolvingScore, icon: Target, color: "purple" },
    { name: "Confidence", score: evaluation.confidenceScore, icon: Shield, color: "orange" },
    { name: "Cultural Fit", score: evaluation.culturalFitScore, icon: Heart, color: "pink" },
  ];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 space-y-6 max-w-7xl pb-12">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold">Interview Evaluation</h1>
              <p className="text-muted-foreground">
                Application ID: {application.jobApplicationId}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-base px-4 py-1">
                <RecommendationIcon className="h-4 w-4 mr-2" />
                {recommendationConfig.label}
              </Badge>
            </div>
          </div>

          {/* Candidate & Job Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Candidate Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{candidate.firstName} {candidate.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-sm">{candidate.email}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Position Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium">{job.title}</p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="text-sm">{job.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Level</p>
                    <Badge variant="secondary" className="mt-1">
                      {job.experienceLevel}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interview Session Stats */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="font-medium text-sm">
                      {new Date(session.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium text-sm">{formatDuration(session.duration)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Questions</p>
                    <p className="font-medium text-sm">
                      {session.questionsAnswered}/{session.totalQuestions}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                    <p className={`font-bold text-2xl ${getScoreColor(evaluation.overallScore)}`}>
                      {evaluation.overallScore}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interview Video Section */}
        {videoData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Interview Recording
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {videoData.hasVideo ? (
                <div className="space-y-4">
                  <div className="bg-black rounded-lg aspect-video flex items-center justify-center overflow-hidden">
                    {videoData.videoBase64 ? (
                      <video
                        controls
                        className="w-full h-full"
                        src={`data:video/webm;base64,${videoData.videoBase64}`}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Video data not available</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm">
                      <p className="text-muted-foreground">File: {videoData.videoFileName}</p>
                      {videoData.videoBase64 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = `data:video/webm;base64,${videoData.videoBase64}`;
                            link.download = videoData.videoFileName || 'interview-recording.webm';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      )}
                    </div>
                    {videoData.videoUploadedAt && (
                      <p className="text-xs text-muted-foreground">
                        Recorded: {new Date(videoData.videoUploadedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>No video recording available for this interview</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Overall Score Section */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative">
                <div className={`text-7xl font-bold ${getScoreColor(evaluation.overallScore)}`}>
                  {evaluation.overallScore}
                </div>
                <div className="absolute -bottom-2 -right-2">
                  <div className={`w-16 h-16 rounded-full ${recommendationConfig.color} flex items-center justify-center`}>
                    <RecommendationIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
              <p className="text-lg text-muted-foreground mt-4">out of 100</p>
              <div className="w-full max-w-md mt-6">
                <Progress value={evaluation.overallScore} className={getProgressColor(evaluation.overallScore)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dimension Scores */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Dimensions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {dimensionScores.map((dimension) => {
              const Icon = dimension.icon;
              return (
                <div key={dimension.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{dimension.name}</span>
                    </div>
                    <span className={`text-lg font-bold ${getScoreColor(dimension.score)}`}>
                      {dimension.score}
                    </span>
                  </div>
                  <Progress value={dimension.score} className={getProgressColor(dimension.score)} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <TrendingUp className="h-5 w-5" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {evaluation.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <TrendingDown className="h-5 w-5" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {evaluation.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{weakness}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Key Insights */}
        {evaluation.keyInsights && (
          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{evaluation.keyInsights}</p>
            </CardContent>
          </Card>
        )}

        {/* Sentiment Analysis */}
        {evaluation.sentimentAnalysis && (
          <Card>
            <CardHeader>
              <CardTitle>Communication Sentiment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">Positive</span>
                  <span className="text-sm font-bold">{Math.round(evaluation.sentimentAnalysis.positive)}%</span>
                </div>
                <Progress value={evaluation.sentimentAnalysis.positive} className="[&>div]:bg-green-500" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Neutral</span>
                  <span className="text-sm font-bold">{Math.round(evaluation.sentimentAnalysis.neutral)}%</span>
                </div>
                <Progress value={evaluation.sentimentAnalysis.neutral} className="[&>div]:bg-blue-500" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">Negative</span>
                  <span className="text-sm font-bold">{Math.round(evaluation.sentimentAnalysis.negative)}%</span>
                </div>
                <Progress value={evaluation.sentimentAnalysis.negative} className="[&>div]:bg-red-500" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Question Breakdown */}
        {evaluation.questionScores && evaluation.questionScores.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Question-by-Question Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {evaluation.questionScores.map((q, index) => (
                <div key={q.questionId} className="space-y-3">
                  {index > 0 && <Separator />}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-sm">Question {index + 1}</p>
                        <p className="text-sm text-muted-foreground mt-1">{q.question}</p>
                      </div>
                      <Badge variant={q.score >= 70 ? "default" : q.score >= 50 ? "secondary" : "destructive"}>
                        {q.score}/100
                      </Badge>
                    </div>
                    {q.feedback && (
                      <div className="bg-muted/50 p-3 rounded-md">
                        <p className="text-xs text-muted-foreground">Feedback</p>
                        <p className="text-sm mt-1">{q.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}
