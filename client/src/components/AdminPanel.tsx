import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  Plus, 
  Edit,
  Trash2,
  Search,
  Filter,
  BookOpen,
  Users,
  BarChart3
} from "lucide-react";
import { useState } from "react";

interface Question {
  id: string;
  text: string;
  subject: string;
  chapter: string;
  difficulty: number;
  previousYear: boolean;
  year?: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export default function AdminPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  
  // todo: remove mock functionality
  const mockQuestions: Question[] = [
    {
      id: "q1",
      text: "What is the SI unit of electric current?",
      subject: "Physics",
      chapter: "Current Electricity", 
      difficulty: 2,
      previousYear: true,
      year: "NEET 2023",
      options: ["Volt", "Ampere", "Ohm", "Watt"],
      correctAnswer: 1,
      explanation: "The SI unit of electric current is Ampere, named after André-Marie Ampère."
    },
    {
      id: "q2",
      text: "Which compound is known as laughing gas?",
      subject: "Chemistry",
      chapter: "p-Block Elements",
      difficulty: 1,
      previousYear: false,
      options: ["N2O", "NO2", "N2O4", "NH3"],
      correctAnswer: 0,
      explanation: "Nitrous oxide (N2O) is commonly known as laughing gas due to its euphoric effects."
    }
  ];

  const [newQuestion, setNewQuestion] = useState({
    text: "",
    subject: "",
    chapter: "",
    difficulty: 1,
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: ""
  });

  const handleAddQuestion = () => {
    console.log("Adding new question:", newQuestion);
    // Reset form
    setNewQuestion({
      text: "",
      subject: "",
      chapter: "",
      difficulty: 1,
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: ""
    });
  };

  const handleEditQuestion = (questionId: string) => {
    console.log(`Edit question: ${questionId}`);
  };

  const handleDeleteQuestion = (questionId: string) => {
    console.log(`Delete question: ${questionId}`);
  };

  const handleCSVUpload = () => {
    console.log("CSV upload triggered");
  };

