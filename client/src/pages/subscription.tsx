import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle2, Calendar, TrendingUp, AlertCircle, Check, X } from "lucide-react";
import { format } from "date-fns";
import { type SelectCompany } from "@shared/schema";

export default function Subscription() {
  const { user } = useAuth();

  // Fetch company data which includes subscription info
  const { data: company, isLoading } = useQuery<SelectCompany>({
    queryKey: ["/api/company"],
    enabled: !!user && (user as any).role === 'company_admin' || (user as any).role === 'recruiter',
  });

  // Plan features mapping
  const planFeatures = {
    trial: {
      name: "Free Plan",
      price: "₹0",
      jobLimit: "5 jobs",
      color: "bg-gray-100 dark:bg-gray-800",
      features: [
        "Up to 5 job postings",
        "Basic AI resume screening",
        "AI interview evaluations",
        "Candidate ranking",
        "Email support",
      ],
    },
    starter: {
      name: "Standard Plan",
      price: "₹4,999/month",
      jobLimit: "100 jobs",
      color: "bg-blue-50 dark:bg-blue-950",
      features: [
        "Up to 100 job postings per month",
        "Advanced AI resume screening",
        "Unlimited AI interview evaluations",
        "Advanced candidate ranking",
        "Multi-dimensional scoring",
        "Analytics dashboard",
        "Priority email & chat support",
      ],
    },
    professional: {
      name: "Premium Plan",
      price: "₹9,999/month",
      jobLimit: "500 jobs",
      color: "bg-purple-50 dark:bg-purple-950",
      features: [
        "Up to 500 job postings per month",
        "Advanced AI workflows",
        "Custom question banks",
        "Multi-platform job posting",
        "Custom branding",
        "Dedicated account manager",
        "Advanced analytics & reporting",
        "API access",
        "24/7 priority support",
      ],
    },
    enterprise: {
      name: "Enterprise Plan",
      price: "Custom Pricing",
      jobLimit: "Unlimited",
      color: "bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950",
      features: [
        "Unlimited job postings",
        "Custom AI model training",
        "White-label solution",
        "Custom integrations",
        "SLA guarantee",
        "On-premise deployment option",
        "Dedicated infrastructure",
        "24/7 premium support",
      ],
    },
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />Active</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Cancelled</Badge>;
      case 'suspended':
        return <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3" />Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const currentPlan = company?.subscriptionTier || 'trial';
  const currentPlanInfo = planFeatures[currentPlan as keyof typeof planFeatures] || planFeatures.trial;

  if ((user as any)?.role === 'candidate') {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Candidates don't require a subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              As a candidate, you can apply to jobs and participate in interviews for free. 
              Companies manage their own subscriptions for hiring services.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-subscription">Subscription & Billing</h1>
        <p className="text-muted-foreground">Manage your plan and billing information</p>
      </div>

      {/* Current Plan Card */}
      <Card className={currentPlanInfo.color}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
              <CardDescription className="mt-1">Your active subscription details</CardDescription>
            </div>
            {company?.subscriptionStatus && getStatusBadge(company.subscriptionStatus)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Plan Type</p>
              <p className="text-2xl font-bold capitalize" data-testid="text-current-plan">
                {currentPlanInfo.name}
              </p>
              <p className="text-lg text-muted-foreground">{currentPlanInfo.price}</p>
              <p className="text-sm text-muted-foreground mt-1">{currentPlanInfo.jobLimit}</p>
            </div>
            
            {company?.billingCycle && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Billing Cycle</p>
                <p className="text-xl font-semibold capitalize flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {company.billingCycle}
                </p>
              </div>
            )}
            
            {company?.nextBillingDate && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Next Billing Date</p>
                <p className="text-xl font-semibold flex items-center gap-2" data-testid="text-expiry-date">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(company.nextBillingDate), 'MMM dd, yyyy')}
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm font-semibold mb-2">Plan Features:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {currentPlanInfo.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans - Pricing Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center">Choose Your Plan</h2>
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Free Plan */}
          <Card className="relative border-2 hover-elevate" data-testid="card-free-plan">
            <CardHeader className="text-center pb-4">
              <Badge variant="secondary" className="w-fit mx-auto mb-2">Free</Badge>
              <CardTitle className="text-2xl">Free</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">₹0</span>
                <p className="text-sm text-muted-foreground mt-1">Forever</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-2 bg-muted rounded-md">
                <p className="text-sm font-semibold">Up to 5 Jobs</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">5 job postings</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Basic AI resume screening</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">AI interview evaluations</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Candidate ranking</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Email support</span>
                </div>
                <div className="flex items-start gap-3 opacity-50">
                  <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm">No custom branding</span>
                </div>
                <div className="flex items-start gap-3 opacity-50">
                  <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm">No advanced analytics</span>
                </div>
              </div>
              
              {currentPlan === 'trial' ? (
                <Button 
                  variant="outline"
                  className="w-full mt-6" 
                  disabled
                  data-testid="button-current-free"
                >
                  Current Plan
                </Button>
              ) : (
                <Button 
                  variant="outline"
                  className="w-full mt-6" 
                  data-testid="button-downgrade-free"
                >
                  Downgrade to Free
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Standard Plan */}
          <Card className="relative border-2 border-primary hover-elevate" data-testid="card-standard-plan">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground px-4 py-1">
                Most Popular
              </Badge>
            </div>
            <CardHeader className="text-center pt-8 pb-4">
              <CardTitle className="text-2xl">Standard</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">₹4,999</span>
                <p className="text-sm text-muted-foreground mt-1">per month</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-2 bg-primary/10 rounded-md">
                <p className="text-sm font-semibold text-primary">Up to 100 Jobs/month</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-semibold">100 job postings per month</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Advanced AI resume screening</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited AI interviews</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Advanced candidate ranking</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Analytics dashboard</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Priority support</span>
                </div>
              </div>
              
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Auto-renews monthly. Cancel anytime.
                </p>
              </div>
              
              {currentPlan === 'starter' ? (
                <Button variant="default" className="w-full mt-6" disabled data-testid="button-current-standard">
                  Current Plan
                </Button>
              ) : (
                <Button 
                  variant="default"
                  className="w-full mt-6" 
                  data-testid="button-subscribe-standard"
                >
                  Upgrade to Standard
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="relative border-2 border-purple-500 hover-elevate" data-testid="card-premium-plan">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-purple-600 text-white px-4 py-1">
                Best Value
              </Badge>
            </div>
            <CardHeader className="text-center pt-8 pb-4">
              <CardTitle className="text-2xl">Premium</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">₹9,999</span>
                <p className="text-sm text-muted-foreground mt-1">per month</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-2 bg-purple-100 dark:bg-purple-950 rounded-md">
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">Up to 500 Jobs/month</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-semibold">500 job postings per month</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Everything in Standard</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Custom question banks</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Multi-platform job posting</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Custom branding</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">API access</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">24/7 priority support</span>
                </div>
              </div>
              
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Auto-renews monthly. Cancel anytime.
                </p>
              </div>
              
              {currentPlan === 'professional' ? (
                <Button variant="default" className="w-full mt-6 bg-purple-600 hover:bg-purple-700" disabled data-testid="button-current-premium">
                  Current Plan
                </Button>
              ) : (
                <Button 
                  variant="default"
                  className="w-full mt-6 bg-purple-600 hover:bg-purple-700" 
                  data-testid="button-subscribe-premium"
                >
                  Upgrade to Premium
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enterprise Option */}
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Need More?</h3>
              <p className="text-muted-foreground mb-4">
                For enterprises requiring unlimited job postings, custom AI models, white-label solutions, 
                and dedicated infrastructure, we offer custom enterprise plans tailored to your needs.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Unlimited Jobs</Badge>
                <Badge variant="outline">Custom AI Models</Badge>
                <Badge variant="outline">White-Label</Badge>
                <Badge variant="outline">Dedicated Support</Badge>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Button size="lg" data-testid="button-contact-sales">
                Contact Sales
              </Button>
              <p className="text-sm text-muted-foreground">Custom pricing</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Actions */}
      {currentPlan !== 'trial' && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Billing Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full" data-testid="button-update-payment">
                Update Payment Method
              </Button>
              <Button variant="outline" className="w-full" data-testid="button-view-invoices">
                View Invoices
              </Button>
              <Button variant="outline" className="w-full text-destructive" data-testid="button-cancel-subscription">
                Cancel Subscription
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Usage Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Jobs Created This Month</span>
                  <span className="font-semibold">0 / {currentPlanInfo.jobLimit.split(' ')[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Interviews Conducted</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Resumes Screened</span>
                  <span className="font-semibold">0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Billing History */}
      <Card data-testid="card-billing-history">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Billing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No billing history</h3>
            <p className="text-muted-foreground">
              Your billing history will appear here once you make your first purchase.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
