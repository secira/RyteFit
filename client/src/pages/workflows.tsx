import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  FileText,
  Globe,
  UserSearch,
  Video,
  TrendingUp,
  Bell,
  Play,
  Settings,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
  BarChart3,
  Search,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PaginatedResponse, SelectApplication } from "@shared/schema";

// Agent workflow configurations
const AGENT_WORKFLOWS = [
  {
    id: "job_creation",
    name: "Job Creation Agent",
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    description: "AI-assisted job description generation",
    configFields: [
      { id: "tone", label: "Job Description Tone", type: "select", options: ["professional", "casual", "enthusiastic", "technical"], defaultValue: "professional" },
      { id: "detailLevel", label: "Detail Level", type: "select", options: ["brief", "detailed", "comprehensive"], defaultValue: "detailed" },
      { id: "includeSkills", label: "Auto-Extract Skills", type: "checkbox", defaultValue: "true" },
    ]
  },
  {
    id: "job_posting",
    name: "Job Posting Agent",
    icon: Globe,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    description: "Multi-platform job distribution automation",
    configFields: [
      { id: "platforms", label: "Target Platforms", type: "text", defaultValue: "LinkedIn, Indeed" },
      { id: "postingSchedule", label: "Posting Schedule", type: "select", options: ["immediate", "scheduled", "recurring"], defaultValue: "immediate" },
    ]
  },
  {
    id: "resume_screening",
    name: "Resume Screening Agent",
    icon: UserSearch,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    description: "AI-powered resume analysis and candidate ranking",
    configFields: [
      { id: "matchThreshold", label: "Match Score Threshold (%)", type: "number", defaultValue: "70" },
      { id: "skillWeighting", label: "Skills Weighting (%)", type: "number", defaultValue: "40" },
      { id: "experienceWeighting", label: "Experience Weighting (%)", type: "number", defaultValue: "35" },
      { id: "educationWeighting", label: "Education Weighting (%)", type: "number", defaultValue: "25" },
    ]
  },
  {
    id: "interview_evaluation",
    name: "Interview Evaluation Agent",
    icon: Video,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
    description: "Automated interview transcription and evaluation",
    configFields: [
      { id: "transcriptionModel", label: "Transcription Model", type: "select", options: ["whisper-1", "whisper-large"], defaultValue: "whisper-1" },
      { id: "evaluationModel", label: "Evaluation Model", type: "select", options: ["gpt-4", "gpt-4-turbo"], defaultValue: "gpt-4" },
      { id: "technicalWeight", label: "Technical Score Weight (%)", type: "number", defaultValue: "40" },
      { id: "communicationWeight", label: "Communication Score Weight (%)", type: "number", defaultValue: "30" },
      { id: "problemSolvingWeight", label: "Problem Solving Weight (%)", type: "number", defaultValue: "30" },
    ]
  },
  {
    id: "candidate_ranking",
    name: "Candidate Ranking Agent",
    icon: TrendingUp,
    color: "text-teal-600",
    bgColor: "bg-teal-50 dark:bg-teal-950/20",
    description: "Multi-dimensional candidate comparison and ranking",
    configFields: [
      { id: "rankingCriteria", label: "Primary Ranking Criteria", type: "select", options: ["overall_score", "technical_skills", "cultural_fit", "experience"], defaultValue: "overall_score" },
      { id: "minCandidates", label: "Minimum Candidates to Rank", type: "number", defaultValue: "3" },
      { id: "autoShortlist", label: "Auto-Shortlist Top N", type: "number", defaultValue: "5" },
    ]
  },
  {
    id: "notification",
    name: "Notification Agent",
    icon: Bell,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    description: "Automated candidate and recruiter notifications",
    configFields: [
      { id: "notifyOnStage", label: "Notify On Stage Change", type: "checkbox", defaultValue: "true" },
      { id: "emailTemplate", label: "Email Template", type: "select", options: ["default", "friendly", "formal"], defaultValue: "default" },
      { id: "notifyRecruiters", label: "Notify Recruiters", type: "checkbox", defaultValue: "true" },
    ]
  },
];

// Workflow step definitions for tracking
const WORKFLOW_STEPS = [
  {
    id: 1,
    name: "Job Creation",
    icon: FileText,
    color: "text-blue-600",
  },
  {
    id: 2,
    name: "Job Posting",
    icon: Globe,
    color: "text-purple-600",
  },
  {
    id: 3,
    name: "Resume Screening",
    icon: UserSearch,
    color: "text-yellow-600",
  },
  {
    id: 4,
    name: "Interview Evaluation",
    icon: Video,
    color: "text-indigo-600",
  },
  {
    id: 5,
    name: "Candidate Ranking",
    icon: TrendingUp,
    color: "text-teal-600",
  },
  {
    id: 6,
    name: "Reporting & Notification",
    icon: Bell,
    color: "text-green-600",
  },
];