  const filteredQuestions = mockQuestions.filter(q => {
    const matchesSearch = q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         q.chapter.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === "all" || q.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const stats = {
    totalQuestions: mockQuestions.length,
    totalUsers: 1247,
    testsToday: 89,
    averageScore: 67.5
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-foreground">Admin Panel</h1>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" data-testid="badge-admin-role">Admin</Badge>
              <Button variant="outline" data-testid="button-logout">Logout</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-semibold" data-testid="text-total-questions">{stats.totalQuestions}</div>
              <div className="text-sm text-muted-foreground">Total Questions</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-chart-2 mx-auto mb-2" />
              <div className="text-2xl font-semibold" data-testid="text-total-users">{stats.totalUsers}</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-8 w-8 text-chart-3 mx-auto mb-2" />
              <div className="text-2xl font-semibold" data-testid="text-tests-today">{stats.testsToday}</div>
              <div className="text-sm text-muted-foreground">Tests Today</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-8 w-8 text-chart-4 mx-auto mb-2" />
              <div className="text-2xl font-semibold" data-testid="text-average-score">{stats.averageScore}%</div>
              <div className="text-sm text-muted-foreground">Avg Score</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="questions" className="space-y-6">
          <TabsList className="grid w-full lg:w-96 grid-cols-3">
            <TabsTrigger value="questions">Question Bank</TabsTrigger>
            <TabsTrigger value="add-question">Add Question</TabsTrigger>
            <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-4">
            {/* Search and Filter */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search questions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="input-search-questions"
                      />
                    </div>
                  </div>
                  
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-48" data-testid="select-subject-filter">
                      <SelectValue placeholder="Filter by subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      <SelectItem value="Physics">Physics</SelectItem>
                      <SelectItem value="Chemistry">Chemistry</SelectItem>
                      <SelectItem value="Biology">Biology</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Questions List */}
            <div className="space-y-4">
              {filteredQuestions.map((question) => (
                <Card key={question.id} className="hover-elevate">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <p className="text-base leading-relaxed" data-testid={`text-question-${question.id}`}>
                          {question.text}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" data-testid={`badge-subject-${question.id}`}>
                            {question.subject}
                          </Badge>
                          <Badge variant="secondary" data-testid={`badge-chapter-${question.id}`}>
                            {question.chapter}
                          </Badge>
                          <Badge 
                            variant={question.difficulty >= 4 ? "destructive" : 
                                    question.difficulty >= 3 ? "secondary" : "outline"}
                            data-testid={`badge-difficulty-${question.id}`}
                          >
                            Level {question.difficulty}
                          </Badge>
                          {question.previousYear && (
                            <Badge variant="default" data-testid={`badge-previous-year-${question.id}`}>
                              {question.year}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditQuestion(question.id)}
                          data-testid={`button-edit-${question.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteQuestion(question.id)}
                          data-testid={`button-delete-${question.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2">
                      {question.options.map((option, index) => (
                        <div key={index} className={`text-sm p-2 rounded ${
                          index === question.correctAnswer ? 'bg-green-100 text-green-800' : 'bg-muted'
                        }`}>
                          {String.fromCharCode(65 + index)}. {option}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="add-question" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New Question</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Select value={newQuestion.subject} onValueChange={(value) => 
                      setNewQuestion(prev => ({ ...prev, subject: value }))
                    }>
                      <SelectTrigger data-testid="select-new-question-subject">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Physics">Physics</SelectItem>
                        <SelectItem value="Chemistry">Chemistry</SelectItem>
                        <SelectItem value="Biology">Biology</SelectItem>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="difficulty">Difficulty Level</Label>
                    <Select value={newQuestion.difficulty.toString()} onValueChange={(value) =>
                      setNewQuestion(prev => ({ ...prev, difficulty: parseInt(value) }))
                    }>
                      <SelectTrigger data-testid="select-new-question-difficulty">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Level 1 (Easy)</SelectItem>
                        <SelectItem value="2">Level 2 (Medium)</SelectItem>
                        <SelectItem value="3">Level 3 (Hard)</SelectItem>
                        <SelectItem value="4">Level 4 (Very Hard)</SelectItem>
                        <SelectItem value="5">Level 5 (Expert)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="chapter">Chapter</Label>
                  <Input
                    id="chapter"
                    placeholder="Enter chapter name"
                    value={newQuestion.chapter}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, chapter: e.target.value }))}
                    data-testid="input-new-question-chapter"
                  />
                </div>

                <div>
                  <Label htmlFor="question-text">Question Text</Label>
                  <Textarea
                    id="question-text"
                    placeholder="Enter the question..."
                    value={newQuestion.text}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, text: e.target.value }))}
                    rows={3}
                    data-testid="textarea-new-question-text"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Options</Label>
                  {newQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-sm font-medium w-6">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <Input
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...newQuestion.options];
                          newOptions[index] = e.target.value;
                          setNewQuestion(prev => ({ ...prev, options: newOptions }));
                        }}
                        data-testid={`input-new-question-option-${index}`}
                      />
                      <Button
                        variant={newQuestion.correctAnswer === index ? "default" : "outline"}
                        size="sm"
                        onClick={() => setNewQuestion(prev => ({ ...prev, correctAnswer: index }))}
                        data-testid={`button-correct-answer-${index}`}
                      >
                        Correct
                      </Button>
                    </div>
                  ))}
                </div>

                <div>
                  <Label htmlFor="explanation">Explanation</Label>
                  <Textarea
                    id="explanation"
                    placeholder="Enter detailed explanation..."
                    value={newQuestion.explanation}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                    rows={3}
                    data-testid="textarea-new-question-explanation"
                  />
                </div>

                <Button onClick={handleAddQuestion} className="w-full" data-testid="button-add-question">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk-upload">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Upload Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Upload CSV File</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload questions in CSV format with columns: question, subject, chapter, difficulty, options, answer, explanation
                  </p>
                  <Button onClick={handleCSVUpload} data-testid="button-csv-upload">
                    Choose File
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <h4 className="font-medium mb-2">CSV Format Requirements:</h4>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Header row required: question,subject,chapter,difficulty,option_a,option_b,option_c,option_d,correct_answer,explanation</li>
                    <li>Difficulty should be a number from 1-5</li>
                    <li>Correct answer should be the option letter (A, B, C, or D)</li>
                    <li>Maximum file size: 10MB</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}