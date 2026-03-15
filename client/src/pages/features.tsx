import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Brain,
  FileText,
  Video,
  BarChart3,
  Users,
  Zap,
  Shield,
  Globe,
  ClipboardList,
  MessageSquare,
  Star,
  Clock,
  CheckCircle,
  ArrowRight,
  Layers,
  Search,
  Award,
  Bell,
} from "lucide-react";

const features = [
  {
    category: "AI Interview Engine",
    badge: "Core",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    icon: Brain,
    iconBg: "bg-blue-50 dark:bg-blue-950",
    iconColor: "text-blue-600 dark:text-blue-400",
    headline: "GPT-4o Powered Question Generation",
    description:
      "Automatically generate role-specific, competency-based interview questions using GPT-4o. Every question set is tailored to the job description, ensuring consistent and relevant evaluations for every candidate.",
    points: [
      "Role-specific question banks built from job descriptions",
      "Covers technical, behavioral, and situational competencies",
      "Text-to-speech delivery for a professional interview experience",
      "Per-question timers to keep interviews structured",
    ],
  },
  {
    category: "Resume Screening",
    badge: "Popular",
    badgeColor: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    icon: FileText,
    iconBg: "bg-green-50 dark:bg-green-950",
    iconColor: "text-green-600 dark:text-green-400",
    headline: "Bulk Resume Upload & AI Parsing",
    description:
      "Upload hundreds of resumes at once — PDF or Word — and let AI parse, score, and rank candidates against your job requirements in seconds. No more manual shortlisting.",
    points: [
      "Bulk upload up to 100 resumes simultaneously",
      "AI parsing with GPT-4o for structured data extraction",
      "Automatic scoring and candidate ranking",
      "Duplicate application prevention built-in",
    ],
  },
  {
    category: "Video Interviews",
    badge: "Core",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    icon: Video,
    iconBg: "bg-purple-50 dark:bg-purple-950",
    iconColor: "text-purple-600 dark:text-purple-400",
    headline: "Asynchronous AI-Assisted Video Interviews",
    description:
      "Candidates complete interviews at their own pace via a shareable link. Continuous video recording captures each answer, with live transcription and voice-based responses — no scheduling coordination needed.",
    points: [
      "Shareable interview link — no app download required",
      "Continuous video recording with Whisper transcription",
      "Voice-only answer mode with live speech-to-text",
      "Interview replay for team review at any time",
    ],
  },
  {
    category: "Candidate Evaluation",
    badge: "AI-Powered",
    badgeColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    icon: Award,
    iconBg: "bg-orange-50 dark:bg-orange-950",
    iconColor: "text-orange-600 dark:text-orange-400",
    headline: "Multi-Dimensional AI Scoring",
    description:
      "A LangGraph-based agentic evaluation workflow scores every candidate across five dimensions — giving your team data-backed hiring confidence instead of gut instinct.",
    points: [
      "5-dimension scoring: Technical, Communication, Problem Solving, Confidence, Overall",
      "AI recommendation: Strong Hire / Maybe / No Hire",
      "Sentiment analysis on interview responses",
      "Side-by-side candidate comparison and ranking",
    ],
  },
  {
    category: "Hiring Workflow",
    badge: "Automation",
    badgeColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    icon: Layers,
    iconBg: "bg-indigo-50 dark:bg-indigo-950",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    headline: "7-Step Automated Recruitment Pipeline",
    description:
      "RyteFit's agentic workflow system manages the entire hiring lifecycle — from job creation to final decision — using an event-driven orchestration engine powered by PostgreSQL LISTEN/NOTIFY.",
    points: [
      "Job Created → Posted → Resumes Uploaded → Interview Scheduled",
      "Interview Completed → Evaluated → Final Decision",
      "Autonomous agents coordinate via event bus and task queue",
      "Real-time workflow status visible to recruiters",
    ],
  },
  {
    category: "Job Management",
    badge: "Multi-Platform",
    badgeColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    icon: Globe,
    iconBg: "bg-cyan-50 dark:bg-cyan-950",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    headline: "Post Jobs Across Multiple Platforms",
    description:
      "Manage job postings from a single dashboard and distribute them across your career site, LinkedIn, Indeed, and more. AI extracts competencies from your job description automatically.",
    points: [
      "RyteFit Career Site, LinkedIn, Indeed, and more",
      "AI-driven competency extraction from job descriptions",
      "Public Job API for external resume sites",
      "Cascade delete keeps data clean when jobs are removed",
    ],
  },
  {
    category: "Analytics & Reports",
    badge: "Insights",
    badgeColor: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    icon: BarChart3,
    iconBg: "bg-rose-50 dark:bg-rose-950",
    iconColor: "text-rose-600 dark:text-rose-400",
    headline: "Exportable Reports & Hiring Analytics",
    description:
      "Track every stage of your hiring pipeline with rich analytics. Export candidate evaluation reports, compare cohorts, and make data-driven decisions that your leadership team can understand.",
    points: [
      "Pipeline funnel analytics across all active jobs",
      "Per-candidate evaluation report export",
      "Time-to-hire and screening efficiency metrics",
      "Company-wide hiring trends over time",
    ],
  },
  {
    category: "Security & Compliance",
    badge: "Enterprise",
    badgeColor: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    icon: Shield,
    iconBg: "bg-slate-50 dark:bg-slate-900",
    iconColor: "text-slate-600 dark:text-slate-400",
    headline: "GDPR-Ready with End-to-End Security",
    description:
      "Built from the ground up with enterprise-grade security. Role-based access, consent management, and data retention controls keep your hiring data safe and compliant.",
    points: [
      "Role-based access: Company Admin & Recruiter roles",
      "GDPR compliance with consent management",
      "Data retention and right-to-delete support",
      "Rate limiting, helmet security headers, and audit logging",
    ],
  },
];

