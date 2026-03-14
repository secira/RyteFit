import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Share2, 
  FileSearch, 
  Video, 
  Users, 
  Bell, 
  CheckCircle2, 
  Play,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/Header";
import { useState } from "react";

const HowItWorksPage = () => {
  const [videoUrl, setVideoUrl] = useState("");
  
  // This can be updated to show an actual video when available
  const hasVideo = videoUrl && videoUrl.length > 0;

  const steps = [
    {
      number: 1,
      icon: FileText,
      title: "AI Job Description Creation",
      description: "Our AI-powered system generates professional, detailed job descriptions tailored to your requirements.",
      features: [
        "GPT-4 powered job description generation",
        "Competency extraction and skills mapping",
        "Industry-standard formatting",
        "Customizable templates"
      ],
      color: "blue"
    },
    {
      number: 2,
      icon: Share2,
      title: "Job Posting",
      description: "Automatically distribute your job posting across multiple platforms and channels.",
      features: [
        "Multi-platform job distribution",
        "Integrated job boards",
        "Social media sharing",
        "Track application sources"
      ],
      color: "green"
    },
    {
      number: 3,
      icon: FileSearch,
      title: "AI Resume Screening",
      description: "AI analyzes resumes, extracts key information, and ranks candidates based on job requirements.",
      features: [
        "Automated resume parsing",
        "Skills extraction and matching",
        "Experience verification",
        "Qualification scoring"
      ],
      color: "purple"
    },
    {
      number: 4,
      icon: Video,
      title: "AI Video Interview Evaluation",
      description: "AI conducts and evaluates video interviews, assessing both technical skills and soft competencies.",
      features: [
        "Automated video transcription",
        "Communication assessment",
        "Confidence scoring",
        "Technical competency evaluation"
      ],
      color: "orange"
    },
    {
      number: 5,
      icon: Users,
      title: "AI Candidate Ranking",
      description: "Advanced AI algorithms compare all candidates using multi-dimensional scoring for final ranking.",
      features: [
        "Multi-dimensional evaluation",
        "Weighted scoring system",
        "Comparative analysis",
        "Data-driven recommendations"
      ],
      color: "pink"
    },
    {
      number: 6,
      icon: Bell,
      title: "Reporting & Notifications",
      description: "Comprehensive reports and automated notifications keep all stakeholders informed throughout the process.",
      features: [
        "Real-time status updates",
        "Email notifications",
        "Detailed analytics reports",
        "Candidate feedback system"
      ],
      color: "teal"
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; border: string; icon: string }> = {
      blue: { 
        bg: "bg-blue-50 dark:bg-blue-950/20", 
        text: "text-blue-700 dark:text-blue-300", 
        border: "border-blue-200 dark:border-blue-800",
        icon: "text-blue-600 dark:text-blue-400"
      },
      green: { 
        bg: "bg-green-50 dark:bg-green-950/20", 
        text: "text-green-700 dark:text-green-300", 
        border: "border-green-200 dark:border-green-800",
        icon: "text-green-600 dark:text-green-400"
      },
      purple: { 
        bg: "bg-purple-50 dark:bg-purple-950/20", 
        text: "text-purple-700 dark:text-purple-300", 
        border: "border-purple-200 dark:border-purple-800",
        icon: "text-purple-600 dark:text-purple-400"
      },
      orange: { 
        bg: "bg-orange-50 dark:bg-orange-950/20", 
        text: "text-orange-700 dark:text-orange-300", 
        border: "border-orange-200 dark:border-orange-800",
        icon: "text-orange-600 dark:text-orange-400"
      },
      pink: { 
        bg: "bg-pink-50 dark:bg-pink-950/20", 
        text: "text-pink-700 dark:text-pink-300", 
        border: "border-pink-200 dark:border-pink-800",
        icon: "text-pink-600 dark:text-pink-400"
      },
      teal: { 
        bg: "bg-teal-50 dark:bg-teal-950/20", 
        text: "text-teal-700 dark:text-teal-300", 
        border: "border-teal-200 dark:border-teal-800",
        icon: "text-teal-600 dark:text-teal-400"
      }
    };
    return colorMap[color];
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered Hiring Process
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            How It Works
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Our 6-step AI-powered workflow streamlines your entire hiring process, 
            from job creation to candidate selection. Save time, reduce bias, and hire better talent.
          </p>
        </div>
      </div>

      {/* Video Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {hasVideo ? (
                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={videoUrl}
                    title="How RyteFit Works"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div 
                  className="relative w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center" 
                  style={{ minHeight: "400px" }}
                >
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <Play className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-semibold">Platform Demo Video</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Watch our comprehensive video guide to see how RyteFit transforms your hiring process.
                    </p>
                    <p className="text-sm text-muted-foreground italic">
                      Video coming soon...
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 6-Step Process */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">The 6-Step Hiring Workflow</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Each step is powered by advanced AI to ensure efficient, unbiased, and data-driven hiring decisions.
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-8">
          {steps.map((step, index) => {
            const colors = getColorClasses(step.color);
            const Icon = step.icon;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.number} className="relative">
                <Card className={`border-2 ${colors.border} hover-elevate`} data-testid={`card-step-${step.number}`}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-7 w-7 ${colors.icon}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={colors.bg}>
                            <span className={colors.text}>Step {step.number}</span>
                          </Badge>
                        </div>
                        <CardTitle className="text-2xl mb-2">{step.title}</CardTitle>
                        <CardDescription className="text-base">{step.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="ml-[4.5rem] space-y-3">
                      <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Key Features:</h4>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {step.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Connector Arrow */}
                {!isLast && (
                  <div className="flex justify-center my-4">
                    <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose RyteFit?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle>Save Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Automate 80% of your screening process. What used to take weeks now takes days.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle>Reduce Bias</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    AI-driven evaluation ensures fair, objective assessment of every candidate.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle>Better Hires</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Data-driven insights help you identify candidates who are the best fit for your roles.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Hiring?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start with our free plan and experience the power of AI-driven recruitment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild data-testid="button-get-started">
              <Link href="/auth/login">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild data-testid="button-view-pricing">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;
