import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Briefcase, Users, Zap, Crown } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/Header";

const PricingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the perfect plan for your hiring needs. AI-powered interviews, intelligent screening, 
            and advanced analytics to find the best candidates.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* Free Plan */}
          <Card className="relative border-2 hover-elevate" data-testid="card-free-plan">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Briefcase className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <Badge variant="secondary" className="w-fit mx-auto mb-2">Free</Badge>
              <CardTitle className="text-2xl">Free</CardTitle>
              <CardDescription>Perfect for trying out the platform</CardDescription>
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
                  <span className="text-sm">No advanced analytics</span>
                </div>
                <div className="flex items-start gap-3 opacity-50">
                  <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm">No custom branding</span>
                </div>
              </div>
              
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Great for small teams getting started
                </p>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-6" 
                asChild
                data-testid="button-get-started-free"
              >
                <Link href="/auth/login">Get Started Free</Link>
              </Button>
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
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Standard</CardTitle>
              <CardDescription>For growing teams</CardDescription>
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
                  <span className="text-sm">Multi-dimensional scoring</span>
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
              
              <Button 
                variant="default"
                className="w-full mt-6" 
                asChild
                data-testid="button-subscribe-standard"
              >
                <Link href="/auth/login">Start Standard Plan</Link>
              </Button>
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
              <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-2xl">Premium</CardTitle>
              <CardDescription>For scaling companies</CardDescription>
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
              
              <Button 
                variant="default"
                className="w-full mt-6 bg-purple-600 hover:bg-purple-700" 
                asChild
                data-testid="button-subscribe-premium"
              >
                <Link href="/auth/login">Start Premium Plan</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Enterprise Option */}
        <div className="max-w-6xl mx-auto mt-16">
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center flex-shrink-0">
                    <Crown className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">Enterprise Plan</h3>
                    <p className="text-muted-foreground mb-4">
                      For large organizations requiring unlimited job postings, custom AI models, 
                      white-label solutions, and dedicated infrastructure.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Unlimited Jobs</Badge>
                      <Badge variant="outline">Custom AI Models</Badge>
                      <Badge variant="outline">White-Label</Badge>
                      <Badge variant="outline">Dedicated Support</Badge>
                      <Badge variant="outline">SLA Guarantee</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3 flex-shrink-0">
                  <Button size="lg" asChild data-testid="button-contact-sales">
                    <Link href="/dashboard">Contact Sales</Link>
                  </Button>
                  <p className="text-sm text-muted-foreground">Custom pricing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Comparison */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">All Plans Include</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">AI-Powered Screening</h4>
                    <p className="text-sm text-muted-foreground">Automatically screen resumes and identify top candidates</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Video Interview Analysis</h4>
                    <p className="text-sm text-muted-foreground">AI evaluates communication skills and confidence</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Intelligent Ranking</h4>
                    <p className="text-sm text-muted-foreground">Candidates ranked by AI-driven multi-dimensional scoring</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Automated Workflows</h4>
                    <p className="text-sm text-muted-foreground">Streamline your hiring process from posting to offer</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Real-Time Analytics</h4>
                    <p className="text-sm text-muted-foreground">Track hiring metrics and optimize your process</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Secure & Compliant</h4>
                    <p className="text-sm text-muted-foreground">GDPR compliant with end-to-end encryption</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Hiring?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join hundreds of companies using AI-powered interviews to find the best talent faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild data-testid="button-get-started">
              <Link href="/auth/login">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild data-testid="button-contact-support">
              <Link href="/dashboard">Contact Support</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