const stats = [
  { value: "70%", label: "Reduction in time-to-screen" },
  { value: "3x", label: "Faster shortlisting" },
  { value: "94%", label: "Evaluation accuracy" },
  { value: "100%", label: "Async — no scheduling needed" },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950 text-white py-20">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <Badge className="mb-4 bg-white/20 text-white border-0 hover:bg-white/20">
            Enterprise-Grade Hiring Platform
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
            Everything your HR team needs,<br className="hidden md:block" /> powered by AI
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-8">
            RyteFit brings enterprise-level recruitment capabilities to SMBs — AI interviews, intelligent screening, automated workflows, and deep analytics, all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth">
              <Button size="lg" className="bg-white text-blue-800 hover:bg-blue-50 font-semibold px-8" data-testid="button-get-started-hero">
                Get started <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10" data-testid="button-how-it-works">
                See how it works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center" data-testid={`stat-${stat.label.replace(/\s+/g, '-').toLowerCase()}`}>
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature sections — alternating layout */}
      <section className="py-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          const isEven = index % 2 === 0;
          return (
            <div
              key={feature.category}
              className={`py-16 ${isEven ? "bg-background" : "bg-muted/20"}`}
              data-testid={`feature-section-${feature.category.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="container mx-auto px-4 max-w-6xl">
                <div className={`flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"} gap-12 items-center`}>
                  {/* Text side */}
                  <div className="flex-1 space-y-5">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${feature.badgeColor}`}>
                        {feature.badge}
                      </span>
                      <span className="text-sm text-muted-foreground font-medium">{feature.category}</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-snug">
                      {feature.headline}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed text-base">
                      {feature.description}
                    </p>
                    <ul className="space-y-3">
                      {feature.points.map((point) => (
                        <li key={point} className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          <span className="text-sm text-foreground">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Visual side */}
                  <div className="flex-1 flex justify-center">
                    <div className={`w-64 h-64 rounded-3xl ${feature.iconBg} border border-border flex items-center justify-center shadow-sm`}>
                      <Icon className={`w-28 h-28 ${feature.iconColor} opacity-80`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Additional quick-feature grid */}
      <section className="py-16 bg-muted/20 border-t border-border">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">Everything else you need</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Beyond the core features, RyteFit includes a full suite of tools your team will use every day.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Search, title: "Candidate Search & Filter", desc: "Search applicants by skill, score, status, or job across your entire pipeline." },
              { icon: MessageSquare, title: "Interview Simulation", desc: "Candidates can practice the AI interview before the real one — improving answer quality." },
              { icon: Bell, title: "Email Notifications", desc: "Automated emails via Resend for interview invites, results, and status updates." },
              { icon: Clock, title: "Interview Scheduling", desc: "Send shareable interview links with expiry controls and session tracking." },
              { icon: ClipboardList, title: "Scoring Configuration", desc: "Customize scoring weights for each dimension to match your hiring priorities." },
              { icon: Star, title: "Candidate Ranking", desc: "Side-by-side ranked view of all candidates for a job, sortable by any score dimension." },
              { icon: Users, title: "Team Roles", desc: "Separate Company Admin and Recruiter roles with appropriate access controls." },
              { icon: Zap, title: "PWA Support", desc: "Installable as a Progressive Web App with offline caching and background sync." },
              { icon: Globe, title: "Public Job API", desc: "Let external resume platforms submit applications directly via the public REST API." },
            ].map((item) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-background border border-border rounded-xl p-5 space-y-3 hover:shadow-sm transition-shadow"
                  data-testid={`quick-feature-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ItemIcon className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950 text-white">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to transform your hiring?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Join hundreds of SMBs using RyteFit to hire faster, smarter, and with more confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth">
              <Button size="lg" className="bg-white text-blue-800 hover:bg-blue-50 font-semibold px-8" data-testid="button-get-started-cta">
                Request access <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10" data-testid="button-view-pricing">
                View pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
