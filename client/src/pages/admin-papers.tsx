import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, FileText, CheckCircle, AlertCircle, Users, BookOpen, Plus, Edit, Eye, Upload } from "lucide-react";
import { useState } from "react";
import { QuestionPaperPreview } from "@/components/QuestionPaperPreview";

interface PaperData {
  id: string;
  examType: string;
  testNumber: number;
  testCode: string;
  status: string;
  name: string;
  title: string;
  description?: string;
  previousYear?: number;
  totalQuestionsRequired: number;
  totalQuestionsUploaded: number;
  totalMarks: number;
  subjectBreakdown: Record<string, number>;
  subjectRequirements: Record<string, number>;
  usersTaken: number;
  publishedAt: string | null;
  createdAt: string | null;
}

function CreatePaperDialog({ examType }: { examType: "NEET" | "JEE" }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    testNumber: 1,
    name: "",
    previousYear: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/admin/papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question paper created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/papers'] });
      setOpen(false);
      setFormData({ testNumber: 1, name: "", previousYear: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create paper",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalQuestions = examType === 'NEET' ? 180 : 75;
    const totalMarks = examType === 'NEET' ? 720 : 300;
    
    createMutation.mutate({
      examType,
      testNumber: formData.testNumber,
      name: formData.name,
      previousYear: formData.previousYear ? parseInt(formData.previousYear) : null,
    });
  };

  const subjectBreakdown = examType === 'NEET'
    ? "Physics: 45, Chemistry: 45, Biology: 90"
    : "Physics: 25, Chemistry: 25, Mathematics: 25";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-paper">
          <Plus className="h-4 w-4 mr-2" />
          Create New Paper
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create {examType} Question Paper</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new question paper. The paper will be in draft mode until all questions are added.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="testNumber">Test Number (TN001-TN100)</Label>
              <Select
                value={formData.testNumber.toString()}
                onValueChange={(value) => setFormData({ ...formData, testNumber: parseInt(value) })}
              >
                <SelectTrigger data-testid="select-test-number">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      TN{num.toString().padStart(3, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Paper Name *</Label>
              <Input
                id="name"
                data-testid="input-paper-name"
                placeholder="e.g., NEET Mock Test - Physics Focus"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="previousYear">Previous Year (Optional)</Label>
              <Input
                id="previousYear"
                data-testid="input-previous-year"
                type="number"
                placeholder="e.g., 2023"
                value={formData.previousYear}
                onChange={(e) => setFormData({ ...formData, previousYear: e.target.value })}
                min="2000"
                max="2030"
              />
            </div>

            <div className="rounded-md bg-muted p-4 space-y-2">
              <h4 className="text-sm font-medium">Paper Configuration</h4>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Exam Type:</span> {examType}</p>
                <p><span className="font-medium">Total Questions:</span> {examType === 'NEET' ? 180 : 75}</p>
                <p><span className="font-medium">Total Marks:</span> {examType === 'NEET' ? 720 : 300}</p>
                <p><span className="font-medium">Subject Distribution:</span> {subjectBreakdown}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending} data-testid="button-create-submit">
              {createMutation.isPending ? "Creating..." : "Create Paper"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditPaperDialog({ paper }: { paper: PaperData }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: paper.name || '',
    description: paper.description || '',
    previousYear: paper.previousYear?.toString() || '',
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/admin/papers/${paper.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Paper details updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/papers'] });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update paper",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name: formData.name,
      description: formData.description,
      previousYear: formData.previousYear ? parseInt(formData.previousYear) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" data-testid={`button-edit-${paper.testCode}`}>
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit {paper.examType} - {paper.testCode}</DialogTitle>
          <DialogDescription>
            Update paper details. Test number and exam type cannot be changed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="rounded-md bg-muted p-3 space-y-1">
              <p className="text-sm"><span className="font-medium">Exam Type:</span> {paper.examType}</p>
              <p className="text-sm"><span className="font-medium">Test Number:</span> {paper.testCode}</p>
              <p className="text-sm"><span className="font-medium">Questions:</span> {paper.totalQuestionsUploaded} / {paper.totalQuestionsRequired}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name">Paper Name *</Label>
              <Input
                id="edit-name"
                data-testid="input-edit-paper-name"
                placeholder="e.g., NEET Mock Test - Physics Focus"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Input
                id="edit-description"
                data-testid="input-edit-description"
                placeholder="Brief description of the test paper"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-previousYear">Previous Year (Optional)</Label>
              <Input
                id="edit-previousYear"
                data-testid="input-edit-previous-year"
                type="number"
                placeholder="e.g., 2023"
                value={formData.previousYear}
                onChange={(e) => setFormData({ ...formData, previousYear: e.target.value })}
                min="2000"
                max="2030"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-edit-cancel">
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} data-testid="button-edit-submit">
              {updateMutation.isPending ? "Updating..." : "Update Paper"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UploadLatexDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('latexFile', file);

      const response = await fetch('/api/admin/papers/upload-latex', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload LaTeX file');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || `Paper created with ${data.questionsCreated} questions`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/papers'] });
      setOpen(false);
      setSelectedFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload LaTeX file",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-upload-latex">
          <Upload className="h-4 w-4 mr-2" />
          Upload from LaTeX
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Question Paper from LaTeX</DialogTitle>
          <DialogDescription>
            Upload a .tex file containing questions in the specified format. The paper will be created in draft status for review.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="latex-file">LaTeX File (.tex) *</Label>
              <Input
                id="latex-file"
                type="file"
                accept=".tex,text/plain"
                onChange={handleFileChange}
                data-testid="input-latex-file"
                required
              />
            </div>

            {selectedFile && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm">
                  <span className="font-medium">Selected file:</span> {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}

            <div className="rounded-md border p-3 text-sm space-y-2">
              <p className="font-medium">Expected Format:</p>
              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                <li>\section*{"{"} FINAL NEET(UG)-2025 {"}"} - Exam name</li>
                <li>(Held On...) - Previous year date (optional)</li>
                <li>\section*{"{"} PHYSICS {"}"} - Subject name</li>
                <li>1. Question text...</li>
                <li>(1), (2), (3), (4) - Options</li>
                <li>Ans. X - Correct answer number</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setOpen(false);
                setSelectedFile(null);
              }}
              data-testid="button-cancel-upload"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedFile || uploadMutation.isPending}
              data-testid="button-submit-upload"
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload & Create Paper"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UploadToExistingPaperDialog({ paper }: { paper: PaperData }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('latexFile', file);

      const response = await fetch(`/api/admin/papers/${paper.id}/upload-latex`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload LaTeX file');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || `Added ${data.questionsCreated} questions to ${paper.testCode}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/papers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/papers', paper.id, 'questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/questions'] });
      setOpen(false);
      setSelectedFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload LaTeX file",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" data-testid={`button-upload-to-${paper.testCode}`}>
          <Upload className="h-4 w-4 mr-1" />
          Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Questions to {paper.testCode}</DialogTitle>
          <DialogDescription>
            Upload a .tex file to add more questions to this existing paper ({paper.name || paper.title}). Current: {paper.totalQuestionsUploaded}/{paper.totalQuestionsRequired} questions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="rounded-md bg-muted p-3 space-y-1">
              <p className="text-sm font-medium">Paper Details:</p>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>Exam Type: {paper.examType}</p>
                <p>Test Code: {paper.testCode}</p>
                <p>Current Status: {paper.status}</p>
                <p>Questions: {paper.totalQuestionsUploaded} / {paper.totalQuestionsRequired}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="latex-file-existing">LaTeX File (.tex) *</Label>
              <Input
                id="latex-file-existing"
                type="file"
                accept=".tex,text/plain"
                onChange={handleFileChange}
                data-testid="input-latex-file-existing"
                required
              />
            </div>

            {selectedFile && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm">
                  <span className="font-medium">Selected file:</span> {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}

            <div className="rounded-md border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20 p-3 text-sm space-y-2">
              <p className="font-medium text-yellow-900 dark:text-yellow-100">Important:</p>
              <ul className="list-disc list-inside text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
                <li>Questions will be ADDED to the existing {paper.totalQuestionsUploaded} questions</li>
                <li>The exam type in LaTeX must match: {paper.examType}</li>
                <li>Duplicate questions will not be detected</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setOpen(false);
                setSelectedFile(null);
              }}
              data-testid="button-cancel-upload-existing"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedFile || uploadMutation.isPending}
              data-testid="button-submit-upload-existing"
            >
              {uploadMutation.isPending ? "Uploading..." : "Add Questions"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPapers() {
  const { toast } = useToast();
  const [selectedExamType, setSelectedExamType] = useState<"NEET" | "JEE">("NEET");
  const [previewPaperId, setPreviewPaperId] = useState<string | null>(null);
  const [previewPaperTitle, setPreviewPaperTitle] = useState<string>("");

  const { data: papers, isLoading } = useQuery<PaperData[]>({
    queryKey: ['/api/admin/papers'],
  });

  // Fetch questions for preview
  const { data: previewQuestions } = useQuery<any[]>({
    queryKey: ['/api/admin/papers', previewPaperId, 'questions'],
    enabled: !!previewPaperId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ examType, testNumber, status }: { examType: string; testNumber: number; status: string }) => {
      return apiRequest(`/api/admin/papers/${examType}/${testNumber}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Paper status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/papers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update paper status",
        variant: "destructive",
      });
    },
  });

  const filteredPapers = (papers || []).filter(p => p.examType === selectedExamType);

  const getStatusColor = (status: string) => {
    return status === 'production' ? 'default' : 'outline';
  };

  const getCompletionStatus = (uploaded: number, required: number) => {
    if (uploaded === 0) return { color: 'destructive', text: 'Not Started' };
    if (uploaded < required) return { color: 'secondary', text: 'In Progress' };
    return { color: 'default', text: 'Complete' };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" data-testid="button-back-admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Manage Question Papers</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading papers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin">
          <Button variant="ghost" size="sm" data-testid="button-back-admin">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Manage Question Papers</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Papers</p>
                <p className="text-2xl font-bold" data-testid="text-total-papers">200</p>
                <p className="text-xs text-muted-foreground">100 NEET + 100 JEE</p>
              </div>
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Production Papers</p>
                <p className="text-2xl font-bold" data-testid="text-production-papers">
                  {(papers || []).filter(p => p.status === 'production').length}
                </p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Draft Papers</p>
                <p className="text-2xl font-bold" data-testid="text-draft-papers">
                  {(papers || []).filter(p => p.status === 'draft').length}
                </p>
              </div>
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Questions</p>
                <p className="text-2xl font-bold" data-testid="text-total-questions-all">
                  {(papers || []).reduce((sum, p) => sum + p.totalQuestionsUploaded, 0)}
                </p>
              </div>
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exam Type Tabs */}
      <Tabs value={selectedExamType} onValueChange={(v) => setSelectedExamType(v as "NEET" | "JEE")} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="NEET" data-testid="tab-neet">NEET Papers (TN001-TN100)</TabsTrigger>
            <TabsTrigger value="JEE" data-testid="tab-jee">JEE Papers (TN001-TN100)</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <UploadLatexDialog />
            <CreatePaperDialog examType={selectedExamType} />
          </div>
        </div>

        <TabsContent value={selectedExamType} className="space-y-4">
          {/* Papers Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedExamType} Test Papers
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({filteredPapers.length} papers)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-3 bg-muted rounded-lg font-medium text-sm">
                  <div className="col-span-2">Test Code</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Questions</div>
                  <div className="col-span-3">Subject Breakdown</div>
                  <div className="col-span-1">Users</div>
                  <div className="col-span-2">Actions</div>
                </div>

                {/* Table Rows */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredPapers.map((paper) => {
                    const completion = getCompletionStatus(paper.totalQuestionsUploaded, paper.totalQuestionsRequired);
                    
                    return (
                      <div key={`${paper.examType}-${paper.testNumber}`} className="grid grid-cols-12 gap-4 p-3 border rounded-lg items-center hover-elevate" data-testid={`paper-${paper.testCode}`}>
                        <div className="col-span-2">
                          <span className="font-medium">{paper.testCode}</span>
                        </div>
                        
                        <div className="col-span-2">
                          <Select
                            value={paper.status}
                            onValueChange={(value) => updateStatusMutation.mutate({
                              examType: paper.examType,
                              testNumber: paper.testNumber,
                              status: value
                            })}
                            data-testid={`select-status-${paper.testCode}`}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="production">Production</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {paper.totalQuestionsUploaded} / {paper.totalQuestionsRequired}
                              </span>
                              <Badge variant={completion.color as any} className="text-xs">
                                {completion.text}
                              </Badge>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div 
                                className="bg-primary h-1.5 rounded-full transition-all"
                                style={{ 
                                  width: `${Math.min(100, (paper.totalQuestionsUploaded / paper.totalQuestionsRequired) * 100)}%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="col-span-3">
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(paper.subjectBreakdown).length > 0 ? (
                              Object.entries(paper.subjectBreakdown).map(([subject, count]) => (
                                <Badge key={subject} variant="outline" className="text-xs">
                                  {subject}: {count}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">No questions</span>
                            )}
                          </div>
                        </div>

                        <div className="col-span-1">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{paper.usersTaken}</span>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <div className="flex items-center gap-1">
                            <UploadToExistingPaperDialog paper={paper} />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setPreviewPaperId(paper.id);
                                setPreviewPaperTitle(`${paper.testCode} - ${paper.name || paper.title}`);
                              }}
                              disabled={paper.totalQuestionsUploaded === 0}
                              data-testid={`button-dry-run-${paper.testCode}`}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Dry Run
                            </Button>
                            <EditPaperDialog paper={paper} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Question Paper Preview Dialog */}
      <QuestionPaperPreview
        open={!!previewPaperId}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewPaperId(null);
            setPreviewPaperTitle("");
          }
        }}
        questions={previewQuestions || []}
        paperTitle={previewPaperTitle}
      />
    </div>
  );
}
