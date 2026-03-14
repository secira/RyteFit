import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Users, Briefcase, Video, TrendingUp, Building2, UserCog } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginatedResponse, SelectUser, SelectJob, SelectApplication } from "@shared/schema";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  const { data: users } = useQuery<PaginatedResponse<SelectUser>>({
    queryKey: ['/api/users'],
  });

  const { data: jobs } = useQuery<PaginatedResponse<SelectJob>>({
    queryKey: ['/api/jobs'],
  });

  const { data: applications } = useQuery<PaginatedResponse<SelectApplication>>({
    queryKey: ['/api/applications'],
  });

  if (statsLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const candidateCount = users?.data?.filter((u: any) => u.role === 'candidate').length || 0;
  const companyCount = users?.data?.filter((u: any) => u.role === 'company_admin' || u.role === 'recruiter').length || 0;
  const totalInterviews = applications?.data?.filter((a: any) => a.status === 'interviewed' || a.status === 'interview_scheduled').length || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-admin-dashboard-title">
            Platform Administration
          </h1>
          <p className="text-muted-foreground">Monitor and manage the RyteFit platform</p>
        </div>
        <Badge variant="default" data-testid="badge-admin-role">Administrator</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-stat-users">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-users">
              {users?.data?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {candidateCount} candidates, {companyCount} recruiters
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-companies">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-company-count">
              {stats?.totalCompanies || companyCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered companies
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-jobs">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-jobs-count">
              {jobs?.data?.filter((j: any) => j.status === 'active' || j.status === 'posted').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total: {jobs?.data?.length || 0} jobs
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-interviews">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-interviews-count">
              {totalInterviews}
            </div>
            <p className="text-xs text-muted-foreground">
              Total conducted
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/users">
          <Card className="hover-elevate cursor-pointer h-full" data-testid="card-link-users">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Manage user accounts, roles, and permissions across the platform.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{users?.data?.length || 0}</span>
                <Badge variant="outline">Users</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="hover-elevate cursor-pointer h-full" data-testid="card-link-companies">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Monitor company accounts, subscription tiers, and usage statistics.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{stats?.totalCompanies || companyCount}</span>
              <Badge variant="outline">Companies</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer h-full" data-testid="card-link-analytics">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Platform Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              View platform-wide metrics, usage trends, and performance data.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{applications?.data?.length || 0}</span>
              <Badge variant="outline">Applications</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/users">
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 w-full"
              data-testid="button-manage-users"
            >
              <Users className="h-6 w-6" />
              <span>Manage Users</span>
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="h-24 flex flex-col gap-2"
            data-testid="button-manage-roles"
          >
            <UserCog className="h-6 w-6" />
            <span>Manage Roles</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex flex-col gap-2"
            data-testid="button-platform-settings"
          >
            <TrendingUp className="h-6 w-6" />
            <span>Platform Settings</span>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {applications?.data && applications.data.length > 0 ? (
              applications.data.slice(0, 5).map((app: any) => (
                <div key={app.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {app.candidate?.firstName} {app.candidate?.lastName} applied for {app.job?.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(app.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {app.status.replace("_", " ")}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}