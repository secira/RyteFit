import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Search, Plus, Upload, FileText, BookOpen, Download, X, Eye, Settings, Target, AlertCircle } from "lucide-react";
import { useState, useRef } from "react";
import { FormulaRenderer, textToContentBlocks, hasFormulas } from "@/components/FormulaRenderer";
import type { ContentBlock } from '@shared/schema';
import { RichContentInput } from "@/components/RichContentInput";

export default function AdminQuestions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPaperId, setSelectedPaperId] = useState<string>("all"); // Selected question paper
  const [showManualForm, setShowManualForm] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [showPDFUpload, setShowPDFUpload] = useState(false);
  const [showWeightageManager, setShowWeightageManager] = useState(false);
  const [showQuestionPreview, setShowQuestionPreview] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<any>(null);
  const [csvPreviewData, setCsvPreviewData] = useState<any[]>([]);
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [pdfPreviewData, setPdfPreviewData] = useState<any[]>([]);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const { toast} = useToast();
  
  // Form state for manual question entry with formula support
  const [questionForm, setQuestionForm] = useState({
    paperId: "", // Test paper ID (required)
    examType: "", // Auto-set based on paper selection
    // Question content
    text: "",
    textFormat: 'plain' as 'plain' | 'latex' | 'mathml' | 'image',
    // Options content
    option1: "",
    option1Format: 'plain' as 'plain' | 'latex' | 'mathml' | 'image',
    option2: "",
    option2Format: 'plain' as 'plain' | 'latex' | 'mathml' | 'image',
    option3: "",
    option3Format: 'plain' as 'plain' | 'latex' | 'mathml' | 'image',
    option4: "",
    option4Format: 'plain' as 'plain' | 'latex' | 'mathml' | 'image',
    correctOption: 0,
    // Explanation content
    explanation: "",
    explanationFormat: 'plain' as 'plain' | 'latex' | 'mathml' | 'image',
    // Other fields
    difficultyLevel: 3,
    subjectId: "", // Required subject
    chapterId: "", // Optional chapter
    topicId: "", // Optional topic
    isPreviousYear: false,
    previousYearInfo: ""
  });

  // Preview state for showing formula rendering
  const [showPreview, setShowPreview] = useState({
    text: false,
    option1: false,
    option2: false,
    option3: false,
    option4: false,
    explanation: false
  });

  // Fetch questions - either all questions or questions for a specific paper
  const { data: questions, isLoading } = useQuery<any[]>({
    queryKey: selectedPaperId && selectedPaperId !== 'all'
      ? ['/api/admin/papers', selectedPaperId, 'questions']
      : ['/api/admin/questions'],
  });

  const { data: subjects } = useQuery<any[]>({
    queryKey: ['/api/admin/subjects'],
  });

  const { data: papers } = useQuery<any[]>({
    queryKey: ['/api/admin/papers'],
  });

  const { data: chapters } = useQuery<any[]>({
    queryKey: ['/api/admin/subjects', questionForm.subjectId, 'chapters'],
    enabled: !!questionForm.subjectId,
  });

  const { data: topics } = useQuery<any[]>({
    queryKey: ['/api/admin/chapters', questionForm.chapterId, 'topics'],
    enabled: !!questionForm.chapterId,
  });

  // Create question mutation
  const createQuestionMutation = useMutation({
    mutationFn: async (questionData: any) => {
      return apiRequest('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/papers'] });
      if (selectedPaperId && selectedPaperId !== 'all') {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/papers', selectedPaperId, 'questions'] });
      }
      setShowManualForm(false);
      setEditingQuestion(null);
      resetQuestionForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create question",
        variant: "destructive",
      });
    },
  });

  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, questionData }: { id: string, questionData: any }) => {
      return apiRequest(`/api/admin/questions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/papers'] });
      if (selectedPaperId && selectedPaperId !== 'all') {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/papers', selectedPaperId, 'questions'] });
      }
      setShowManualForm(false);
      setEditingQuestion(null);
      resetQuestionForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update question",
        variant: "destructive",
      });
    },
  });

  // CSV preview mutation (parse without saving)
  const csvPreviewMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('csv', file);
      
      return fetch('/api/admin/preview-csv', {
        method: 'POST',
        body: formData,
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (Array.isArray(data) && data.length > 0) {
        setCsvPreviewData(data);
        setShowCsvPreview(true);
        setShowCSVUpload(false);
      } else {
        toast({
          title: "No Questions Found",
          description: "The CSV file doesn't contain any valid questions.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Parse Failed",
        description: error.message || "Failed to parse CSV",
        variant: "destructive",
      });
    },
  });

  // CSV upload mutation (actual upload)
  const csvUploadMutation = useMutation({
    mutationFn: async (questions: any[]) => {
      return apiRequest('/api/admin/questions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "CSV Upload Completed",
        description: `${csvPreviewData.length} questions imported successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/papers'] });
      if (selectedPaperId && selectedPaperId !== 'all') {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/papers', selectedPaperId, 'questions'] });
      }
      setShowCSVUpload(false);
      setShowCsvPreview(false);
      setCsvPreviewData([]);
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload questions",
        variant: "destructive",
      });
    },
  });

  // PDF preview mutation
  const pdfPreviewMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('pdf', file);
      
      return fetch('/api/admin/preview-pdf', {
        method: 'POST',
        body: formData,
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (Array.isArray(data) && data.length > 0) {
        setPdfPreviewData(data);
        setShowPdfPreview(true);
        setShowPDFUpload(false);
      } else {
        toast({
          title: "No Questions Found",
          description: "The PDF doesn't contain any extractable questions.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Parse Failed",
        description: error.message || "Failed to parse PDF",
        variant: "destructive",
      });
    },
  });

  const resetQuestionForm = () => {
    setQuestionForm({
      paperId: "",
      examType: "",
      // Question content
      text: "",
      textFormat: 'plain',
      // Options content
      option1: "",
      option1Format: 'plain',
      option2: "",
      option2Format: 'plain',
      option3: "",
      option3Format: 'plain',
      option4: "",
      option4Format: 'plain',
      correctOption: 0,
      // Explanation content
      explanation: "",
      explanationFormat: 'plain',
      // Other fields
      difficultyLevel: 3,
      subjectId: "",
      chapterId: "",
      topicId: "",
      isPreviousYear: false,
      previousYearInfo: ""
    });
    // Reset preview state
    setShowPreview({
      text: false,
      option1: false,
      option2: false,
      option3: false,
      option4: false,
      explanation: false
    });
  };

  // Helper function to create content blocks
  const createContentBlocks = (content: string, format: 'plain' | 'latex' | 'mathml' | 'image'): ContentBlock[] => {
    if (!content.trim()) return [];
    // If format is plain, parse the text to auto-detect LaTeX
    if (format === 'plain') {
      return textToContentBlocks(content);
    }
    return [{ type: format, value: content }];
  };

  const handleSubmitQuestion = async () => {
    // Validate required fields: paper, subject, and basic question content
    if (!questionForm.paperId) {
      toast({
        title: "Validation Error",
        description: "Please select a test paper",
        variant: "destructive",
      });
      return;
    }

    if (!questionForm.subjectId) {
      toast({
        title: "Validation Error",
        description: "Please select a subject",
        variant: "destructive",
      });
      return;
    }

    if (!questionForm.text || !questionForm.option1 || !questionForm.option2) {
      toast({
        title: "Validation Error",
        description: "Question text and at least 2 options are required",
        variant: "destructive",
      });
      return;
    }

    // Create properly synchronized options and content arrays
    const allOptions = [
      { text: questionForm.option1, format: questionForm.option1Format, originalIndex: 0 },
      { text: questionForm.option2, format: questionForm.option2Format, originalIndex: 1 },
      { text: questionForm.option3, format: questionForm.option3Format, originalIndex: 2 },
      { text: questionForm.option4, format: questionForm.option4Format, originalIndex: 3 }
    ];

    // Filter out empty options while maintaining synchronization
    const validOptions = allOptions.filter(opt => opt.text.trim() !== "");
    
    // Validate we have at least 2 options
    if (validOptions.length < 2) {
      toast({
        title: "Validation Error",
        description: "At least 2 options are required",
        variant: "destructive",
      });
      return;
    }

    // Create legacy options array and rich content blocks
    const options = validOptions.map(opt => opt.text);
    const optionContents = validOptions.map(opt => createContentBlocks(opt.text, opt.format));
    
    // Remap correctOption to match the filtered array
    const originalCorrectIndex = questionForm.correctOption;
    const newCorrectIndex = validOptions.findIndex(opt => opt.originalIndex === originalCorrectIndex);
    
    // Validate correctOption points to a valid option
    if (newCorrectIndex === -1 || newCorrectIndex >= validOptions.length) {
      toast({
        title: "Validation Error",
        description: "Please select a valid correct option from the available choices",
        variant: "destructive",
      });
      return;
    }

    // Create rich content blocks
    const questionContent = createContentBlocks(questionForm.text, questionForm.textFormat);

    const explanationContent = createContentBlocks(questionForm.explanation, questionForm.explanationFormat);

    // Check if question has any formulas
    const questionHasFormulas = hasFormulas(questionContent) || 
                               optionContents.some(opt => hasFormulas(opt)) || 
                               hasFormulas(explanationContent);

    const questionData = {
      // Main organizational keys
      paperId: questionForm.paperId,
      examType: questionForm.examType,
      subjectId: questionForm.subjectId,
      // Optional categorization
      chapterId: questionForm.chapterId || null,
      topicId: questionForm.topicId || null,
      // Question content
      text: questionForm.text,
      options: options,
      explanation: questionForm.explanation,
      // Rich content fields
      questionContent: questionContent.length > 0 ? questionContent : null,
      optionContents: optionContents.length > 0 ? optionContents : null,
      explanationContent: explanationContent.length > 0 ? explanationContent : null,
      hasFormula: questionHasFormulas,
      // Other fields
      correctOption: newCorrectIndex,
      difficultyLevel: questionForm.difficultyLevel,
      isPreviousYear: questionForm.isPreviousYear,
      previousYearInfo: questionForm.previousYearInfo
    };

    if (editingQuestion) {
      updateQuestionMutation.mutate({ id: editingQuestion.id, questionData });
    } else {
      createQuestionMutation.mutate(questionData);
    }
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      csvPreviewMutation.mutate(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid CSV file",
        variant: "destructive",
      });
    }
    // Reset input
    if (event.target) event.target.value = '';
  };

  const handlePDFUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      pdfPreviewMutation.mutate(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid PDF file",
        variant: "destructive",
      });
    }
    // Reset input
    if (event.target) event.target.value = '';
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      ['exam_type', 'text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option', 'explanation', 'difficulty_level', 'topic_id', 'is_previous_year', 'previous_year_info'],
      ['NEET', 'What is the SI unit of electric current?', 'Volt', 'Ampere', 'Ohm', 'Watt', '1', 'The SI unit of electric current is Ampere, named after André-Marie Ampère.', '2', 'REQUIRED_TOPIC_ID', 'true', 'NEET 2023'],
      ['NEET', 'Which compound is known as laughing gas?', 'N2O', 'NO2', 'N2O4', 'NH3', '0', 'Nitrous oxide (N2O) is commonly known as laughing gas due to its euphoric effects.', '1', 'REQUIRED_TOPIC_ID', 'false', ''],
      ['JEE', 'What is the molecular formula of glucose?', 'C6H12O6', 'C12H22O11', 'C2H6O', 'CH4', '0', 'Glucose is a simple sugar with the molecular formula C6H12O6.', '2', 'REQUIRED_TOPIC_ID', 'true', 'JEE Main 2023']
    ];

    const csvContent = sampleData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredQuestions = (questions || []).filter((question: any) => 
    question.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.chapter?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold">Question Management</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading questions...</div>
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
        <h1 className="text-2xl font-bold">Question Management</h1>
      </div>

      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Questions</p>
                  <p className="text-2xl font-bold" data-testid="text-total-questions">{(questions || []).length}</p>
                </div>
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Easy Questions</p>
                  <p className="text-2xl font-bold" data-testid="text-easy-questions">
                    {(questions || []).filter((q: any) => q.difficultyLevel <= 2).length}
                  </p>
                </div>
                <Badge variant="secondary">Easy</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Medium Questions</p>
                  <p className="text-2xl font-bold" data-testid="text-medium-questions">
                    {(questions || []).filter((q: any) => q.difficultyLevel === 3).length}
                  </p>
                </div>
                <Badge variant="outline">Medium</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Hard Questions</p>
                  <p className="text-2xl font-bold" data-testid="text-hard-questions">
                    {(questions || []).filter((q: any) => q.difficultyLevel >= 4).length}
                  </p>
                </div>
                <Badge variant="default">Hard</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center">
              <Dialog open={showManualForm} onOpenChange={(open) => { 
                setShowManualForm(open); 
                if (!open) {
                  setEditingQuestion(null);
                  resetQuestionForm();
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2" data-testid="button-add-manual">
                    <Plus className="h-8 w-8" />
                    <span>Add Manual Question</span>
                    <span className="text-xs text-muted-foreground">Create questions manually</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingQuestion ? "Edit Question" : "Add New Question Manually"}</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Test Paper Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="paper">Test Paper *</Label>
                      <Select
                        value={questionForm.paperId}
                        onValueChange={(value) => {
                          const selectedPaper = papers?.find(p => p.id === value);
                          setQuestionForm({ 
                            ...questionForm, 
                            paperId: value,
                            examType: selectedPaper?.examType || ''
                          });
                        }}
                      >
                        <SelectTrigger data-testid="select-paper">
                          <SelectValue placeholder="Select test paper" />
                        </SelectTrigger>
                        <SelectContent>
                          {(papers || []).map((paper: any) => (
                            <SelectItem key={paper.id} value={paper.id}>
                              {paper.examType} - TN{paper.testNumber.toString().padStart(3, '0')} - {paper.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Select the test paper to add this question to
                      </p>
                    </div>

                    {/* Question Text with Formula Support */}
                    <RichContentInput
                      label="Question Text"
                      value={questionForm.text}
                      format={questionForm.textFormat}
                      placeholder="Enter the question text..."
                      required={true}
                      multiline={true}
                      onValueChange={(value) => setQuestionForm({ ...questionForm, text: value })}
                      onFormatChange={(format) => setQuestionForm({ ...questionForm, textFormat: format })}
                      showPreview={showPreview.text}
                      onTogglePreview={(show) => setShowPreview({ ...showPreview, text: show })}
                      testId="textarea-question-text"
                    />

                    {/* Options with Formula Support */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label>Answer Options *</Label>
                        <p className="text-sm text-muted-foreground">
                          Click the radio button next to the correct answer option
                        </p>
                      </div>
                      
                      {[1, 2, 3, 4].map((optNum) => (
                        <div key={optNum} className={`space-y-3 p-4 rounded-lg border-2 transition-all ${
                          questionForm.correctOption === optNum - 1 
                            ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                            : 'border-border bg-background'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="correct-option"
                                checked={questionForm.correctOption === optNum - 1}
                                onChange={() => setQuestionForm({ ...questionForm, correctOption: optNum - 1 })}
                                data-testid={`radio-correct-${optNum}`}
                                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                              />
                              <Label className="text-xs text-muted-foreground cursor-pointer" 
                                     onClick={() => setQuestionForm({ ...questionForm, correctOption: optNum - 1 })}>
                                {questionForm.correctOption === optNum - 1 ? 'CORRECT ANSWER' : 'Mark as Correct'}
                              </Label>
                            </div>
                            <div className="flex-1">
                              <Label className="font-medium text-base">
                                Option {optNum} {optNum <= 2 ? '(Required)' : '(Optional)'}
                                {questionForm.correctOption === optNum - 1 && (
                                  <Badge variant="default" className="ml-2 bg-green-600 hover:bg-green-700">
                                    ✓ Correct
                                  </Badge>
                                )}
                              </Label>
                            </div>
                          </div>
                          <RichContentInput
                            label=""
                            value={questionForm[`option${optNum}` as keyof typeof questionForm] as string}
                            format={questionForm[`option${optNum}Format` as keyof typeof questionForm] as 'plain' | 'latex' | 'mathml' | 'image'}
                            placeholder={`Enter option ${optNum}...`}
                            required={optNum <= 2}
                            onValueChange={(value) => setQuestionForm({ 
                              ...questionForm, 
                              [`option${optNum}`]: value 
                            })}
                            onFormatChange={(format) => setQuestionForm({ 
                              ...questionForm, 
                              [`option${optNum}Format`]: format 
                            })}
                            showPreview={showPreview[`option${optNum}` as keyof typeof showPreview]}
                            onTogglePreview={(show) => setShowPreview({ 
                              ...showPreview, 
                              [`option${optNum}`]: show 
                            })}
                            testId={`input-option-${optNum}`}
                          />
                        </div>
                      ))}
                      
                      {/* Correct Answer Summary */}
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-green-600" />
                          <Label className="font-medium">Selected Correct Answer:</Label>
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700" data-testid="text-selected-correct-answer">
                            Option {questionForm.correctOption + 1}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {questionForm[`option${questionForm.correctOption + 1}` as keyof typeof questionForm] as string || 
                           `Please enter text for Option ${questionForm.correctOption + 1} to see the correct answer preview`}
                        </p>
                      </div>
                    </div>

                    {/* Subject, Chapter, Topic Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject *</Label>
                        <Select
                          value={questionForm.subjectId}
                          onValueChange={(value) => {
                            setQuestionForm({ 
                              ...questionForm, 
                              subjectId: value, 
                              chapterId: ""
                            });
                          }}
                        >
                          <SelectTrigger data-testid="select-subject">
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {(subjects || []).map((subject: any) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="chapter">Chapter (Optional)</Label>
                        <Select
                          value={questionForm.chapterId}
                          onValueChange={(value) => {
                            setQuestionForm({ 
                              ...questionForm, 
                              chapterId: value,
                              topicId: "" // Reset topic when chapter changes
                            });
                          }}
                          disabled={!questionForm.subjectId}
                        >
                          <SelectTrigger data-testid="select-chapter">
                            <SelectValue placeholder="Auto-selects 'To be added Later'" />
                          </SelectTrigger>
                          <SelectContent>
                            {(chapters || []).map((chapter: any) => (
                              <SelectItem key={chapter.id} value={chapter.id}>
                                {chapter.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="topic">Topic (Optional)</Label>
                        <Select
                          value={questionForm.topicId}
                          onValueChange={(value) => {
                            setQuestionForm({ 
                              ...questionForm, 
                              topicId: value
                            });
                          }}
                          disabled={!questionForm.chapterId}
                        >
                          <SelectTrigger data-testid="select-topic">
                            <SelectValue placeholder="Auto-selects 'General'" />
                          </SelectTrigger>
                          <SelectContent>
                            {(topics || []).map((topic: any) => (
                              <SelectItem key={topic.id} value={topic.id}>
                                {topic.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Additional Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="difficulty">Difficulty Level</Label>
                        <Select
                          value={questionForm.difficultyLevel.toString()}
                          onValueChange={(value) => setQuestionForm({ ...questionForm, difficultyLevel: parseInt(value) })}
                        >
                          <SelectTrigger data-testid="select-difficulty">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Very Easy</SelectItem>
                            <SelectItem value="2">2 - Easy</SelectItem>
                            <SelectItem value="3">3 - Medium</SelectItem>
                            <SelectItem value="4">4 - Hard</SelectItem>
                            <SelectItem value="5">5 - Very Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Previous Year Question</Label>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={questionForm.isPreviousYear}
                              onChange={(e) => setQuestionForm({ ...questionForm, isPreviousYear: e.target.checked })}
                              data-testid="checkbox-previous-year"
                            />
                            <Label>Previous Year Question</Label>
                          </div>
                        </div>
                        {questionForm.isPreviousYear && (
                          <Input
                            placeholder="e.g., NEET 2023, JEE Main 2022"
                            value={questionForm.previousYearInfo}
                            onChange={(e) => setQuestionForm({ ...questionForm, previousYearInfo: e.target.value })}
                            data-testid="input-previous-year-info"
                          />
                        )}
                      </div>
                    </div>

                    {/* Explanation with Formula Support */}
                    <RichContentInput
                      label="Explanation"
                      value={questionForm.explanation}
                      format={questionForm.explanationFormat}
                      placeholder="Enter explanation for the correct answer..."
                      multiline={true}
                      onValueChange={(value) => setQuestionForm({ ...questionForm, explanation: value })}
                      onFormatChange={(format) => setQuestionForm({ ...questionForm, explanationFormat: format })}
                      showPreview={showPreview.explanation}
                      onTogglePreview={(show) => setShowPreview({ ...showPreview, explanation: show })}
                      testId="textarea-explanation"
                    />

                    {/* Action Buttons */}
                    <div className="flex justify-between gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => setShowQuestionPreview(true)}
                        data-testid="button-preview-question"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Question
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowManualForm(false)}
                          data-testid="button-cancel-manual"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSubmitQuestion}
                          disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}
                          data-testid="button-submit-manual"
                        >
                          {editingQuestion 
                            ? (updateQuestionMutation.isPending ? "Updating..." : "Update Question")
                            : (createQuestionMutation.isPending ? "Creating..." : "Create Question")
                          }
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Question Preview Dialog */}
              <Dialog open={showQuestionPreview} onOpenChange={setShowQuestionPreview}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Question Preview</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Preview Card */}
                    <Card>
                      <CardContent className="p-6 space-y-6">
                        {/* Question Text */}
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-lg min-w-[3rem]">Q.</span>
                            <div className="flex-1">
                              {questionForm.text ? (
                                <FormulaRenderer
                                  content={
                                    questionForm.textFormat === 'plain' 
                                      ? textToContentBlocks(questionForm.text)
                                      : [{ type: questionForm.textFormat, value: questionForm.text }]
                                  }
                                  className="text-base leading-relaxed"
                                />
                              ) : (
                                <p className="text-muted-foreground italic">No question text entered</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Options */}
                        <div className="space-y-3">
                          {[1, 2, 3, 4].map((optNum) => {
                            const optionValue = questionForm[`option${optNum}` as keyof typeof questionForm] as string;
                            const optionFormat = questionForm[`option${optNum}Format` as keyof typeof questionForm] as 'plain' | 'latex' | 'mathml' | 'image';
                            const isCorrect = questionForm.correctOption === optNum - 1;
                            
                            if (!optionValue) return null;
                            
                            return (
                              <div 
                                key={optNum}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                  isCorrect 
                                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                                    : 'border-border bg-muted/30'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                                    isCorrect 
                                      ? 'bg-green-500 text-white' 
                                      : 'bg-muted text-muted-foreground'
                                  }`}>
                                    {String.fromCharCode(64 + optNum)}
                                  </div>
                                  <div className="flex-1">
                                    <FormulaRenderer
                                      content={
                                        optionFormat === 'plain' 
                                          ? textToContentBlocks(optionValue)
                                          : [{ type: optionFormat, value: optionValue }]
                                      }
                                      className="text-base"
                                    />
                                  </div>
                                  {isCorrect && (
                                    <Badge className="bg-green-600">
                                      ✓ Correct
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation */}
                        {questionForm.explanation && (
                          <>
                            <Separator />
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-primary" />
                                <h4 className="font-semibold text-lg">Explanation</h4>
                              </div>
                              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <FormulaRenderer
                                  content={
                                    questionForm.explanationFormat === 'plain' 
                                      ? textToContentBlocks(questionForm.explanation)
                                      : [{ type: questionForm.explanationFormat, value: questionForm.explanation }]
                                  }
                                  className="text-base leading-relaxed"
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {/* Metadata */}
                        <Separator />
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">
                            Difficulty: Level {questionForm.difficultyLevel}
                          </Badge>
                          {questionForm.isPreviousYear && questionForm.previousYearInfo && (
                            <Badge variant="secondary">
                              {questionForm.previousYearInfo}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Preview Actions */}
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowQuestionPreview(false)}
                      >
                        Close Preview
                      </Button>
                      <Button
                        onClick={() => {
                          setShowQuestionPreview(false);
                          handleSubmitQuestion();
                        }}
                        disabled={createQuestionMutation.isPending}
                      >
                        {createQuestionMutation.isPending ? "Creating..." : "Looks Good, Create Question"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Search and Question List */}
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle>
                  {selectedPaperId && selectedPaperId !== 'all'
                    ? `Questions for ${papers?.find(p => p.id === selectedPaperId)?.testCode || 'Selected Paper'}`
                    : 'All Questions'}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search questions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                      data-testid="input-search-questions"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium whitespace-nowrap">Filter by Paper:</Label>
                <Select
                  value={selectedPaperId}
                  onValueChange={(value) => setSelectedPaperId(value)}
                >
                  <SelectTrigger className="w-[300px]" data-testid="select-filter-paper">
                    <SelectValue placeholder="All Papers (Show All Questions)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" data-testid="option-all-papers">All Papers (Show All Questions)</SelectItem>
                    <Separator className="my-2" />
                    {papers?.filter(p => p.status === 'production' || p.status === 'draft').map((paper) => (
                      <SelectItem 
                        key={paper.id} 
                        value={paper.id}
                        data-testid={`option-paper-${paper.testCode}`}
                      >
                        {paper.testCode} - {paper.name || paper.title} ({paper.totalQuestionsUploaded}/{paper.totalQuestionsRequired} questions)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPaperId && selectedPaperId !== 'all' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPaperId("all")}
                    data-testid="button-clear-filter"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear Filter
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredQuestions.length > 0 ? (
              <div className="space-y-3">
                {filteredQuestions.map((question: any, index: number) => (
                  <div key={question.id || index} className="border rounded-lg p-4 hover-elevate" data-testid={`card-question-${question.id || index}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium line-clamp-2 mb-2" data-testid={`text-question-${question.id || index}`}>
                          {question.text}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <BookOpen className="h-4 w-4" />
                          <span>{question.subject}</span>
                          <span>•</span>
                          <span>{question.chapter}</span>
                          {question.topic && (
                            <>
                              <span>•</span>
                              <span>{question.topic}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs" data-testid={`badge-difficulty-${question.id || index}`}>
                            Level {question.difficultyLevel}/5
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Added: {new Date(question.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setPreviewQuestion(question)}
                          data-testid={`button-preview-question-${question.id || index}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setEditingQuestion(question);
                            setQuestionForm({
                              paperId: question.paperId || "",
                              examType: question.examType || "",
                              text: question.text || "",
                              textFormat: 'plain',
                              option1: question.options?.[0] || "",
                              option1Format: 'plain',
                              option2: question.options?.[1] || "",
                              option2Format: 'plain',
                              option3: question.options?.[2] || "",
                              option3Format: 'plain',
                              option4: question.options?.[3] || "",
                              option4Format: 'plain',
                              correctOption: question.correctOption || 0,
                              explanation: question.explanation || "",
                              explanationFormat: 'plain',
                              difficultyLevel: question.difficultyLevel || 3,
                              subjectId: question.subjectId || "",
                              chapterId: question.chapterId || "",
                              topicId: question.topicId || "",
                              isPreviousYear: question.isPreviousYear || false,
                              previousYearInfo: question.previousYearInfo || ""
                            });
                            setShowManualForm(true);
                          }}
                          data-testid={`button-edit-question-${question.id || index}`}
                        >
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" data-testid={`button-delete-question-${question.id || index}`}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchTerm ? 'No questions found matching your search.' : 'No questions found. Upload some questions to get started.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CSV Preview Dialog */}
      <Dialog open={showCsvPreview} onOpenChange={setShowCsvPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>CSV Preview - {csvPreviewData.length} Questions</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Review the questions below before uploading. You can scroll through all {csvPreviewData.length} questions.
            </p>
            
            <div className="border rounded-lg max-h-[60vh] overflow-y-auto p-4 space-y-4">
              {csvPreviewData.map((q, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-2">
                    <div className="font-medium">Q{index + 1}. {q.text}</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>A. {q.option1}</div>
                      <div>B. {q.option2}</div>
                      <div>C. {q.option3}</div>
                      <div>D. {q.option4}</div>
                    </div>
                    <div className="text-sm text-green-600">Correct: Option {String.fromCharCode(65 + (q.correctOption || 0))}</div>
                    {q.explanation && <div className="text-sm text-muted-foreground">Explanation: {q.explanation}</div>}
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCsvPreview(false);
                  setCsvPreviewData([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => csvUploadMutation.mutate(csvPreviewData)}
                disabled={csvUploadMutation.isPending}
              >
                {csvUploadMutation.isPending ? "Uploading..." : `Upload ${csvPreviewData.length} Questions`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog open={showPdfPreview} onOpenChange={setShowPdfPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>PDF Preview - {pdfPreviewData.length} Questions</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Review the questions extracted from PDF before uploading. You can scroll through all {pdfPreviewData.length} questions.
            </p>
            
            <div className="border rounded-lg max-h-[60vh] overflow-y-auto p-4 space-y-4">
              {pdfPreviewData.map((q, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-2">
                    <div className="font-medium">Q{index + 1}. {q.text}</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>A. {q.option1}</div>
                      <div>B. {q.option2}</div>
                      <div>C. {q.option3}</div>
                      <div>D. {q.option4}</div>
                    </div>
                    <div className="text-sm text-green-600">Correct: Option {String.fromCharCode(65 + (q.correctOption || 0))}</div>
                    {q.explanation && <div className="text-sm text-muted-foreground">Explanation: {q.explanation}</div>}
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPdfPreview(false);
                  setPdfPreviewData([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => csvUploadMutation.mutate(pdfPreviewData)}
                disabled={csvUploadMutation.isPending}
              >
                {csvUploadMutation.isPending ? "Uploading..." : `Upload ${pdfPreviewData.length} Questions`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Question Preview Dialog (from list) */}
      {previewQuestion && (
        <Dialog open={!!previewQuestion} onOpenChange={() => setPreviewQuestion(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Question Preview</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-6">
                  {/* Question Text */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-lg min-w-[3rem]">Q.</span>
                      <div className="flex-1">
                        {previewQuestion.questionContent && Array.isArray(previewQuestion.questionContent) ? (
                          <FormulaRenderer
                            content={previewQuestion.questionContent}
                            className="text-base leading-relaxed"
                          />
                        ) : previewQuestion.text ? (
                          <FormulaRenderer
                            content={textToContentBlocks(previewQuestion.text)}
                            className="text-base leading-relaxed"
                          />
                        ) : (
                          <p className="text-muted-foreground italic">No question text</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Options */}
                  <div className="space-y-3">
                    {previewQuestion.options?.map((option: string, index: number) => {
                      const isCorrect = previewQuestion.correctOption === index;
                      
                      // Get the formatted content if available, otherwise use text
                      let optionContent: ContentBlock[];
                      if (previewQuestion.optionContents && Array.isArray(previewQuestion.optionContents) && previewQuestion.optionContents[index]) {
                        optionContent = previewQuestion.optionContents[index];
                      } else {
                        optionContent = textToContentBlocks(option);
                      }
                      
                      if (!option) return null;
                      
                      return (
                        <div 
                          key={index}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            isCorrect 
                              ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                              : 'border-border bg-muted/30'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                              isCorrect 
                                ? 'bg-green-500 text-white' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {String.fromCharCode(65 + index)}
                            </div>
                            <div className="flex-1">
                              <FormulaRenderer
                                content={optionContent}
                                className="text-base"
                              />
                            </div>
                            {isCorrect && (
                              <Badge className="bg-green-600">
                                ✓ Correct
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {(previewQuestion.explanationContent || previewQuestion.explanation) && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-primary" />
                          <h4 className="font-semibold text-lg">Explanation</h4>
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <FormulaRenderer
                            content={
                              previewQuestion.explanationContent && Array.isArray(previewQuestion.explanationContent)
                                ? previewQuestion.explanationContent
                                : textToContentBlocks(previewQuestion.explanation || '')
                            }
                            className="text-base leading-relaxed"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Metadata */}
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Difficulty:</span>
                      <span className="ml-2 font-medium">Level {previewQuestion.difficultyLevel}/5</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Previous Year:</span>
                      <span className="ml-2 font-medium">{previewQuestion.isPreviousYear ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPreviewQuestion(null)}
                  data-testid="button-close-preview"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}