// Determine workflow step status based on application data
function getWorkflowStepStatus(application: any, stepId: number): 'completed' | 'pending' | 'in_progress' {
  switch (stepId) {
    case 1: // Job Creation
      return application.job ? 'completed' : 'pending';
    case 2: // Job Posting
      return application.job?.status === 'active' ? 'completed' : 'pending';
    case 3: // Resume Screening
      if (application.screenedAt) return 'completed';
      if (application.screeningStatus === 'pending') return 'in_progress';
      return 'pending';
    case 4: // Interview Evaluation
      if (application.evaluatedAt) return 'completed';
      if (application.status === 'interviewing') return 'in_progress';
      return 'pending';
    case 5: // Candidate Ranking
      return application.finalRank ? 'completed' : 'pending';
    case 6: // Reporting & Notification
      return application.status === 'offer_sent' ? 'completed' : 'pending';
    default:
      return 'pending';
  }
}

function getStatusIcon(status: 'completed' | 'pending' | 'in_progress') {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case 'in_progress':
      return <Clock className="w-4 h-4 text-blue-600 animate-pulse" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
}

export default function WorkflowsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const userRole = (user as any)?.role;
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [workflowConfig, setWorkflowConfig] = useState<Record<string, any>>({});
  const [executionMode, setExecutionMode] = useState<"single" | "batch">("single");
  const [workflowSearchQuery, setWorkflowSearchQuery] = useState("");

  const selectedAgent = AGENT_WORKFLOWS.find(w => w.id === selectedWorkflow);

  // Fetch applications for workflow status tracking
  const { data: applicationsData } = useQuery<PaginatedResponse<SelectApplication>>({
    queryKey: ['/api/applications'],
    enabled: !!user && (userRole === 'recruiter' || userRole === 'company_admin'),
  });

  const applications = applicationsData?.data || [];

  // Filter applications based on search query
  const filteredApplications = applications.filter((app: any) => {
    if (!workflowSearchQuery) return true;
    const searchLower = workflowSearchQuery.toLowerCase();
    return (
      app.job?.jobPostingId?.toLowerCase().includes(searchLower) ||
      app.candidate?.firstName?.toLowerCase().includes(searchLower) ||
      app.candidate?.lastName?.toLowerCase().includes(searchLower) ||
      app.job?.title?.toLowerCase().includes(searchLower)
    );
  });

  const handleConfigChange = (fieldId: string, value: any) => {
    setWorkflowConfig(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleExecuteWorkflow = () => {
    if (!selectedWorkflow) {
      toast({
        title: "No workflow selected",
        description: "Please select a workflow to execute",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Workflow Executing",
      description: `${selectedAgent?.name} is now running with your configuration.`,
    });

    // Here you would make an API call to execute the workflow
    console.log("Executing workflow:", selectedWorkflow, workflowConfig, executionMode);
  };

  if (!(userRole === 'recruiter' || userRole === 'company_admin')) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground text-center">
              This page is only accessible to recruiters and company administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          AI Workflows
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure and execute AI-powered recruitment workflow agents
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {AGENT_WORKFLOWS.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Available AI agents</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {AGENT_WORKFLOWS.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ready to execute</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Execution Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {executionMode === "single" ? "Single" : "Batch"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Current mode</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Workflow Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Workflow Agent</CardTitle>
            <CardDescription>Choose an AI agent to configure and execute</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {AGENT_WORKFLOWS.map((workflow) => {
              const Icon = workflow.icon;
              const isSelected = selectedWorkflow === workflow.id;
              return (
                <div
                  key={workflow.id}
                  className={`flex items-start gap-3 p-4 rounded-md border-2 cursor-pointer hover-elevate ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border'
                  }`}
                  onClick={() => setSelectedWorkflow(workflow.id)}
                  data-testid={`workflow-${workflow.id}`}
                >
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center ${workflow.bgColor}`}>
                    <Icon className={`w-6 h-6 ${workflow.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{workflow.name}</div>
                    <p className="text-sm text-muted-foreground mt-1">{workflow.description}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Configuration</CardTitle>
            <CardDescription>
              {selectedAgent ? `Configure ${selectedAgent.name}` : 'Select a workflow to configure'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedAgent ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Settings className="h-12 w-12 mb-4" />
                <p>Select a workflow agent to view configuration options</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedAgent.configFields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id}>{field.label}</Label>
                    {field.type === "text" && (
                      <Input
                        id={field.id}
                        type="text"
                        defaultValue={field.defaultValue as string}
                        onChange={(e) => handleConfigChange(field.id, e.target.value)}
                        data-testid={`input-${field.id}`}
                      />
                    )}
                    {field.type === "number" && (
                      <Input
                        id={field.id}
                        type="number"
                        defaultValue={field.defaultValue as string}
                        onChange={(e) => handleConfigChange(field.id, e.target.value)}
                        data-testid={`input-${field.id}`}
                      />
                    )}
                    {field.type === "select" && (
                      <Select
                        defaultValue={field.defaultValue as string}
                        onValueChange={(value) => handleConfigChange(field.id, value)}
                      >
                        <SelectTrigger data-testid={`select-${field.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {field.type === "checkbox" && (
                      <div className="flex items-center space-x-2">
                        <input
                          id={field.id}
                          type="checkbox"
                          defaultChecked={field.defaultValue === "true"}
                          onChange={(e) => handleConfigChange(field.id, e.target.checked)}
                          className="h-4 w-4"
                          data-testid={`checkbox-${field.id}`}
                        />
                        <Label htmlFor={field.id} className="font-normal">Enable</Label>
                      </div>
                    )}
                  </div>
                ))}

                <div className="border-t pt-4 mt-6">
                  <Label htmlFor="execution-mode">Execution Mode</Label>
                  <Select
                    value={executionMode}
                    onValueChange={(value: "single" | "batch") => setExecutionMode(value)}
                  >
                    <SelectTrigger className="mt-2" data-testid="select-execution-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Execution</SelectItem>
                      <SelectItem value="batch">Batch Processing</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    {executionMode === "single" 
                      ? "Process one item at a time" 
                      : "Process multiple items in parallel"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Execution Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Execute Workflow</CardTitle>
          <CardDescription>
            Run the configured AI workflow agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-md bg-muted">
              <div className="flex items-center gap-3">
                {selectedAgent ? (
                  <>
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center ${selectedAgent.bgColor}`}>
                      {(() => {
                        const Icon = selectedAgent.icon;
                        return <Icon className={`w-6 h-6 ${selectedAgent.color}`} />;
                      })()}
                    </div>
                    <div>
                      <div className="font-semibold">{selectedAgent.name}</div>
                      <p className="text-sm text-muted-foreground">
                        Mode: {executionMode === "single" ? "Single" : "Batch"} | Ready to execute
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground">No workflow selected</div>
                )}
              </div>
              <Button
                size="lg"
                disabled={!selectedAgent}
                onClick={handleExecuteWorkflow}
                data-testid="button-execute-workflow"
              >
                <Play className="h-4 w-4 mr-2" />
                Execute Workflow
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-center gap-2 p-3 rounded-md border">
                <Zap className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="text-sm font-semibold">Fast Processing</div>
                  <p className="text-xs text-muted-foreground">AI-powered automation</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-md border">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm font-semibold">Real-time Analytics</div>
                  <p className="text-xs text-muted-foreground">Live progress tracking</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-md border">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-sm font-semibold">Reliable Results</div>
                  <p className="text-xs text-muted-foreground">Consistent quality</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Status per Job Application ID */}
      {applications.length > 0 && (
        <>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Job ID, candidate name, or job title..."
                className="pl-10"
                data-testid="input-search-workflow"
                value={workflowSearchQuery}
                onChange={(e) => setWorkflowSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Workflow Executions - 6-Step Recruitment Pipeline</CardTitle>
              <CardDescription>Track the progress of each job application through all workflow stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">Job ID</TableHead>
                      <TableHead className="min-w-[150px]">Candidate</TableHead>
                      <TableHead className="min-w-[150px]">Job Role</TableHead>
                      {WORKFLOW_STEPS.map((step) => {
                        const Icon = step.icon;
                        return (
                          <TableHead key={step.id} className="text-center min-w-[120px]">
                            <div className="flex flex-col items-center gap-1">
                              <Icon className={`w-4 h-4 ${step.color}`} />
                              <span className="text-xs">{step.name}</span>
                            </div>
                          </TableHead>
                        );
                      })}
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          {workflowSearchQuery ? "No matching applications found" : "No applications yet"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredApplications.map((application: any) => (
                        <TableRow key={application.id} className="hover-elevate" data-testid={`row-application-${application.id}`}>
                          <TableCell>
                            <div className="font-mono text-primary font-semibold">
                              {application.job?.jobPostingId || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {application.candidate?.firstName} {application.candidate?.lastName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {application.job?.title}
                            </div>
                          </TableCell>
                          {WORKFLOW_STEPS.map((step) => {
                            const status = getWorkflowStepStatus(application, step.id);
                            return (
                              <TableCell key={step.id} className="text-center">
                                <div className="flex justify-center">
                                  {getStatusIcon(status)}
                                </div>
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center">
                            <Button size="sm" variant="outline" data-testid={`button-view-${application.id}`}>
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Workflow Steps Legend */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Steps Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                {WORKFLOW_STEPS.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                      <div className="w-8 h-8 rounded-md flex items-center justify-center bg-background">
                        <Icon className={`w-5 h-5 ${step.color}`} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Step {step.id}: {step.name}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-muted-foreground">Pending</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
