import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Award, 
  BookOpen, 
  Clock, 
  Target,
  ChevronRight,
  Trophy,
  Users
} from "lucide-react";

interface TestResult {
  id: string;
  title: string;
  date: string;
  score: number;
  maxScore: number;
  percentage: number;
  duration: number;
  rank: number;
  totalStudents: number;
}

interface SubjectPerformance {
  subject: string;
  score: number;
  maxScore: number;
  accuracy: number;
  attempts: number;
}

interface ChapterAnalysis {
  chapter: string;
  subject: string;
  score: number;
  maxScore: number;
  accuracy: number;
  difficulty: string;
}

export default function PerformanceDashboard() {
  // todo: remove mock functionality
  const mockTestResults: TestResult[] = [
    {
      id: "1",
      title: "NEET Mock Test #1",
      date: "2025-01-15",
      score: 520,
      maxScore: 720,
      percentage: 72.2,
      duration: 175,
      rank: 1247,
      totalStudents: 15230
    },
    {
      id: "2", 
      title: "JEE Main Mock Test #1",
      date: "2025-01-10",
      score: 185,
      maxScore: 300,
      percentage: 61.7,
      duration: 168,
      rank: 2341,
      totalStudents: 12450
    }
  ];

  const mockSubjectPerformance: SubjectPerformance[] = [
    { subject: "Physics", score: 140, maxScore: 180, accuracy: 77.8, attempts: 45 },
    { subject: "Chemistry", score: 155, maxScore: 180, accuracy: 86.1, attempts: 45 },
    { subject: "Biology", score: 225, maxScore: 360, accuracy: 62.5, attempts: 90 }
  ];

  const mockChapterAnalysis: ChapterAnalysis[] = [
    { chapter: "Mechanics", subject: "Physics", score: 28, maxScore: 40, accuracy: 70, difficulty: "Medium" },
    { chapter: "Thermodynamics", subject: "Physics", score: 32, maxScore: 36, accuracy: 89, difficulty: "Easy" },
    { chapter: "Organic Chemistry", subject: "Chemistry", score: 45, maxScore: 60, accuracy: 75, difficulty: "Hard" },
    { chapter: "Plant Physiology", subject: "Biology", score: 52, maxScore: 80, accuracy: 65, difficulty: "Medium" }
  ];

  const handleViewDetailedAnalysis = () => {
    console.log("Navigate to detailed analysis");
  };

  const handleRetakeTest = (testId: string) => {
    console.log(`Retake test: ${testId}`);
  };

  const overallStats = {
    totalTests: mockTestResults.length,
    averageScore: Math.round(mockTestResults.reduce((acc, test) => acc + test.percentage, 0) / mockTestResults.length),
    bestRank: Math.min(...mockTestResults.map(t => t.rank)),
    studyHours: 45
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-foreground">Performance Dashboard</h1>
            <Button onClick={handleViewDetailedAnalysis} data-testid="button-detailed-analysis">
              Detailed Analysis
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-semibold" data-testid="text-total-tests">{overallStats.totalTests}</div>
              <div className="text-sm text-muted-foreground">Tests Taken</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 text-chart-2 mx-auto mb-2" />
              <div className="text-2xl font-semibold" data-testid="text-average-score">{overallStats.averageScore}%</div>
              <div className="text-sm text-muted-foreground">Average Score</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-chart-3 mx-auto mb-2" />
              <div className="text-2xl font-semibold" data-testid="text-best-rank">{overallStats.bestRank}</div>
              <div className="text-sm text-muted-foreground">Best Rank</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-chart-4 mx-auto mb-2" />
              <div className="text-2xl font-semibold" data-testid="text-study-hours">{overallStats.studyHours}h</div>
              <div className="text-sm text-muted-foreground">Study Hours</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="recent-tests" className="space-y-6">
          <TabsList className="grid w-full lg:w-96 grid-cols-3">
            <TabsTrigger value="recent-tests">Recent Tests</TabsTrigger>
            <TabsTrigger value="subject-analysis">Subject Analysis</TabsTrigger>
            <TabsTrigger value="chapter-breakdown">Chapter Breakdown</TabsTrigger>
          </TabsList>

          <TabsContent value="recent-tests" className="space-y-4">
            {mockTestResults.map((test) => (
              <Card key={test.id} className="hover-elevate">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{test.title}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" data-testid={`badge-date-${test.id}`}>
                        {test.date}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRetakeTest(test.id)}
                        data-testid={`button-retake-${test.id}`}
                      >
                        Retake
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <div className="text-2xl font-semibold text-primary" data-testid={`text-score-${test.id}`}>
                        {test.score}/{test.maxScore}
                      </div>
                      <div className="text-sm text-muted-foreground">Score ({test.percentage}%)</div>
                      <Progress value={test.percentage} className="mt-1" />
                    </div>
                    
                    <div>
                      <div className="text-2xl font-semibold" data-testid={`text-duration-${test.id}`}>
                        {test.duration}min
                      </div>
                      <div className="text-sm text-muted-foreground">Time Taken</div>
                    </div>
                    
                    <div>
                      <div className="text-2xl font-semibold" data-testid={`text-rank-${test.id}`}>
                        {test.rank}
                      </div>
                      <div className="text-sm text-muted-foreground">All India Rank</div>
                    </div>
                    
                    <div>
                      <div className="text-2xl font-semibold" data-testid={`text-percentile-${test.id}`}>
                        {Math.round(((test.totalStudents - test.rank) / test.totalStudents) * 100)}%ile
                      </div>
                      <div className="text-sm text-muted-foreground">Percentile</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="subject-analysis" className="space-y-4">
            <div className="grid gap-4">
              {mockSubjectPerformance.map((subject) => (
                <Card key={subject.subject}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{subject.subject}</span>
                      <Badge variant="secondary" data-testid={`badge-accuracy-${subject.subject.toLowerCase()}`}>
                        {subject.accuracy}% Accuracy
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xl font-semibold" data-testid={`text-subject-score-${subject.subject.toLowerCase()}`}>
                          {subject.score}/{subject.maxScore}
                        </div>
                        <div className="text-sm text-muted-foreground">Score</div>
                        <Progress value={(subject.score / subject.maxScore) * 100} className="mt-2" />
                      </div>
                      
                      <div>
                        <div className="text-xl font-semibold" data-testid={`text-attempts-${subject.subject.toLowerCase()}`}>
                          {subject.attempts}
                        </div>
                        <div className="text-sm text-muted-foreground">Questions Attempted</div>
                      </div>
                      
                      <div>
                        <div className="text-xl font-semibold text-chart-2" data-testid={`text-percentage-${subject.subject.toLowerCase()}`}>
                          {Math.round((subject.score / subject.maxScore) * 100)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Percentage</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="chapter-breakdown" className="space-y-4">
            <div className="grid gap-4">
              {mockChapterAnalysis.map((chapter, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold" data-testid={`text-chapter-${index}`}>{chapter.chapter}</h4>
                        <p className="text-sm text-muted-foreground">{chapter.subject}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={chapter.difficulty === 'Hard' ? 'destructive' : 
                                  chapter.difficulty === 'Medium' ? 'secondary' : 'outline'}
                          data-testid={`badge-difficulty-${index}`}
                        >
                          {chapter.difficulty}
                        </Badge>
                        <span className="text-sm font-medium" data-testid={`text-chapter-accuracy-${index}`}>
                          {chapter.accuracy}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm" data-testid={`text-chapter-score-${index}`}>
                        {chapter.score}/{chapter.maxScore}
                      </span>
                      <Progress value={chapter.accuracy} className="flex-1 mx-4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}