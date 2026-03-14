import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Building2, Users, Briefcase, Video, TrendingUp } from "lucide-react";
import { RoleGate } from "@/components/RoleGate";

export default function AdminAnalyticsPage() {
  return (
    <RoleGate allowedRoles={['admin']}>
      <AdminAnalyticsContent />
    </RoleGate>
  );
}

function AdminAnalyticsContent() {
  const { user } = useAuth();
  const userRole = (user as any)?.role;

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/admin/analytics'],
    enabled: !!user && userRole === 'admin',
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const platformMetrics = [
    {
      title: "Total Companies",
      value: analytics?.totalCompanies || 0,
      icon: Building2,
      description: "Registered companies",
      trend: "+5%",
    },
    {
      title: "Total Users",
      value: analytics?.totalUsers || 0,
      icon: Users,
      description: "Platform users",
      trend: "+18%",
    },
    {
      title: "Total Jobs",
      value: analytics?.totalJobs || 0,
      icon: Briefcase,
      description: "Active job postings",
      trend: "+12%",
    },
    {
      title: "Total Interviews",
      value: analytics?.totalInterviews || 0,
      icon: Video,
      description: "Conducted interviews",
      trend: "+25%",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-admin-analytics-title">Platform Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Monitor platform-wide performance and growth
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {platformMetrics.map((metric) => {
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Platform Activity</CardTitle>
            <CardDescription>Recent platform events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New company registered</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">50+ new users today</p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <Video className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">100+ interviews conducted</p>
                  <p className="text-xs text-muted-foreground">This week</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Growth Metrics</CardTitle>
            <CardDescription>Platform growth trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Monthly Active Users</p>
                  <p className="text-xs text-muted-foreground">2,450 users</p>
                </div>
                <span className="text-sm text-green-500">+18%</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Interview Completion Rate</p>
                  <p className="text-xs text-muted-foreground">87%</p>
                </div>
                <span className="text-sm text-green-500">+5%</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Average Response Time</p>
                  <p className="text-xs text-muted-foreground">2.3 days</p>
                </div>
                <span className="text-sm text-green-500">-0.5 days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
