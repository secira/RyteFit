import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Target, Clock, User } from "lucide-react";

// Types for leaderboard data
interface LeaderboardUser {
  id: string;
  name: string;
  profileImageUrl?: string;
  rank: number;
  totalScore: number;
  testsGiven: number;
  percentile: number;
  examType: string;
}


const LeaderboardCard = ({ user, timeFilter }: { user: LeaderboardUser; timeFilter: string }) => {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  return (
    <Card className="mb-4 hover-elevate" data-testid={`leaderboard-card-${user.id}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Rank Icon */}
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              {getRankIcon(user.rank)}
            </div>
            
            {/* User Info */}
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.profileImageUrl} />
                <AvatarFallback>
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg" data-testid={`text-username-${user.id}`}>
                  {user.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {user.examType} Preparation
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="flex items-center space-x-1">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Score</span>
              </div>
              <p className="text-2xl font-bold" data-testid={`text-score-${user.id}`}>
                {user.totalScore}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center space-x-1">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Tests</span>
              </div>
              <p className="text-2xl font-bold" data-testid={`text-tests-${user.id}`}>
                {user.testsGiven}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Percentile</span>
              </div>
              <p className="text-2xl font-bold" data-testid={`text-percentile-${user.id}`}>
                {user.percentile}%
              </p>
            </div>
          </div>
        </div>

        {/* Rank Badge */}
        <div className="mt-4 flex justify-between items-center">
          <Badge variant={user.rank <= 3 ? "default" : "secondary"} className="px-3 py-1">
            Rank #{user.rank}
          </Badge>
          <Badge variant="outline">
            Top {(100 - user.percentile).toFixed(1)}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default function LeaderboardPage() {
  // Get URL parameters for test-specific leaderboards
  const urlParams = new URLSearchParams(window.location.search);
  const examTypeFromUrl = urlParams.get('examType') || 'neet';
  const examIdFromUrl = urlParams.get('examId');
  
  const [selectedTab, setSelectedTab] = useState(examTypeFromUrl);
  const [timeFilter, setTimeFilter] = useState("overall");

  // Fetch leaderboard data from API
  const { data: leaderboardData, isLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ['/api/leaderboard', selectedTab, timeFilter, examIdFromUrl],
    queryFn: async () => {
      const params = new URLSearchParams({
        examType: selectedTab,
        timeFilter: timeFilter,
      });
      
      // Add examId for specific national test leaderboards
      if (examIdFromUrl && (selectedTab === 'national-neet' || selectedTab === 'national-jee')) {
        params.append('examId', examIdFromUrl);
      }
      
      const response = await fetch(`/api/leaderboard?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-leaderboard-title">
          <Trophy className="inline-block h-8 w-8 mr-2" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground">
          See your ranking among thousands of students across different exam types
        </p>
      </div>

      {/* Time Filter */}
      <div className="mb-6">
        <div className="flex space-x-2">
          {["week", "month", "overall"].map((filter) => (
            <Button
              key={filter}
              variant={timeFilter === filter ? "default" : "outline"}
              onClick={() => setTimeFilter(filter)}
              data-testid={`button-time-filter-${filter}`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Exam Type Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="neet" data-testid="tab-neet">
            NEET
          </TabsTrigger>
          <TabsTrigger value="jee" data-testid="tab-jee">
            JEE
          </TabsTrigger>
          <TabsTrigger value="national-neet" data-testid="tab-national-neet">
            National NEET
          </TabsTrigger>
          <TabsTrigger value="national-jee" data-testid="tab-national-jee">
            National JEE
          </TabsTrigger>
        </TabsList>

        {/* Leaderboard Content */}
        {["neet", "jee", "national-neet", "national-jee"].map((examType) => (
          <TabsContent key={examType} value={examType} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5" />
                  <span>
                    {examType === "neet" ? "NEET" : 
                     examType === "jee" ? "JEE" :
                     examType === "national-neet" ? "National NEET Test" :
                     "National JEE Test"} Leaderboard
                  </span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {timeFilter === "week" ? "This Week" : 
                   timeFilter === "month" ? "This Month" : 
                   "All Time"} Rankings
                </p>
              </CardHeader>
              <CardContent>
                {leaderboardData && leaderboardData.length > 0 ? (
                  <div className="space-y-4">
                    {leaderboardData.map((user: LeaderboardUser) => (
                      <LeaderboardCard 
                        key={user.id} 
                        user={user} 
                        timeFilter={timeFilter}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No rankings yet</h3>
                    <p className="text-muted-foreground">
                      Take some tests to see your ranking on the leaderboard!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Call to Action */}
      <Card className="mt-8">
        <CardContent className="p-6 text-center">
          <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            Want to climb the ranks?
          </h3>
          <p className="text-muted-foreground mb-4">
            Take more practice tests and improve your scores to reach the top of the leaderboard!
          </p>
          <div className="flex justify-center space-x-4">
            <Button asChild data-testid="button-start-practice">
              <a href="/practice-tests/neet">Start Practice Test</a>
            </Button>
            <Button variant="outline" asChild data-testid="button-view-analytics">
              <a href="/dashboard">View Analytics</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}