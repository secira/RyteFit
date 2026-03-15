import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Eye, EyeOff, Shield, Briefcase, CheckCircle, Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const signupRequestSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  companyName: z.string().min(1, "Company name is required"),
  phone: z.string().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupRequestForm = z.infer<typeof signupRequestSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const { toast } = useToast();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupRequestForm>({
    resolver: zodResolver(signupRequestSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { firstName: "", lastName: "", email: "", companyName: "", phone: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Login successful", description: "Welcome back!" });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupRequestForm) => {
      const response = await apiRequest("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      setRequestSubmitted(true);
    },
    onError: (error: Error) => {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">RyteFit</span>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-blue-200 text-sm font-medium uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              Admin Portal
            </div>
            <h1 className="text-4xl font-bold leading-tight">
              Smarter Hiring,<br />Powered by AI
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed">
              Streamline your recruitment with AI-driven interviews, intelligent screening, and data-backed decisions.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label: "Time Saved", value: "70%" },
              { label: "Faster Screening", value: "3x" },
              { label: "Accuracy", value: "94%" },
              { label: "SMBs Served", value: "500+" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-blue-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-300 text-sm">
          © {new Date().getFullYear()} RyteFit. Enterprise hiring platform.
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-primary">RyteFit</span>
          </div>

          {!isSignupMode ? (
            <>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
                <p className="text-muted-foreground text-sm">Sign in to your admin dashboard</p>
              </div>

              <Card className="border border-border shadow-sm">
                <CardContent className="pt-6">
                  <Form {...loginForm}>
                    <form
                      onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))}
                      className="space-y-5"
                    >
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email address</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                autoComplete="email"
                                placeholder="admin@company.com"
                                data-testid="input-email-login"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showPassword ? "text" : "password"}
                                  autoComplete="current-password"
                                  placeholder="Enter your password"
                                  data-testid="input-password"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                  data-testid="button-toggle-password"
                                >
                                  {showPassword
                                    ? <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    : <Eye className="h-4 w-4 text-muted-foreground" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loginMutation.isPending}
                        data-testid="button-login"
                      >
                        {loginMutation.isPending ? "Signing in..." : "Sign in"}
                      </Button>
                    </form>
                  </Form>

                  <Separator className="my-5" />

                  <p className="text-center text-sm text-muted-foreground">
                    New to RyteFit?{" "}
                    <button
                      type="button"
                      className="text-primary font-medium hover:underline"
                      onClick={() => { setIsSignupMode(true); setRequestSubmitted(false); }}
                      data-testid="link-request-access"
                    >
                      Request access
                    </button>
                  </p>
                </CardContent>
              </Card>

              <p className="text-center text-xs text-muted-foreground">
                Restricted access — Company Admins and Recruiters only
              </p>
            </>
          ) : requestSubmitted ? (
            /* Success state */
            <>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-foreground">Request received!</h2>
                <p className="text-muted-foreground text-sm">We'll be in touch soon</p>
              </div>

              <Card className="border border-border shadow-sm">
                <CardContent className="pt-8 pb-8">
                  <div className="flex flex-col items-center text-center space-y-5">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        Thank you for your interest!
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                        Our support team has received your request and will reach out to you within <span className="font-medium text-foreground">1 business day</span> to set up your account and walk you through the platform.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 w-full">
                      <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Check your inbox — we'll contact you at the email you provided.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-primary font-medium hover:underline"
                  onClick={() => { setIsSignupMode(false); setRequestSubmitted(false); }}
                  data-testid="link-back-to-login"
                >
                  Sign in
                </button>
              </p>
            </>
          ) : (
            /* Signup request form */
            <>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-foreground">Request access</h2>
                <p className="text-muted-foreground text-sm">
                  RyteFit's support team will set up your account and onboard you personally.
                </p>
              </div>

              <Card className="border border-border shadow-sm">
                <CardContent className="pt-6">
                  <Form {...signupForm}>
                    <form
                      onSubmit={signupForm.handleSubmit((data) => signupMutation.mutate(data))}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={signupForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="John" data-testid="input-firstname" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={signupForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Doe" data-testid="input-lastname" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormItem>
                        <FormLabel>Work email</FormLabel>
                        <FormControl>
                          <Input
                            id="signup-email"
                            type="text"
                            inputMode="email"
                            autoComplete="off"
                            placeholder="you@company.com"
                            value={signupForm.watch("email")}
                            onChange={(e) =>
                              signupForm.setValue("email", e.target.value, { shouldValidate: signupForm.formState.isSubmitted })
                            }
                            data-testid="input-email-signup"
                          />
                        </FormControl>
                        {signupForm.formState.errors.email && (
                          <p className="text-sm font-medium text-destructive">
                            {signupForm.formState.errors.email.message}
                          </p>
                        )}
                      </FormItem>

                      <FormField
                        control={signupForm.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Acme Corp"
                                data-testid="input-company"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={signupForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Phone number{" "}
                              <span className="text-muted-foreground font-normal">(optional)</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="tel"
                                placeholder="+91 98765 43210"
                                data-testid="input-phone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full mt-2"
                        disabled={signupMutation.isPending}
                        data-testid="button-request-access"
                      >
                        {signupMutation.isPending ? "Submitting..." : "Submit request"}
                      </Button>
                    </form>
                  </Form>

                  <Separator className="my-5" />

                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="text-primary font-medium hover:underline"
                      onClick={() => { setIsSignupMode(false); signupForm.reset(); }}
                      data-testid="link-back-to-login"
                    >
                      Sign in
                    </button>
                  </p>
                </CardContent>
              </Card>

              <p className="text-center text-xs text-muted-foreground">
                Our team typically responds within 1 business day.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
