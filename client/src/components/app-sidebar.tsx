import {
  Home,
  Settings,
  User,
  Briefcase,
  Users,
  Shield,
  Video,
  FileText,
  Building2,
  TrendingUp,
  UserCog,
  Calendar,
  Activity,
  Upload,
  Award,
  Bell,
  CreditCard,
  Plus,
} from "lucide-react";
import { Link, useLocation } from "wouter";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { type SelectUser } from "@shared/schema";

// Candidate menu items
const candidateMenuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "My Resume",
    url: "/resumes",
    icon: FileText,
  },
  {
    title: "My Applications",
    url: "/applications",
    icon: FileText,
  },
  {
    title: "My Interviews",
    url: "/my-interviews",
    icon: Video,
  },
];

// Company/Recruiter menu items
const companyMenuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  // AI Workflows - Hidden until product complete
  // {
  //   title: "AI Workflows",
  //   url: "/workflows",
  //   icon: Activity,
  // },
  {
    title: "Job Creation",
    url: "/jobs",
    icon: Plus,
  },
  {
    title: "Job Posting",
    url: "/job-posting",
    icon: Upload,
  },
  {
    title: "Resume Screening",
    url: "/resume-screening",
    icon: Users,
  },
  {
    title: "Interview Evaluation",
    url: "/interview-evaluations",
    icon: Video,
  },
  {
    title: "Candidate Ranking",
    url: "/candidate-ranking",
    icon: Award,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: Bell,
  },
];

// Admin menu items
const adminMenuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Companies",
    url: "/admin/companies",
    icon: Building2,
  },
  {
    title: "Platform Analytics",
    url: "/admin/analytics",
    icon: TrendingUp,
  },
  {
    title: "System Settings",
    url: "/admin/settings",
    icon: Settings,
  },
];

// Account menu items (shared across all roles)
const accountItems = [
  {
    title: "Profile",
    url: "/profile",
    icon: User,
  },
  {
    title: "Subscription",
    url: "/subscription",
    icon: CreditCard,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  // Type assertion for user data
  const typedUser = user as SelectUser;

  const handleLogout = async () => {
    await logout();
  };

  // Determine which menu to show based on user role
  const getMenuItems = () => {
    if (!typedUser) return [];
    
    switch (typedUser.role) {
      case 'admin':
        return adminMenuItems;
      case 'company_admin':
      case 'recruiter':
        return companyMenuItems;
      case 'candidate':
      default:
        return candidateMenuItems;
    }
  };

  const menuItems = getMenuItems();

  // Filter account items based on role (candidates don't see Subscription)
  const getAccountItems = () => {
    if (!typedUser) return accountItems;
    
    if (typedUser.role === 'candidate') {
      return accountItems.filter(item => item.title !== 'Subscription');
    }
    
    return accountItems;
  };

  const filteredAccountItems = getAccountItems();

  // Get role label for display
  const getRoleLabel = () => {
    if (!typedUser) return 'User';
    
    switch (typedUser.role) {
      case 'admin':
        return 'Admin';
      case 'company_admin':
        return 'Company Admin';
      case 'recruiter':
        return 'Recruiter';
      case 'candidate':
      default:
        return 'Candidate';
    }
  };

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link href="/dashboard">
          <div className="flex items-center gap-2 cursor-pointer">
            <img src="/logo.png" alt="RyteFit" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold text-sidebar-foreground" data-testid="text-sidebar-logo">
              RyteFit
            </span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.url}
                    data-testid={`sidebar-item-${item.title.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredAccountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.url}
                    data-testid={`sidebar-item-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={typedUser?.profileImageUrl || undefined} />
              <AvatarFallback>
                {typedUser?.firstName?.[0]}{typedUser?.lastName?.[0] || typedUser?.email?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" data-testid="text-sidebar-user-name">
                {typedUser?.firstName && typedUser?.lastName 
                  ? `${typedUser.firstName} ${typedUser.lastName}`
                  : typedUser?.email
                }
              </p>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className="text-xs capitalize"
                  data-testid="badge-sidebar-role"
                >
                  {getRoleLabel()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="w-full"
            data-testid="button-sidebar-logout"
          >
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}