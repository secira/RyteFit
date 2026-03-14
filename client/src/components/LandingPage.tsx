import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Video, Sparkles, Users, BarChart3, Clock, CheckCircle2, Zap, Target } from "lucide-react";
import { Link } from "wouter";
import Header from "./Header";

export default function LandingPage() {
  const handleStartTest = () => {
    window.location.href = '/auth';
  };

  const handleLogin = () => {
    window.location.href = '/auth';
  };

  const challenges = [
    {
      icon: Clock,
      title: "Time-Consuming Interviews",
      description: "Hours spent interviewing candidates who don't make it past the first round"
    },
    {
      icon: Users,
      title: "Inconsistent Evaluation",
      description: "Different interviewers using different criteria, leading to unfair assessments"
    },
    {
      icon: Target,
      title: "Limited Candidate Reach",
      description: "Scheduling conflicts and timezone barriers preventing you from interviewing top talent"
    },
    {
      icon: BarChart3,
      title: "Lack of Data-Driven Insights",
      description: "No structured way to compare candidates or track interview performance"
    }
  ];

  const solutions = [
    {
      icon: Video,
      title: "AI-Powered Video Interviews",
      description: "Conduct structured interviews with AI-generated questions tailored to job descriptions and automatic candidate evaluation"
    },
    {
      icon: Sparkles,
      title: "Automatic Question Generation",
      description: "AI creates role-specific questions based on job requirements, skills, and experience levels"
    },
    {
      icon: CheckCircle2,
      title: "Intelligent Candidate Scoring",
      description: "Real-time evaluation of technical skills, communication, confidence, and cultural fit"
    },
    {
      icon: Zap,
      title: "Async & Live Interview Modes",
      description: "Support both pre-recorded AI interviews and live AI-assisted interviews for flexibility"
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Post Your Job",
      description: "Create a job posting with requirements, skills, and qualifications. Our AI analyzes the job description."
    },
    {
      step: "2",
      title: "Candidates Apply",
      description: "Applicants submit their resumes and basic information through your custom application portal."
    },
    {
      step: "3",
      title: "AI Conducts Interviews",
      description: "Candidates complete AI-powered video interviews with automatically generated questions. AI evaluates responses in real-time."
    },
    {
      step: "4",
      title: "Review & Select",
      description: "Access ranked candidate lists with detailed scores, insights, and interview recordings. Make data-driven hiring decisions."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header onLogin={handleLogin} onGetStarted={handleStartTest} />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-16 md:py-24 space-y-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-semibold text-foreground mb-6 leading-tight">
              AI-Powered Interview Platform for Smarter Hiring
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Screen candidates 50x faster with AI-driven video interviews. Automatic question generation, real-time evaluation, and data-driven insights for recruiters and HR teams.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={handleStartTest}
              className="text-lg px-8 py-6"
              data-testid="button-start-free-trial"
            >
              Start Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={handleLogin}
              className="text-lg px-8 py-6"
              data-testid="button-watch-demo"
            >
              Watch Demo
            </Button>
          </div>

          {/* Trusted By Badge */}
          <p className="text-sm text-muted-foreground pt-8">
            Trusted by recruiters, HR teams, and staffing firms globally
          </p>
        </div>

        {/* The Challenge Section */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
              Still Spending Hours on Manual Interviews?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              For recruiters, HR managers, and talent acquisition teams, traditional interviewing remains one of the most time-consuming steps in the hiring process.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {challenges.map((challenge, index) => {
              const Icon = challenge.icon;
              return (
                <Card key={index} className="hover-elevate">
                  <CardContent className="p-6">
                    <Icon className="h-10 w-10 text-primary mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">{challenge.title}</h3>
                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* The Solution Section / Features */}
        <section id="features" className="py-16 bg-card/50 rounded-lg px-4 sm:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
              Meet Your AI-Powered Interview Assistant
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for recruiters, staffing agencies, and talent acquisition teams — conduct fast, consistent, and accurate candidate interviews without complexity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {solutions.map((solution, index) => {
              const Icon = solution.icon;
              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-md">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">{solution.title}</h3>
                        <p className="text-sm text-muted-foreground">{solution.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From job posting to candidate selection — streamline your entire interview process in 4 simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-semibold mx-auto">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-border" style={{ width: 'calc(100% - 4rem)' }} />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" onClick={handleStartTest} data-testid="button-get-started">
              Get Started Now
            </Button>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-card/50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto px-4">
            <div className="text-center">
              <div className="text-4xl font-semibold text-primary mb-2" data-testid="text-stat-time-saved">50x</div>
              <div className="text-sm text-muted-foreground">Faster Screening</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-semibold text-primary mb-2" data-testid="text-stat-companies">50+</div>
              <div className="text-sm text-muted-foreground">Companies</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-semibold text-primary mb-2" data-testid="text-stat-interviews">1000+</div>
              <div className="text-sm text-muted-foreground">Interviews Conducted</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-semibold text-primary mb-2" data-testid="text-stat-accuracy">95%</div>
              <div className="text-sm text-muted-foreground">Evaluation Accuracy</div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
              Ready to Transform Your Hiring Process?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join hundreds of companies using AI-powered interviews to hire better talent faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" onClick={handleStartTest} className="text-lg px-8 py-6" data-testid="button-start-trial-cta">
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6" data-testid="link-pricing">
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
