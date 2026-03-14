import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertCircle, Phone, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/Header";

// Validation schemas
const emailLoginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const emailSignupSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

const mobileSchema = z.object({
  mobileNumber: z.string().regex(/^\+91[6-9]\d{9}$/, "Please enter a valid Indian mobile number (+91XXXXXXXXXX)"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

type EmailLoginForm = z.infer<typeof emailLoginSchema>;
type EmailSignupForm = z.infer<typeof emailSignupSchema>;
type MobileForm = z.infer<typeof mobileSchema>;
type OtpForm = z.infer<typeof otpSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [isSignupMode, setIsSignupMode] = useState(false);
  const { toast } = useToast();

  // Form instances
  const emailLoginForm = useForm<EmailLoginForm>({
    resolver: zodResolver(emailLoginSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const emailSignupForm = useForm<EmailSignupForm>({
    resolver: zodResolver(emailSignupSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const mobileForm = useForm<MobileForm>({
    resolver: zodResolver(mobileSchema),
    defaultValues: {
      mobileNumber: "",
    },
  });

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  // Mutations
  const emailLoginMutation = useMutation({
    mutationFn: async (data: EmailLoginForm) => {
      const response = await apiRequest("/api/auth/login", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const emailSignupMutation = useMutation({
    mutationFn: async (data: EmailSignupForm) => {
      const response = await apiRequest("/api/auth/signup", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account created successfully",
        description: "Welcome! You can now sign in.",
      });
      setIsSignupMode(false);
      emailLoginForm.setValue("email", emailSignupForm.getValues().email);
    },
    onError: (error: Error) => {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendOtpMutation = useMutation({
    mutationFn: async (data: MobileForm) => {
      const response = await apiRequest("/api/auth/send-otp", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      setOtpSent(true);
      setMobileNumber(mobileForm.getValues().mobileNumber);
      toast({
        title: "OTP sent",
        description: "Please check your mobile for the verification code",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send OTP",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (data: OtpForm) => {
      const response = await apiRequest("/api/auth/verify-otp", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobileNumber,
          otp: data.otp,
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Login successful",
        description: "Welcome to RyteFit!",
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "OTP verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEmailLoginSubmit = (data: EmailLoginForm) => {
    emailLoginMutation.mutate(data);
  };

  const handleEmailSignupSubmit = (data: EmailSignupForm) => {
    emailSignupMutation.mutate(data);
  };

  const handleMobileSubmit = (data: MobileForm) => {
    sendOtpMutation.mutate(data);
  };

  const handleOtpSubmit = (data: OtpForm) => {
    verifyOtpMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-blue-950 dark:via-background dark:to-blue-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-primary">
              RyteFit Platform
            </CardTitle>
            <CardDescription>
              Smart Hiring with AI-Powered Video Interviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="mobile" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mobile" data-testid="tab-mobile">Mobile</TabsTrigger>
                <TabsTrigger value="email" data-testid="tab-email">Email</TabsTrigger>
              </TabsList>

              {/* Mobile OTP - Sign up or Login */}
              <TabsContent value="mobile" className="space-y-4">
                {!otpSent ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Sign up or sign in with your mobile number
                    </p>
                    <Form {...mobileForm}>
                      <form
                        onSubmit={mobileForm.handleSubmit(handleMobileSubmit)}
                        className="space-y-4"
                      >
                        <FormField
                          control={mobileForm.control}
                          name="mobileNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mobile Number</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="tel"
                                  autoComplete="tel"
                                  placeholder="+91XXXXXXXXXX"
                                  data-testid="input-mobile"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={sendOtpMutation.isPending}
                          data-testid="button-send-otp"
                        >
                          {sendOtpMutation.isPending ? "Sending..." : "Send OTP"}
                        </Button>
                      </form>
                    </Form>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        OTP sent to {mobileNumber}
                      </AlertDescription>
                    </Alert>
                    <form
                      onSubmit={otpForm.handleSubmit(handleOtpSubmit)}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <label htmlFor="otp-input" className="text-sm font-medium">
                          Verification Code
                        </label>
                        <Input
                          id="otp-input"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          pattern="[0-9]*"
                          placeholder="Enter 6-digit OTP"
                          maxLength={6}
                          value={otpForm.watch("otp")}
                          onChange={(e) => otpForm.setValue("otp", e.target.value)}
                          data-testid="input-otp"
                        />
                        {otpForm.formState.errors.otp && (
                          <p className="text-sm text-destructive">
                            {otpForm.formState.errors.otp.message}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setOtpSent(false);
                            otpForm.reset();
                          }}
                          data-testid="button-back"
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1"
                          disabled={verifyOtpMutation.isPending}
                          data-testid="button-verify-otp"
                        >
                          {verifyOtpMutation.isPending ? "Verifying..." : "Verify"}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </TabsContent>

              {/* Email Login/Signup */}
              <TabsContent value="email" className="space-y-4">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {isSignupMode ? "Create a new account with email" : "Sign in with your email account"}
                  </p>
                </div>

                {!isSignupMode ? (
                  <Form {...emailLoginForm}>
                    <form
                      onSubmit={emailLoginForm.handleSubmit(handleEmailLoginSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={emailLoginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                autoComplete="email"
                                placeholder="your@email.com"
                                data-testid="input-email-login"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={emailLoginForm.control}
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
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                  data-testid="button-toggle-password"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
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
                        disabled={emailLoginMutation.isPending}
                        data-testid="button-email-submit"
                      >
                        {emailLoginMutation.isPending ? "Please wait..." : "Login"}
                      </Button>

                      <div className="text-center">
                        <button
                          type="button"
                          className="text-sm text-primary hover:underline"
                          onClick={() => {
                            setIsSignupMode(true);
                            emailLoginForm.reset();
                          }}
                          data-testid="link-signup"
                        >
                          Don't have an account? Sign up
                        </button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <Form {...emailSignupForm}>
                    <form
                      onSubmit={emailSignupForm.handleSubmit(handleEmailSignupSubmit)}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={emailSignupForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="text"
                                  autoComplete="given-name"
                                  placeholder="John"
                                  data-testid="input-firstname"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={emailSignupForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="text"
                                  autoComplete="family-name"
                                  placeholder="Doe"
                                  data-testid="input-lastname"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="email-signup" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Email
                        </label>
                        <Input
                          id="email-signup"
                          type="email"
                          autoComplete="off"
                          placeholder="your@email.com"
                          value={emailSignupForm.watch("email")}
                          onChange={(e) => emailSignupForm.setValue("email", e.target.value, { shouldValidate: true })}
                          data-testid="input-email-signup"
                        />
                        {emailSignupForm.formState.errors.email && (
                          <p className="text-sm font-medium text-destructive">
                            {emailSignupForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <FormField
                        control={emailSignupForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showPassword ? "text" : "password"}
                                  autoComplete="new-password"
                                  placeholder="At least 8 characters"
                                  data-testid="input-password-signup"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                  data-testid="button-toggle-password-signup"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
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
                        disabled={emailSignupMutation.isPending}
                        data-testid="button-email-signup"
                      >
                        {emailSignupMutation.isPending ? "Creating account..." : "Create Account"}
                      </Button>

                      <div className="text-center">
                        <button
                          type="button"
                          className="text-sm text-primary hover:underline"
                          onClick={() => {
                            setIsSignupMode(false);
                            emailSignupForm.reset();
                          }}
                          data-testid="link-login"
                        >
                          Already have an account? Login
                        </button>
                      </div>
                    </form>
                  </Form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
