import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ThemeToggle from "./ThemeToggle";
import { 
  BookOpen, 
  BarChart3, 
  HelpCircle, 
  Trophy,
  User,
  LogOut,
  Home,
  CreditCard
} from "lucide-react";

interface DashboardProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
  children: React.ReactNode;
}

export default function Dashboard({ currentSection, onSectionChange, children }: DashboardProps) {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access the dashboard.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "test-center", label: "Test Center", icon: BookOpen },
    { id: "performance", label: "Performance", icon: BarChart3 },
    { id: "doubt-clearing", label: "Doubt Clearing", icon: HelpCircle },
    { id: "all-india-exams", label: "All India Exams", icon: Trophy },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "profile", label: "Profile", icon: User },
  ];

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getUserInitials = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarContent>
            {/* User Profile Section */}
            <SidebarGroup>
              <div className="px-4 py-4 border-b border-sidebar-border">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={(user as any)?.profileImageUrl} alt="User" />
                    <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {(user as any)?.firstName ? `${(user as any).firstName} ${(user as any).lastName}` : (user as any)?.email}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60 truncate">
                      {(user as any)?.planType?.charAt(0).toUpperCase() + (user as any)?.planType?.slice(1)} Plan
                    </p>
                  </div>
                </div>
              </div>
            </SidebarGroup>

            {/* Navigation Menu */}
            <SidebarGroup>
              <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton 
                          asChild
                          data-active={currentSection === item.id}
                        >
                          <button 
                            onClick={() => onSectionChange(item.id)}
                            className="w-full"
                            data-testid={`sidebar-${item.id}`}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Logout Button */}
            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  className="w-full justify-start"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b border-border bg-card">
            <div className="flex items-center space-x-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h1 className="text-xl font-semibold text-foreground capitalize">
                  {currentSection.replace("-", " ")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {(user as any)?.firstName || "Student"}!
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
            </div>
          </header>
          
          <main className="flex-1 overflow-hidden bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}