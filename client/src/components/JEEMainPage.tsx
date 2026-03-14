import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Users, 
  GraduationCap,
  FileText,
  Target,
  Award,
  ChevronRight,
  Monitor
} from "lucide-react";
import Header from "./Header";
import { Link } from "wouter";

export default function JEEMainPage() {
  const subjects = [
    { name: "Physics", questions: 25, marks: 100 },
    { name: "Chemistry", questions: 25, marks: 100 },
    { name: "Mathematics", questions: 25, marks: 100 }
  ];

  const papers = [
    {
      paper: "Paper 1 (B.E./B.Tech)",
      subjects: "Physics, Chemistry, Mathematics",
      duration: "3 hours",
      totalMarks: 300
    },
    {
      paper: "Paper 2A (B.Arch)",
      subjects: "Mathematics, Aptitude Test, Drawing Test",
      duration: "3 hours",
      totalMarks: 300
    },
    {
      paper: "Paper 2B (B.Planning)",
      subjects: "Mathematics, Aptitude Test, Planning Test",
      duration: "3 hours",
      totalMarks: 400
    }
  ];

  const cutoffs = [
    { category: "General", percentile: "93.1023262", year: "2025" },
    { category: "EWS", percentile: "80.3830119", year: "2025" },
    { category: "OBC-NCL", percentile: "79.4313582", year: "2025" },
    { category: "SC", percentile: "61.1526933", year: "2025" },
    { category: "ST", percentile: "47.9026465", year: "2025" }
  ];

  const eligibilitySubjects = [
    { program: "B.E./B.Tech.", subjects: "Physics, Mathematics, and any one of (Chemistry, Biology, Biotechnology, or Technical Vocational Subjects)" },
    { program: "B.Arch.", subjects: "Mathematics, Physics, and Chemistry" },
    { program: "B.Plan.", subjects: "Mathematics" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Header */}
      <div className="bg-primary/5 border-b">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">Joint Entrance Examination (Main)</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="heading-jee-main">JEE Main 2026</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              JEE Main is a nationwide computer-based engineering exam conducted by NTA for admission 
              to undergraduate courses (B.E./B.Tech/B.Planning/B.Arch) at NITs, IIITs, CFTIs, and other institutions.
            </p>
            <div className="flex justify-center">
              <Link href="/api/login">
                <Button size="lg" className="px-8" data-testid="button-start-jee-prep">
                  Start JEE Preparation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardContent className="p-6">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">10 Lakh+</div>
              <div className="text-sm text-muted-foreground">Students Appear</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <Monitor className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">2</div>
              <div className="text-sm text-muted-foreground">Sessions/Year</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">75</div>
              <div className="text-sm text-muted-foreground">Total Questions</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">3</div>
              <div className="text-sm text-muted-foreground">Hours Duration</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Important Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  JEE Main 2026 Important Dates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold mb-3 text-primary">Session 1</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm">Application Forms</span>
                        <Badge variant="outline" className="text-xs">October 2025</Badge>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm">Correction Window</span>
                        <Badge variant="outline" className="text-xs">November 2025</Badge>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm">Admit Card</span>
                        <Badge variant="outline" className="text-xs">December 2025</Badge>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium">Exam Date</span>
                        <Badge variant="default" className="text-xs">January 2026</Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-primary">Session 2</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm">Application Forms</span>
                        <Badge variant="outline" className="text-xs">February 2026</Badge>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm">Correction Window</span>
                        <Badge variant="outline" className="text-xs">February 2026</Badge>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm">Admit Card</span>
                        <Badge variant="outline" className="text-xs">March 2026</Badge>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium">Exam Date</span>
                        <Badge variant="default" className="text-xs">April 2026</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exam Pattern */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  JEE Main Exam Pattern 2026
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {papers.map((paper, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">{paper.paper}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Subjects:</span>
                        <p className="font-medium">{paper.subjects}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <p className="font-medium">{paper.duration}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Marks:</span>
                        <p className="font-medium">{paper.totalMarks}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm">
                    <strong>Marking Scheme:</strong> +4 marks for correct answer, -1 mark for wrong answer (MCQs only)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cutoff Percentiles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  JEE Main 2025 Cutoff Percentiles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-semibold">Category</th>
                        <th className="text-center py-2 font-semibold">Percentile</th>
                        <th className="text-center py-2 font-semibold">Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cutoffs.map((cutoff, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-3 font-medium">{cutoff.category}</td>
                          <td className="text-center py-3">{cutoff.percentile}</td>
                          <td className="text-center py-3">{cutoff.year}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Eligibility Criteria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Subject Criteria in Qualifying Exam
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {eligibilitySubjects.map((item, index) => (
                    <div key={index} className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">{item.program}</h4>
                      <p className="text-sm text-muted-foreground">{item.subjects}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">Age Criteria</h4>
                  <p className="text-sm">There is no age limit. Eligible candidates include those who passed class 12th in 2024, 2025 or appearing in 2026.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Key Highlights */}
            <Card>
              <CardHeader>
                <CardTitle>Key Highlights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm">Conducted by National Testing Agency (NTA)</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm">Available in 13 languages</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm">Computer-based test (CBT)</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm">Twice in a year (January & April)</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm">Gateway to JEE Advanced</span>
                </div>
              </CardContent>
            </Card>

            {/* Preparation Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Preparation Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>• Focus on NCERT concepts</div>
                <div>• Solve previous year papers</div>
                <div>• Take regular mock tests</div>
                <div>• Practice numerical problems</div>
                <div>• Time management is crucial</div>
                <Link href="/dashboard">
                  <Button variant="ghost" className="p-0 h-auto text-primary">
                    Start your preparation →
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Languages Available */}
            <Card>
              <CardHeader>
                <CardTitle>Exam Languages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>• English</div>
                  <div>• Hindi</div>
                  <div>• Assamese</div>
                  <div>• Bengali</div>
                  <div>• Gujarati</div>
                  <div>• Malayalam</div>
                  <div>• Kannada</div>
                  <div>• Marathi</div>
                  <div>• Odia</div>
                  <div>• Tamil</div>
                  <div>• Telugu</div>
                  <div>• Urdu</div>
                  <div>• Punjabi</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}