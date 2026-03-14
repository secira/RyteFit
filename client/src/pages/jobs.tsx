import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Plus, 
  Search, 
  Briefcase, 
  MapPin, 
  Clock,
  IndianRupee,
  Trash2,
  Globe,
} from "lucide-react";
import { useLocation } from "wouter";
import { PaginatedResponse, SelectJob } from "@shared/schema";

// Predefined job titles organized by category
const JOB_TITLES = [
  { category: "Top Management", titles: ["Chief Executive Officer", "Chief Marketing Officer", "Chief Technology Officer", "Chief People Officer", "Chief Finance Officer", "Vice President Sales", "Vice President Marketing", "Vice President Technology", "Vice President Operations", "Technical Director"] },
  { category: "Administrative & Office", titles: ["Executive Assistant", "Office Manager", "Receptionist", "Data Entry Clerk", "Administrative Assistant", "Mailroom Clerk", "Facilities Coordinator"] },
  { category: "Customer Service", titles: ["Customer Service Representative", "Call Center Agent", "Help Desk Support Specialist", "Client Services Coordinator"] },
  { category: "Finance & Accounting", titles: ["Accountant", "Accounting Clerk", "Bookkeeper", "Payroll Administrator", "Financial Analyst", "Budget Manager", "Auditor"] },
  { category: "Human Resources", titles: ["HR Manager", "HR Generalist", "HR Coordinator", "Recruiting Manager", "Benefits Specialist", "Onboarding Specialist"] },
  { category: "Technology & IT", titles: ["Software Developer", "IT Manager", "Database Administrator", "Help Desk Specialist", "QA Engineer", "Web Developer", "Network Engineer", "Cybersecurity Analyst"] },
  { category: "Sales & Marketing", titles: ["Sales Representative", "Account Manager", "Marketing Analyst", "Brand Manager", "Business Development Manager", "Digital Marketing Manager"] },
  { category: "Healthcare & Medical", titles: ["Nurse", "Medical Assistant", "Dental Assistant", "Physician", "Medical Coder", "Dental Hygienist"] },
  { category: "Engineering", titles: ["Mechanical Engineer", "Electrical Engineer", "Civil Engineer", "Biomedical Engineer", "Project Engineer", "Systems Engineer"] },
  { category: "Education", titles: ["Teacher", "School Secretary", "Education Program Coordinator", "Admissions Counselor"] },
  { category: "Manufacturing & Operations", titles: ["Production Manager", "Production Supervisor", "Machine Operator", "Quality Control Technician", "Maintenance Technician"] },
  { category: "Logistics & Supply Chain", titles: ["Logistics Manager", "Supply Chain Analyst", "Truck Driver", "Shipping and Receiving Clerk"] },
  { category: "Legal", titles: ["Legal Assistant", "Paralegal", "Contract Attorney", "Compliance Specialist"] },
  { category: "Creative & Media", titles: ["Graphic Designer", "Art Director", "Content Writer", "Multimedia Intern", "Social Media Manager"] },
  { category: "Other Categories", titles: ["Project Coordinator", "Event Planner", "Research Assistant", "Environmental Scientist", "Laboratory Analyst", "Veterinary Technician"] },
];

