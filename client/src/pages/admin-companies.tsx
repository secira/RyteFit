import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Search, Building2, Users, Briefcase, Plus } from "lucide-react";
import { RoleGate } from "@/components/RoleGate";

export default function AdminCompaniesPage() {
  return (
    <RoleGate allowedRoles={['admin']}>
      <AdminCompaniesContent />
    </RoleGate>
  );
}

function AdminCompaniesContent() {
  const { user } = useAuth();
  const userRole = (user as any)?.role;

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['/api/companies'],
    enabled: !!user && userRole === 'admin',
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-admin-companies-title">Companies</h1>
          <p className="text-muted-foreground mt-1">
            Manage platform companies and accounts
          </p>
        </div>
        <Button data-testid="button-add-company">
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            className="pl-10"
            data-testid="input-search-companies"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {companies.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No companies registered</h3>
              <p className="text-muted-foreground text-center mb-4">
                Companies will appear here once they sign up
              </p>
            </CardContent>
          </Card>
        ) : (
          companies.map((company: any) => (
            <Card key={company.id} className="hover-elevate" data-testid={`card-company-${company.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{company.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {company.industry || 'Technology'} • {company.size || 'Unknown'} employees
                    </CardDescription>
                  </div>
                  <Badge variant={company.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                    {company.subscriptionStatus || 'active'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{company._count?.users || 0} users</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      <span>{company._count?.jobs || 0} jobs</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" data-testid={`button-view-company-${company.id}`}>
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" data-testid={`button-manage-company-${company.id}`}>
                      Manage
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
