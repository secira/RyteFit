import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// Eagerly load only essential landing page components
import LandingPage from "./components/LandingPage";
import Footer from "./components/Footer";

// Lazy load all other components for better performance
const CandidateDashboard = lazy(() => import("./pages/candidate-dashboard"));
const CompanyDashboard = lazy(() => import("./pages/company-dashboard"));
const AdminDashboard = lazy(() => import("./pages/admin-dashboard"));
const PricingPage = lazy(() => import("./pages/pricing"));
const BlogPage = lazy(() => import("./pages/blog"));
const BlogPostPage = lazy(() => import("./pages/blog-post"));
const PrivacyPolicy = lazy(() => import("./pages/privacy-policy"));
const TermsOfService = lazy(() => import("./pages/terms-of-service"));
const RefundPolicy = lazy(() => import("./pages/refund-policy"));
const RiskDisclosure = lazy(() => import("./pages/risk-disclosure"));
const RegulatoryInfo = lazy(() => import("./pages/regulatory-info"));
const AuthPage = lazy(() => import("./pages/auth"));
const Profile = lazy(() => import("./pages/profile"));
const Settings = lazy(() => import("./pages/settings"));
const Subscription = lazy(() => import("./pages/subscription"));
const AdminUsers = lazy(() => import("./pages/admin-users"));
const SupportPage = lazy(() => import("./pages/support"));
const CompanyPage = lazy(() => import("./pages/company"));
const AIInterviewPage = lazy(() => import("./pages/ai-interview"));
const JobsPage = lazy(() => import("./pages/jobs"));
const ApplicationsPage = lazy(() => import("./pages/applications"));
const MyInterviewsPage = lazy(() => import("./pages/my-interviews"));
const CandidatesPage = lazy(() => import("./pages/candidates"));
const InterviewsPage = lazy(() => import("./pages/interviews"));
const ReportsPage = lazy(() => import("./pages/reports"));
const AdminCompaniesPage = lazy(() => import("./pages/admin-companies"));
const AdminAnalyticsPage = lazy(() => import("./pages/admin-analytics"));
const AdminSettingsPage = lazy(() => import("./pages/admin-settings"));
const WorkflowsPage = lazy(() => import("./pages/workflows"));
const JobPostingPage = lazy(() => import("./pages/job-posting"));
const ResumeScreeningPage = lazy(() => import("./pages/resume-screening"));
const ApplicantsDetailPage = lazy(() => import("./pages/applicants-detail"));
const InterviewEvaluationsPage = lazy(() => import("./pages/interview-evaluations"));
const CandidateRankingPage = lazy(() => import("./pages/candidate-ranking"));
const HowItWorksPage = lazy(() => import("./pages/how-it-works"));
const InterviewEvaluationPage = lazy(() => import("./pages/interview-evaluation"));
const CareersPage = lazy(() => import("./pages/careers"));
const ResumesPage = lazy(() => import("./pages/resumes"));
const PublicInterviewScheduling = lazy(() => import("./pages/public-interview-scheduling"));
const PublicInterview = lazy(() => import("./pages/public-interview"));
const InterviewComplete = lazy(() => import("./pages/interview-complete"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
      <Footer />
    </Suspense>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);
  
  if (isLoading) {
    return <PageLoader />;
  }
  
  if (!isAuthenticated) {
    return <PageLoader />;
  }
  
  return (
    <SidebarProvider style={{ "--sidebar-width": "16rem" } as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <DashboardHeader />
          <main className="flex-1 overflow-auto">
            <Suspense fallback={<PageLoader />}>
              <Component />
            </Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AuthenticatedDashboard() {
  const { user } = useAuth();
  
  if (!user) return <PageLoader />;
  
  const userRole = (user as any).role || 'candidate';
  
  switch (userRole) {
    case 'admin':
      return <AdminDashboard />;
    case 'company_admin':
    case 'recruiter':
      return <CompanyDashboard />;
    case 'candidate':
    default:
      return <CandidateDashboard />;
  }
}

function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <PageLoader />;
  }
  
  if (isAuthenticated) {
    return (
      <SidebarProvider style={{ "--sidebar-width": "16rem" } as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1">
            <DashboardHeader />
            <main className="flex-1 overflow-auto">
              <Suspense fallback={<PageLoader />}>
                <AuthenticatedDashboard />
              </Suspense>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }
  
  return (
    <Suspense fallback={<PageLoader />}>
      <LandingPage />
      <Footer />
    </Suspense>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={RootRoute} />
      <Route path="/interview/:token" component={() => <PublicRoute component={PublicInterviewScheduling} />} />
      <Route path="/public/interview-scheduling/:token" component={() => <PublicRoute component={PublicInterviewScheduling} />} />
      <Route path="/public/interview/:token" component={() => <PublicRoute component={PublicInterview} />} />
      <Route path="/interview-complete" component={() => <PublicRoute component={InterviewComplete} />} />
      <Route path="/careers" component={() => <PublicRoute component={CareersPage} />} />
      <Route path="/pricing" component={() => <PublicRoute component={PricingPage} />} />
      <Route path="/how-it-works" component={() => <PublicRoute component={HowItWorksPage} />} />
      <Route path="/blog" component={() => <PublicRoute component={BlogPage} />} />
      <Route path="/blog/:slug" component={() => <PublicRoute component={BlogPostPage} />} />
      <Route path="/privacy" component={() => <PublicRoute component={PrivacyPolicy} />} />
      <Route path="/terms" component={() => <PublicRoute component={TermsOfService} />} />
      <Route path="/refund" component={() => <PublicRoute component={RefundPolicy} />} />
      <Route path="/risk-disclosure" component={() => <PublicRoute component={RiskDisclosure} />} />
      <Route path="/regulatory" component={() => <PublicRoute component={RegulatoryInfo} />} />
      <Route path="/support" component={() => <PublicRoute component={SupportPage} />} />
      <Route path="/company" component={() => <PublicRoute component={CompanyPage} />} />
      <Route path="/auth" component={() => <PublicRoute component={AuthPage} />} />
      <Route path="/dashboard" component={RootRoute} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/subscription" component={() => <ProtectedRoute component={Subscription} />} />
      <Route path="/jobs" component={() => <ProtectedRoute component={JobsPage} />} />
      <Route path="/job-posting" component={() => <ProtectedRoute component={JobPostingPage} />} />
      <Route path="/resume-screening" component={() => <ProtectedRoute component={ResumeScreeningPage} />} />
      <Route path="/resume-screening/:jobPostingId" component={() => <ProtectedRoute component={ApplicantsDetailPage} />} />
      <Route path="/resume-screening/:jobPostingId/:candidateId" component={() => <ProtectedRoute component={ApplicantsDetailPage} />} />
      <Route path="/interview-evaluations" component={() => <ProtectedRoute component={InterviewEvaluationsPage} />} />
      <Route path="/applications" component={() => <ProtectedRoute component={ApplicationsPage} />} />
      <Route path="/resumes" component={() => <ProtectedRoute component={ResumesPage} />} />
      <Route path="/my-interviews" component={() => <ProtectedRoute component={MyInterviewsPage} />} />
      <Route path="/candidates" component={() => <ProtectedRoute component={CandidatesPage} />} />
      <Route path="/interviews" component={() => <ProtectedRoute component={InterviewsPage} />} />
      <Route path="/interview-evaluation/:id" component={() => <ProtectedRoute component={InterviewEvaluationPage} />} />
      <Route path="/candidate-ranking" component={() => <ProtectedRoute component={CandidateRankingPage} />} />
      <Route path="/reports" component={() => <ProtectedRoute component={ReportsPage} />} />
      <Route path="/workflows" component={() => <ProtectedRoute component={WorkflowsPage} />} />
      <Route path="/ai-interview" component={() => <ProtectedRoute component={AIInterviewPage} />} />
      <Route path="/ai-interview/:applicationId" component={() => <ProtectedRoute component={AIInterviewPage} />} />
      <Route path="/admin/users" component={() => <ProtectedRoute component={AdminUsers} />} />
      <Route path="/admin/companies" component={() => <ProtectedRoute component={AdminCompaniesPage} />} />
      <Route path="/admin/analytics" component={() => <ProtectedRoute component={AdminAnalyticsPage} />} />
      <Route path="/admin/settings" component={() => <ProtectedRoute component={AdminSettingsPage} />} />
      <Route component={() => <PublicRoute component={LandingPage} />} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppRouter />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
