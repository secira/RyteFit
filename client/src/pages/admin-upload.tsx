import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { useState, useRef } from "react";

export default function AdminUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [examType, setExamType] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: examTypes } = useQuery({
    queryKey: ['/api/exam-types'],
  });

  const { data: subjects } = useQuery({
    queryKey: ['/api/subjects'],
    enabled: !!examType,
  });

  const { data: chapters } = useQuery({
    queryKey: ['/api/chapters', selectedSubject],
    enabled: !!selectedSubject,
  });

  const { data: topics } = useQuery({
    queryKey: ['/api/topics', selectedChapter],
    enabled: !!selectedChapter,
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest('/api/admin/upload-pdf', {
        method: 'POST',
        body: formData,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `Successfully imported ${data.questionsAdded} questions from PDF.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/questions'] });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload and process PDF file.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a PDF file.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setSelectedSubject("");
    setSelectedChapter("");
    setSelectedTopic("");
    setExamType("");
    setDifficultyLevel("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !examType || !selectedSubject || !difficultyLevel) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('pdf', selectedFile);
    formData.append('examType', examType);
    formData.append('subjectId', selectedSubject);
    formData.append('chapterId', selectedChapter);
    formData.append('topicId', selectedTopic);
    formData.append('difficultyLevel', difficultyLevel);

    try {
      setUploadProgress(50);
      await uploadMutation.mutateAsync(formData);
      setUploadProgress(100);
    } catch (error) {
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/questions">
          <Button variant="ghost" size="sm" data-testid="button-back-questions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Questions
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Upload PDF Questions</h1>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload PDF File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pdf-file">Select PDF File</Label>
              <Input
                id="pdf-file"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                ref={fileInputRef}
                data-testid="input-pdf-file"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Upload a PDF file containing multiple choice questions
              </p>
            </div>

            {selectedFile && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
                <span className="text-sm text-muted-foreground">
                  ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Question Details */}
        <Card>
          <CardHeader>
            <CardTitle>Question Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="exam-type">Exam Type *</Label>
                <Select value={examType} onValueChange={setExamType}>
                  <SelectTrigger data-testid="select-exam-type">
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    {examTypes?.map((type: any) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty Level *</Label>
                <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                  <SelectTrigger data-testid="select-difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Level 1 (Very Easy)</SelectItem>
                    <SelectItem value="2">Level 2 (Easy)</SelectItem>
                    <SelectItem value="3">Level 3 (Medium)</SelectItem>
                    <SelectItem value="4">Level 4 (Hard)</SelectItem>
                    <SelectItem value="5">Level 5 (Very Hard)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger data-testid="select-subject">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects?.map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSubject && (
              <div>
                <Label htmlFor="chapter">Chapter (Optional)</Label>
                <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                  <SelectTrigger data-testid="select-chapter">
                    <SelectValue placeholder="Select chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    {chapters?.map((chapter: any) => (
                      <SelectItem key={chapter.id} value={chapter.id}>
                        {chapter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedChapter && (
              <div>
                <Label htmlFor="topic">Topic (Optional)</Label>
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger data-testid="select-topic">
                    <SelectValue placeholder="Select topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics?.map((topic: any) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Progress */}
        {isUploading && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium mb-2">Processing PDF...</p>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {uploadProgress}%
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Upload Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• PDF should contain multiple choice questions with 4 options each</p>
              <p>• Questions should be numbered (e.g., "1.", "Q1.", "Question 1:")</p>
              <p>• Options should be labeled (A), (B), (C), (D) or 1), 2), 3), 4)</p>
              <p>• The correct answer should be clearly marked or provided</p>
              <p>• File size should be under 10MB for optimal processing</p>
            </div>
          </CardContent>
        </Card>

        {/* Upload Button */}
        <Card>
          <CardContent className="p-6">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !examType || !selectedSubject || !difficultyLevel || isUploading}
              className="w-full"
              size="lg"
              data-testid="button-upload-pdf"
            >
              {isUploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Processing PDF...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload and Process PDF
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}