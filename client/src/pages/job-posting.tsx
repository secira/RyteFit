import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, CheckCircle2, Clock, XCircle, Plus, Eye, Edit2, Briefcase, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PaginatedResponse, SelectJob } from "@shared/schema";

const POSTING_PLATFORMS = [
  { id: 'rytefit', name: 'RyteFit Career Site', active: true },
  { id: 'linkedin', name: 'LinkedIn', active: false },
  { id: 'indeed', name: 'Indeed', active: false },
];

export default function JobPosting() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedJobForPost, setSelectedJobForPost] = useState<SelectJob | null>(null);
  const [selectedJobForView, setSelectedJobForView] = useState<SelectJob | null>(null);
  const [postedJobs, setPostedJobs] = useState<Map<string, { platforms: { platform: string; postedAt: string }[] }>>(new Map());
  
  const { data: jobsData, isLoading } = useQuery<PaginatedResponse<SelectJob>>({
    queryKey: ['/api/jobs/company'],
  });

  const jobs = jobsData?.data || [];

  // Fetch platform postings for all jobs
  const { data: platformPostingsMap } = useQuery({
    queryKey: ['/api/jobs/platform-postings', jobs.map(j => j.id).join(',')],
    enabled: jobs.length > 0,
    queryFn: async () => {
      const map = new Map();
      for (const job of jobs) {
        try {
          const response = await fetch(`/api/jobs/${job.id}/platform-postings`);
          if (response.ok) {
            const postings = await response.json();
            map.set(job.id, postings);
          }
        } catch (e) {
          console.error('Error fetching postings for job', job.id, e);
        }
      }
      return map;
    },
  });

  // Mutation for creating platform posting
  const createPostingMutation = useMutation({
    mutationFn: async ({ jobId, platformName, platformSlug }: { jobId: string; platformName: string; platformSlug: string }) => {
      const response = await apiRequest(`/api/jobs/${jobId}/platform-postings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformName, platformSlug }),
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/company'] });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/platform-postings'] });
    },
  });

  const handlePostJob = async () => {
    if (!selectedJobForPost) return;

    // Check if job is active
    if (selectedJobForPost.status !== 'active') {
      toast({
        title: "Cannot Post Job",
        description: "Only jobs with Active status can be posted. Please update the job status to Active in the Job Creation page.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createPostingMutation.mutateAsync({
        jobId: selectedJobForPost.id,
        platformName: 'RyteFit Career Site',
        platformSlug: 'rytefit',
      });
      
      toast({
        title: "Job Posted",
        description: `${selectedJobForPost.title} has been posted to RyteFit Career Site.`,
      });
      setIsPostDialogOpen(false);
      setSelectedJobForPost(null);
    } catch (error: any) {
      toast({
        title: "Failed to Post Job",
        description: error.message || "An error occurred while posting the job.",
        variant: "destructive",
      });
    }
  };

  const isJobPosted = (jobId: string) => {
    const platformPostings = platformPostingsMap?.get(jobId);
    return platformPostings && platformPostings.length > 0;
  };
  
  const getPostedPlatforms = (jobId: string) => {
    const platformPostings = platformPostingsMap?.get(jobId) || [];
    return platformPostings.map((p: any) => {
      // Handle both camelCase (from API) and snake_case (from DB) field names
      const postedAtValue = p.postedAt || p.posted_at;
      return {
        platform: p.platform,
        postedAt: postedAtValue,
        applications: p.applications || 0,
        expiresAt: p.expiresAt || p.expires_at,
        cost: p.metadata?.cost,
      };
    });
  };

  const formatDate = (date?: string | null | Date) => {
    if (!date) return '-';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString?: string | Date | null) => {
    if (!dateString) return '-';
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return '-';
    }
  };

  // Filter jobs based on search
  const filteredJobs = jobs.filter(job => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (job.jobPostingId?.toLowerCase() || "").includes(query) ||
      (job.title?.toLowerCase() || "").includes(query) ||
      (job.location?.toLowerCase() || "").includes(query) ||
      (job.department?.toLowerCase() || "").includes(query)
    );
  });

  // Calculate stats
  const totalJobs = jobs.length;
  // Count jobs with 'active' OR 'published' status as published (active is the standard published status)
  const publishedJobs = jobs.filter(j => j.status === 'published' || j.status === 'active').length;
  const pendingJobs = jobs.filter(j => j.status === 'pending' || j.status === 'draft').length;
  const failedJobs = jobs.filter(j => j.status === 'failed').length;

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'published':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Published
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-job-posting">
            Job Postings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage job postings across platforms
          </p>
        </div>
        <Button 
          variant="default"
          size="sm"
          data-testid="button-create-job"
          onClick={() => setLocation('/jobs')}
        >
          <Plus className="w-4 h-4 mr-1" />
          Create New Job
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {totalJobs}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All positions</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {publishedJobs}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active listings</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {pendingJobs}
            </div>
            <p className="text-xs text-muted-foreground mt-1">In draft</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {failedJobs}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Needs retry</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Job ID, Title, Location, or Department..."
            className="pl-10"
            data-testid="input-search-jobs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Job Listings</CardTitle>
          <CardDescription>All jobs created for your company</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "No matching jobs found" : "Create a job to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Job ID</TableHead>
                    <TableHead className="min-w-[200px]">Job Title</TableHead>
                    <TableHead className="min-w-[140px]">Platforms Posted</TableHead>
                    <TableHead className="min-w-[130px]">Posted Date</TableHead>
                    <TableHead className="min-w-[130px]">Applications</TableHead>
                    <TableHead className="text-center min-w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map((job) => (
                    <TableRow key={job.id} className="hover-elevate" data-testid={`row-job-${job.id}`}>
                      <TableCell className="font-mono font-semibold text-sm text-primary">
                        {job.jobPostingId || '-'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {job.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-primary">{getPostedPlatforms(job.id).length}</span>
                          <span className="text-sm text-muted-foreground">
                            {getPostedPlatforms(job.id).length === 1 ? 'platform' : 'platforms'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getPostedPlatforms(job.id).length > 0
                          ? formatDate(getPostedPlatforms(job.id)[0].postedAt)
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-lg">{job.applicationsCount || 0}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-center flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid={`button-view-${job.id}`}
                            onClick={() => {
                              setSelectedJobForView(job);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            data-testid={`button-post-${job.id}`}
                            onClick={() => {
                              setSelectedJobForPost(job);
                              setIsPostDialogOpen(true);
                            }}
                            disabled={postedJobs.has(job.id)}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            {postedJobs.has(job.id) ? 'Posted' : 'Post'}
                          </Button>
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

      {/* View Job Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Details: {selectedJobForView?.jobPostingId}</DialogTitle>
            <DialogDescription>
              {selectedJobForView?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedJobForView && (
            <div className="space-y-6 py-4">
              {/* Job Info */}
              <div>
                <h4 className="font-medium text-sm mb-3">Job Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Department</span>
                    <p className="font-medium mt-1">{selectedJobForView.department || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location</span>
                    <p className="font-medium mt-1">{selectedJobForView.location || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created Date</span>
                    <p className="font-medium mt-1">{formatDate(selectedJobForView.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <div className="mt-1">{getStatusBadge(selectedJobForView.status || 'draft')}</div>
                  </div>
                </div>
              </div>

              {/* Posted Platforms */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-3">Posted Platforms</h4>
                {getPostedPlatforms(selectedJobForView.id).length > 0 ? (
                  <div className="space-y-2">
                    {getPostedPlatforms(selectedJobForView.id).map((posting: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-md border">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="font-medium">
                            {posting.platform === 'rytefit' ? 'RyteFit Career Site' : posting.platform}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDateTime(posting.postedAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Not posted yet</p>
                  </div>
                )}
              </div>

              {/* Applications */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-3">Applications</h4>
                <div className="text-center py-2">
                  <p className="text-3xl font-bold text-primary">{selectedJobForView.applicationsCount || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">Applications received</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} data-testid="button-close-view">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post Job Dialog */}
      <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Post Job: {selectedJobForPost?.jobPostingId}</DialogTitle>
            <DialogDescription>
              {selectedJobForPost?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Posting Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium">{selectedJobForPost?.department || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">{selectedJobForPost?.location || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Applications:</span>
                  <span className="font-medium">{selectedJobForPost?.applicationsCount || 0}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-sm mb-3">Select Platforms</h4>
              <div className="space-y-2">
                {POSTING_PLATFORMS.map((platform) => (
                  <div
                    key={platform.id}
                    className={`flex items-center gap-3 p-3 rounded-md border transition-all ${
                      platform.active
                        ? 'border-primary bg-primary/5 cursor-pointer hover-elevate'
                        : 'border-muted bg-muted/30 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={platform.id === 'rytefit'}
                      disabled={!platform.active}
                      onChange={() => {}}
                      className="h-4 w-4"
                      data-testid={`checkbox-platform-${platform.id}`}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{platform.name}</div>
                      {!platform.active && (
                        <div className="text-xs text-muted-foreground">
                          Coming soon
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPostDialogOpen(false)} data-testid="button-cancel-post">
              Cancel
            </Button>
            <Button
              onClick={handlePostJob}
              disabled={isJobPosted(selectedJobForPost?.id || '')}
              data-testid="button-confirm-post"
            >
              {isJobPosted(selectedJobForPost?.id || '') ? 'Already Posted' : 'Post to RyteFit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
