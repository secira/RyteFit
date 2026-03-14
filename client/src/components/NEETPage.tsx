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
  ChevronRight
} from "lucide-react";
import Header from "./Header";
import { Link } from "wouter";

export default function NEETPage() {
  const subjects = [
    { name: "Physics", questions: 45, marks: 180 },
    { name: "Chemistry", questions: 45, marks: 180 },
    { name: "Biology", questions: 90, marks: 360 }
  ];

  const programs = [
    "MBBS - Bachelor of Medicine and Bachelor of Surgery",
    "BDS - Bachelor of Dental Surgery",
    "BAMS - Bachelor of Ayurveda, Medicine, and Surgery",
    "BUMS - Bachelor in Unani Medicine and Surgery",
    "BHMS - Bachelor of Homeopathic Medicine and Surgery",
    "BSMS - Bachelor of Siddha Medicine and Surgery",
    "Veterinary Sciences and Animal Husbandry",
    "B.Sc. (Hons) Nursing",
    "Bachelor of Physiotherapy"
  ];

  const cutoffs = [
    { category: "UR/EWS", percentile: 50, cutoff: "720-164" },
    { category: "OBC, SC, ST", percentile: 40, cutoff: "163-129" },
    { category: "UR/EWS & PH", percentile: 45, cutoff: "163-146" },
    { category: "OBC & PH", percentile: 40, cutoff: "145-129" },
    { category: "ST & PH", percentile: 40, cutoff: "141-129" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Header */}
      <div className="bg-primary/5 border-b">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">National Eligibility cum Entrance Test</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="heading-neet">NEET 2026</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              NEET (UG) is a pre-medical entrance test for students aspiring to secure admission 
              in undergraduate medical programs at government, private colleges, and international institutions.
            </p>
            <div className="flex justify-center">
              <Link href="/api/login">
                <Button size="lg" className="px-8" data-testid="button-start-neet-prep">
                  Start NEET Preparation
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
              <div className="text-2xl font-bold">15 Lakh+</div>
              <div className="text-sm text-muted-foreground">Students Appear</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <GraduationCap className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">542</div>
              <div className="text-sm text-muted-foreground">Medical Colleges</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">180</div>
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
                  NEET 2026 Important Dates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Application Form Submission</span>
                    <Badge variant="outline">February 2026</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Last Date to Apply</span>
                    <Badge variant="outline">March 2026</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Admit Card Release</span>
                    <Badge variant="outline">April 2026</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Exam Date</span>
                    <Badge variant="default">May 2026</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">Result Declaration</span>
                    <Badge variant="outline">June 2026</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exam Pattern */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  NEET Exam Pattern 2026
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-semibold">Subject</th>
                        <th className="text-center py-2 font-semibold">Questions</th>
                        <th className="text-center py-2 font-semibold">Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((subject, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-3 font-medium">{subject.name}</td>
                          <td className="text-center py-3">{subject.questions}</td>
                          <td className="text-center py-3">{subject.marks}</td>
                        </tr>
                      ))}
                      <tr className="border-b font-semibold bg-muted/50">
                        <td className="py-3">Total</td>
                        <td className="text-center py-3">180</td>
                        <td className="text-center py-3">720</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm">
                    <strong>Marking Scheme:</strong> +4 marks for correct answer, -1 mark for wrong answer
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cutoff Marks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  NEET 2024 Cutoff Marks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-semibold">Category</th>
                        <th className="text-center py-2 font-semibold">Percentile</th>
                        <th className="text-center py-2 font-semibold">Score Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cutoffs.map((cutoff, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-3 font-medium">{cutoff.category}</td>
                          <td className="text-center py-3">{cutoff.percentile}th</td>
                          <td className="text-center py-3">{cutoff.cutoff}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Programs Offered */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Programs Available Through NEET
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {programs.map((program, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{program}</span>
                    </div>
                  ))}
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
                  <span className="text-sm">Pen and paper mode (OMR-based)</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm">Once in a year</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm">Minimum age: 17 years</span>
                </div>
              </CardContent>
            </Card>

            {/* Preparation Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Preparation Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>• Focus on NCERT textbooks</div>
                <div>• Practice previous year questions</div>
                <div>• Take regular mock tests</div>
                <div>• Maintain a study schedule</div>
                <div>• Clear your doubts regularly</div>
                <Link href="/dashboard">
                  <Button variant="ghost" className="p-0 h-auto text-primary">
                    Start your preparation →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}