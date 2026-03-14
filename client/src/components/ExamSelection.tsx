import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Award, BookOpen } from "lucide-react";
import { useState } from "react";

interface ExamOption {
  id: string;
  title: string;
  description: string;
  subjects: string[];
  duration: number;
  questions: number;
  difficulty: string;
  price: number;
}

export default function ExamSelection() {
  const [selectedExam, setSelectedExam] = useState<string>("");

  // todo: remove mock functionality
  const examOptions: ExamOption[] = [
    {
      id: "neet-mock",
      title: "NEET Mock Test",
      description: "Complete NEET simulation with 180 questions",
      subjects: ["Physics", "Chemistry", "Biology"],
      duration: 180,
      questions: 180,
      difficulty: "Mixed",
      price: 0
    },
    {
      id: "jee-main-mock",
      title: "JEE Main Mock Test",
      description: "JEE Main pattern with 75 questions",
      subjects: ["Physics", "Chemistry", "Mathematics"],
      duration: 180,
      questions: 75,
      difficulty: "Mixed",
      price: 0
    },
    {
      id: "neet-practice",
      title: "NEET Practice Set",
      description: "Subject-wise practice with custom difficulty",
      subjects: ["Physics", "Chemistry", "Biology"],
      duration: 60,
      questions: 45,
      difficulty: "Customizable",
      price: 200
    },
    {
      id: "jee-practice",
      title: "JEE Practice Set",
      description: "Chapter-wise practice with detailed solutions",
      subjects: ["Physics", "Chemistry", "Mathematics"],
      duration: 90,
      questions: 30,
      difficulty: "Customizable",
      price: 200
    }
  ];

  const handleSelectExam = (examId: string) => {
    setSelectedExam(examId);
    console.log(`Selected exam: ${examId}`);
  };

  const handleStartExam = () => {
    if (selectedExam) {
      console.log(`Starting exam: ${selectedExam}`);
    }
  };

  const handleGoBack = () => {
    console.log("Navigate back to dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={handleGoBack} data-testid="button-back">
              ← Back
            </Button>
            <h1 className="text-2xl font-semibold text-foreground">Select Your Test</h1>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Tests Available: 5</span>
            <Badge variant="secondary" data-testid="badge-plan">
              Standard Plan
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl text-foreground">Choose your exam type</h2>
            <p className="text-muted-foreground">Select from NEET or JEE mock tests and practice sets</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {examOptions.map((exam) => (
              <Card 
                key={exam.id}
                className={`hover-elevate cursor-pointer transition-all ${
                  selectedExam === exam.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleSelectExam(exam.id)}
                data-testid={`card-exam-${exam.id}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <span>{exam.title}</span>
                    </CardTitle>
                    {exam.price > 0 ? (
                      <Badge variant="secondary" data-testid={`badge-price-${exam.id}`}>
                        ₹{exam.price}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Free
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{exam.description}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {exam.subjects.map((subject) => (
                      <Badge key={subject} variant="outline" data-testid={`badge-subject-${subject.toLowerCase()}`}>
                        {subject}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{exam.duration}min</span>
                    </div>
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{exam.questions}Q</span>
                    </div>
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Award className="h-4 w-4" />
                      <span>{exam.difficulty}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center space-y-4">
            <Button 
              onClick={handleStartExam}
              disabled={!selectedExam}
              size="lg"
              className="px-8"
              data-testid="button-start-selected-exam"
            >
              {selectedExam ? "Start Test" : "Select a test to continue"}
            </Button>
            
            {selectedExam && (
              <p className="text-sm text-muted-foreground">
                You selected: {examOptions.find(e => e.id === selectedExam)?.title}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}