import { useQuery } from "@tanstack/react-query";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Company {
  id: string;
  name: string;
}

export function DashboardHeader() {
  const { user } = useAuth();
  
  const userRole = (user as any)?.role;
  const isCompanyUser = userRole === "company_admin" || userRole === "recruiter";
  
  const { data: company } = useQuery<Company>({
    queryKey: ["/api/companies/me"],
    enabled: !!user && isCompanyUser,
  });

  const showCompanyName = user && isCompanyUser && company;

  return (
    <header className="flex items-center justify-between gap-2 p-2 border-b sticky top-0 z-30 bg-background">
      <SidebarTrigger data-testid="button-sidebar-toggle" />
      {showCompanyName && (
        <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-md bg-muted/50 min-w-0">
          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-xs sm:text-sm font-medium truncate max-w-[55vw] sm:max-w-none">{company.name}</span>
        </div>
      )}
    </header>
  );
}