export default function JobsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const isRecruiter = (user as any)?.role === 'recruiter' || (user as any)?.role === 'company_admin';
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [editJob, setEditJob] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingRequirements, setIsGeneratingRequirements] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<any>(null);
  const [newJob, setNewJob] = useState({
    title: "",
    department: "",
    location: "",
    employmentType: "full_time",
    experienceLevel: "mid",
    salaryMin: "",
    salaryMax: "",
    description: "",
    requirements: "",
  });

  const { data: jobs, isLoading } = useQuery<PaginatedResponse<SelectJob>>({
    queryKey: isRecruiter ? ['/api/jobs/company'] : ['/api/jobs'],
    enabled: !!user,
  });

  // Filter jobs based on search query
  const filteredJobs = jobs?.data?.filter((job: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      job.title?.toLowerCase().includes(searchLower) ||
      job.department?.toLowerCase().includes(searchLower) ||
      job.location?.toLowerCase().includes(searchLower) ||
      job.jobPostingId?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleGenerateDescription = async () => {
    if (!newJob.title) {
      toast({
        title: "Job Title Required",
        description: "Please select a job title before generating with AI.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to use AI generation features.",
        variant: "destructive",
      });
      return;
    }

    if (!isRecruiter) {
      toast({
        title: "Access Denied",
        description: "Only recruiters and company admins can use AI generation features.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const res = await apiRequest('/api/jobs/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title: newJob.title,
          experienceLevel: newJob.experienceLevel,
          employmentType: newJob.employmentType,
        }),
      });
      
      const data = await res.json();
      
      if (data?.description) {
        setNewJob(prev => ({
          ...prev,
          description: data.description,
        }));
        toast({
          title: "Description Generated",
          description: "AI has created a job description for you. Feel free to edit it.",
        });
      } else {
        toast({
          title: "Unexpected Response",
          description: "AI responded but didn't return a description. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Failed to generate description:', error);
      const errorMessage = error?.message || "Could not generate description. Please write it manually.";
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleGenerateRequirements = async () => {
    if (!newJob.title) {
      toast({
        title: "Job Title Required",
        description: "Please select a job title before generating with AI.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to use AI generation features.",
        variant: "destructive",
      });
      return;
    }

    if (!isRecruiter) {
      toast({
        title: "Access Denied",
        description: "Only recruiters and company admins can use AI generation features.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingRequirements(true);
    try {
      const res = await apiRequest('/api/jobs/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title: newJob.title,
          experienceLevel: newJob.experienceLevel,
          employmentType: newJob.employmentType,
        }),
      });
      
      const data = await res.json();
      
      // Ensure requirements is a string
      const requirementsText = typeof data?.requirements === 'string' 
        ? data.requirements 
        : JSON.stringify(data?.requirements || '');
      
      if (requirementsText && requirementsText !== '{}') {
        setNewJob(prev => ({
          ...prev,
          requirements: requirementsText,
        }));
        toast({
          title: "Requirements Generated",
          description: "AI has created job requirements for you. Feel free to edit them.",
        });
      } else {
        toast({
          title: "Unexpected Response",
          description: "AI responded but didn't return requirements. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Failed to generate requirements:', error);
      const errorMessage = error?.message || "Could not generate requirements. Please write them manually.";
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingRequirements(false);
    }
  };

  const createJobMutation = useMutation({
    mutationFn: async (jobData: any) => {
      return await apiRequest('/api/jobs', {
        method: 'POST',
        body: jobData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/company'] });
      toast({
        title: "Job Created",
        description: "Your job posting has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      setNewJob({
        title: "",
        department: "",
        location: "",
        employmentType: "full_time",
        experienceLevel: "mid",
        salaryMin: "",
        salaryMax: "",
        description: "",
        requirements: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: async (jobData: any) => {
      return await apiRequest(`/api/jobs/${editJob.id}`, {
        method: 'PATCH',
        body: jobData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/company'] });
      toast({
        title: "Job Updated",
        description: "Your job posting has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      setEditJob(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return await apiRequest(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/company'] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      toast({
        title: "Job Deleted",
        description: "The job and all related data have been permanently deleted.",
      });
      setIsDeleteDialogOpen(false);
      setJobToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteJob = () => {
    if (jobToDelete) {
      deleteJobMutation.mutate(jobToDelete.id);
    }
  };

  const handleCreateJob = () => {
    if (!newJob.title || !newJob.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in the job title and description.",
        variant: "destructive",
      });
      return;
    }

    const jobData: any = {
      title: newJob.title,
      department: newJob.department || "General",
      location: newJob.location || "Remote",
      employmentType: newJob.employmentType,
      experienceLevel: newJob.experienceLevel,
      description: newJob.description,
      requirements: newJob.requirements || "",
      status: "draft",
    };

    if (newJob.salaryMin && newJob.salaryMax) {
      jobData.salaryMin = parseInt(newJob.salaryMin);
      jobData.salaryMax = parseInt(newJob.salaryMax);
    }

    createJobMutation.mutate(jobData);
  };

  const handleUpdateJob = () => {
    if (!editJob.title || !editJob.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in the job title and description.",
        variant: "destructive",
      });
      return;
    }

    const jobData: any = {
      title: editJob.title,
      department: editJob.department || "General",
      location: editJob.location || "Remote",
      employmentType: editJob.employmentType,
      experienceLevel: editJob.experienceLevel,
      description: editJob.description,
      requirements: editJob.requirements || "",
      status: editJob.status || "draft",
    };

    if (editJob.salaryMin && editJob.salaryMax) {
      jobData.salaryMin = parseInt(editJob.salaryMin);
      jobData.salaryMax = parseInt(editJob.salaryMax);
    }

    updateJobMutation.mutate(jobData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-jobs-title">
            Job Creation
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage job postings for your company
          </p>
        </div>
        {isRecruiter && (
          <Button onClick={() => setIsCreateDialogOpen(true)} size="lg" data-testid="button-create-job">
            <Plus className="h-5 w-5 mr-2" />
            Create New Job
          </Button>
        )}
      </div>

      {/* Jobs Section */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Job</CardTitle>
          <CardDescription>
            Create new job postings for your company
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobs?.data && jobs.data.length > 0 && (
            <div className="mb-4 flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by job title, department, location, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-jobs"
                  className="pl-10"
                />
              </div>
            </div>
          )}
          {!jobs?.data?.length ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No jobs posted yet
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first job posting to start recruiting
              </p>
              {isRecruiter && (
                <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-job">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Job
                </Button>
              )}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No jobs found
              </h3>
              <p className="text-muted-foreground text-center">
                Try adjusting your search filters
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Job ID</TableHead>
                    <TableHead className="min-w-[200px]">Job Title</TableHead>
                    <TableHead className="min-w-[150px]">Department</TableHead>
                    <TableHead className="min-w-[120px]">Location</TableHead>
                    <TableHead className="min-w-[120px]">Status</TableHead>
                    <TableHead className="min-w-[130px]">Platforms</TableHead>
                    <TableHead className="min-w-[140px]">Date Posted</TableHead>
                    <TableHead className="text-right min-w-[180px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs?.map((job: any) => {
                    const createdDate = new Date(job.createdAt);
                    
                    return (
                      <TableRow key={job.id} className="hover-elevate" data-testid={`row-job-${job.id}`}>
                        <TableCell>
                          <div className="font-mono text-primary font-semibold" data-testid={`text-job-id-${job.id}`}>
                            {job.jobPostingId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{job.title}</div>
                          <div className="text-sm text-muted-foreground capitalize">{job.employmentType?.replace('_', ' ')}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{job.department || 'N/A'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{job.location}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={job.status === 'published' ? 'default' : 'secondary'}
                            data-testid={`badge-status-${job.id}`}
                          >
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {job.platformPostingCount > 0 ? (
                            <div className="flex items-center gap-1" data-testid={`platforms-${job.id}`}>
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{job.platformPostingCount}</span>
                              {job.latestPostedAt && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({new Date(job.latestPostedAt).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short'
                                  })})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground" data-testid={`platforms-${job.id}`}>-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {createdDate.toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              data-testid={`button-view-job-${job.id}`}
                              onClick={() => {
                                setSelectedJob(job);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              View Details
                            </Button>
                            {isRecruiter && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  data-testid={`button-edit-job-${job.id}`}
                                  onClick={() => {
                                    setEditJob({...job});
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-destructive"
                                  data-testid={`button-delete-job-${job.id}`}
                                  onClick={() => {
                                    setJobToDelete(job);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Job Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Job: {editJob?.jobPostingId}</DialogTitle>
            <DialogDescription>
              Update job posting details
            </DialogDescription>
          </DialogHeader>

          {editJob && (
            <div className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Job Title</Label>
                  <p className="text-sm text-muted-foreground">{editJob.title}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <Input
                    id="edit-department"
                    value={editJob.department || ''}
                    onChange={(e) => setEditJob({ ...editJob, department: e.target.value })}
                    data-testid="input-edit-department"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={editJob.location || ''}
                    onChange={(e) => setEditJob({ ...editJob, location: e.target.value })}
                    data-testid="input-edit-location"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-employment">Employment Type</Label>
                  <p className="text-sm text-muted-foreground capitalize">{editJob.employmentType?.replace('_', ' ')}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-salary-min">Min Salary (₹)</Label>
                  <Input
                    id="edit-salary-min"
                    type="number"
                    value={editJob.salaryMin || ''}
                    onChange={(e) => setEditJob({ ...editJob, salaryMin: e.target.value })}
                    data-testid="input-edit-salary-min"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-salary-max">Max Salary (₹)</Label>
                  <Input
                    id="edit-salary-max"
                    type="number"
                    value={editJob.salaryMax || ''}
                    onChange={(e) => setEditJob({ ...editJob, salaryMax: e.target.value })}
                    data-testid="input-edit-salary-max"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Job description..."
                  rows={8}
                  value={editJob.description || ''}
                  onChange={(e) => setEditJob({ ...editJob, description: e.target.value })}
                  data-testid="textarea-edit-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-requirements">Requirements</Label>
                <Textarea
                  id="edit-requirements"
                  placeholder="Job requirements..."
                  rows={8}
                  value={editJob.requirements || ''}
                  onChange={(e) => setEditJob({ ...editJob, requirements: e.target.value })}
                  data-testid="textarea-edit-requirements"
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Job Status</Label>
                  <p className="text-xs text-muted-foreground mb-2">Only Active jobs can be posted publicly</p>
                  <Select
                    value={editJob.status || 'draft'}
                    onValueChange={(value) => setEditJob({ ...editJob, status: value })}
                  >
                    <SelectTrigger id="edit-status" data-testid="select-edit-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft - Under Preparation</SelectItem>
                      <SelectItem value="active">Active - Ready to Post</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateJob}
              disabled={updateJobMutation.isPending}
              data-testid="button-save-edit"
            >
              {updateJobMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Job Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedJob?.jobPostingId} - {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              Job posting details and information
            </DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Job Title</Label>
                  <p className="text-sm font-medium">{selectedJob.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Department</Label>
                  <p className="text-sm font-medium">{selectedJob.department || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Location</Label>
                  <p className="text-sm font-medium">{selectedJob.location}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Employment Type</Label>
                  <p className="text-sm font-medium capitalize">{selectedJob.employmentType?.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Experience Level</Label>
                  <p className="text-sm font-medium capitalize">{selectedJob.experienceLevel}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Status</Label>
                  <Badge variant={selectedJob.status === 'published' ? 'default' : 'secondary'} className="mt-1">
                    {selectedJob.status}
                  </Badge>
                </div>
              </div>

              {(selectedJob.salaryMin || selectedJob.salaryMax) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Min Salary</Label>
                    <p className="text-sm font-medium">₹{selectedJob.salaryMin?.toLocaleString('en-IN') || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Max Salary</Label>
                    <p className="text-sm font-medium">₹{selectedJob.salaryMax?.toLocaleString('en-IN') || '-'}</p>
                  </div>
                </div>
              )}

              {selectedJob.description && (
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Description</Label>
                  <p className="text-sm whitespace-pre-wrap">{selectedJob.description}</p>
                </div>
              )}

              {selectedJob.requirements && (
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Requirements</Label>
                  <p className="text-sm whitespace-pre-wrap">{selectedJob.requirements}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Created Date</Label>
                <p className="text-sm font-medium">
                  {new Date(selectedJob.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Job Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new job posting. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Select
                  value={newJob.title}
                  onValueChange={(value) => setNewJob({ ...newJob, title: value })}
                  disabled={isGeneratingDescription}
                >
                  <SelectTrigger id="title" data-testid="select-job-title">
                    <SelectValue placeholder="Select a job title" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    {JOB_TITLES.map((category) => (
                      <div key={category.category}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          {category.category}
                        </div>
                        {category.titles.map((title) => (
                          <SelectItem key={title} value={title}>
                            {title}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="e.g., Engineering"
                  value={newJob.department}
                  onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                  data-testid="input-job-department"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Remote, San Francisco"
                  value={newJob.location}
                  onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                  data-testid="input-job-location"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type</Label>
                <Select
                  value={newJob.employmentType}
                  onValueChange={(value) => setNewJob({ ...newJob, employmentType: value })}
                >
                  <SelectTrigger id="employmentType" data-testid="select-employment-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full-time</SelectItem>
                    <SelectItem value="part_time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="experienceLevel">Experience Level</Label>
                <Select
                  value={newJob.experienceLevel}
                  onValueChange={(value) => setNewJob({ ...newJob, experienceLevel: value })}
                >
                  <SelectTrigger id="experienceLevel" data-testid="select-experience-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry</SelectItem>
                    <SelectItem value="mid">Mid</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryMin">Min Annual Salary (₹)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="salaryMin"
                    type="number"
                    placeholder="80000"
                    className="pl-10"
                    value={newJob.salaryMin}
                    onChange={(e) => setNewJob({ ...newJob, salaryMin: e.target.value })}
                    data-testid="input-salary-min"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryMax">Max Annual Salary (₹)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="salaryMax"
                    type="number"
                    placeholder="120000"
                    className="pl-10"
                    value={newJob.salaryMax}
                    onChange={(e) => setNewJob({ ...newJob, salaryMax: e.target.value })}
                    data-testid="input-salary-max"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Job Description *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateDescription}
                  disabled={isGeneratingDescription || !newJob.title}
                  data-testid="button-ai-generate-description"
                  className="gap-2"
                >
                  {isGeneratingDescription ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      AI Generate
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="description"
                placeholder="Describe the role, responsibilities, and what makes this position great..."
                rows={8}
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                disabled={isGeneratingDescription}
                data-testid="textarea-job-description"
              />
              {isGeneratingDescription && (
                <p className="text-xs text-muted-foreground">
                  AI is generating a professional job description...
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="requirements">Requirements</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateRequirements}
                  disabled={isGeneratingRequirements || !newJob.title}
                  data-testid="button-ai-generate-requirements"
                  className="gap-2"
                >
                  {isGeneratingRequirements ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      AI Generate
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="requirements"
                placeholder="List the required skills, experience, and qualifications..."
                rows={8}
                value={newJob.requirements}
                onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                disabled={isGeneratingRequirements}
                data-testid="textarea-job-requirements"
              />
              {isGeneratingRequirements && (
                <p className="text-xs text-muted-foreground">
                  AI is generating professional job requirements...
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              data-testid="button-cancel-job"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateJob}
              disabled={createJobMutation.isPending}
              data-testid="button-submit-job"
            >
              {createJobMutation.isPending ? "Creating..." : "Create Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Job Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Posting</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-3">
                  Are you sure you want to delete <strong>{jobToDelete?.title}</strong> ({jobToDelete?.jobPostingId})?
                </p>
                <p className="text-destructive font-medium mb-2">
                  This action cannot be undone. All related data will be permanently deleted, including:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>All applications for this job</li>
                  <li>All interview sessions and recordings</li>
                  <li>All candidate evaluations and scores</li>
                  <li>All screening results</li>
                  <li>All selection decisions</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setJobToDelete(null);
              }}
              data-testid="button-cancel-delete"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteJob}
              className="bg-destructive text-destructive-foreground"
              disabled={deleteJobMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteJobMutation.isPending ? "Deleting..." : "Delete Job"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
