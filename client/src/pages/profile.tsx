import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { updateUserProfileSchema, type UpdateUserProfile, type SelectUser, type SelectCompany } from '@shared/schema';
import { 
  User, 
  Settings, 
  Shield, 
  Calendar, 
  Mail, 
  Phone, 
  Building2,
  Lock,
  CheckCircle2,
  Upload,
  UserCircle,
  Pencil
} from 'lucide-react';
import { z } from 'zod';

interface ProfileData extends SelectUser {
  company?: SelectCompany;
}

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordChange = z.infer<typeof passwordChangeSchema>;

export default function Profile() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");
  const [isEditingCompanyCode, setIsEditingCompanyCode] = useState(false);
  const [companyCodeInput, setCompanyCodeInput] = useState("");
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyFormData, setCompanyFormData] = useState({
    name: "",
    website: "",
    industry: "",
    size: "",
    description: "",
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch user profile data
  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['/api/profile'],
    staleTime: 1000 * 60 * 5,
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateUserProfile) => {
      return await apiRequest('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update profile.",
      });
    },
  });

  // Password change mutation
  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordChange) => {
      return await apiRequest('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Password change failed",
        description: error.message || "Failed to change password.",
      });
    },
  });

  // Company code update mutation
  const updateCompanyCodeMutation = useMutation({
    mutationFn: async (companyCode: string) => {
      return await apiRequest('/api/companies/update-code', {
        method: 'PUT',
        body: { companyCode },
      });
    },
    onSuccess: () => {
      toast({
        title: "Company Code Updated",
        description: "Your company code has been updated successfully.",
      });
      setIsEditingCompanyCode(false);
      setCompanyCodeInput("");
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/companies/me'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update company code.",
      });
    },
  });

  // Company settings update mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/companies/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Company Updated",
        description: "Your company settings have been updated successfully.",
      });
      setIsEditingCompany(false);
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/companies/me'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update company settings.",
      });
    },
  });

  // Profile photo upload mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return await apiRequest('/api/profile/photo', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Photo uploaded",
        description: "Your profile photo has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload photo.",
      });
    },
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
        });
        return;
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select an image file.",
        });
        return;
      }
      uploadPhotoMutation.mutate(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const personalForm = useForm<UpdateUserProfile>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
      mobileNumber: profile?.mobileNumber || '',
    },
  });

  const passwordForm = useForm<PasswordChange>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  React.useEffect(() => {
    if (profile) {
      personalForm.reset({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        mobileNumber: profile.mobileNumber || '',
      });
      if (profile.company) {
        setCompanyFormData({
          name: profile.company.name || '',
          website: profile.company.website || '',
          industry: profile.company.industry || '',
          size: profile.company.size || '',
          description: profile.company.description || '',
        });
      }
    }
  }, [profile, personalForm]);

  const onPersonalSubmit = (data: UpdateUserProfile) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordChange) => {
    passwordMutation.mutate(data);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'company_admin': return 'default';
      case 'recruiter': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'company_admin': return 'Company Admin';
      case 'recruiter': return 'Recruiter';
      case 'candidate': return 'Candidate';
      default: return role;
    }
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-profile-title">Account Settings</h1>
        <p className="text-muted-foreground">Manage your profile and account preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Profile Summary Card */}
        <div className="lg:col-span-1">
          <Card data-testid="card-profile-summary">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage src={profile?.profileImageUrl || undefined} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-1">
                  <h3 className="text-xl font-semibold" data-testid="text-user-name">
                    {profile?.firstName} {profile?.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-user-email">
                    {profile?.email}
                  </p>
                </div>

                <Badge 
                  variant={getRoleBadgeVariant(profile?.role || '')}
                  className="capitalize"
                  data-testid="badge-role"
                >
                  {getRoleLabel(profile?.role || '')}
                </Badge>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full" 
                  data-testid="button-upload-photo"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadPhotoMutation.isPending}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadPhotoMutation.isPending ? "Uploading..." : "Upload Photo"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  data-testid="input-photo-file"
                />

                <Separator />

                <div className="w-full space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Email Verified</span>
                    {profile?.isEmailVerified ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" data-testid="icon-email-verified" />
                    ) : (
                      <span className="text-muted-foreground" data-testid="text-email-not-verified">No</span>
                    )}
                  </div>
                  {profile?.mobileNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Mobile Verified</span>
                      {profile?.isMobileVerified ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" data-testid="icon-mobile-verified" />
                      ) : (
                        <span className="text-muted-foreground" data-testid="text-mobile-not-verified">No</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Member Since</span>
                    <span data-testid="text-member-since">{formatDate(profile?.createdAt)}</span>
                  </div>
                  {profile?.lastLoginAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last Login</span>
                      <span data-testid="text-last-login">{formatDate(profile?.lastLoginAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4" data-testid="tabs-profile">
              <TabsTrigger value="personal" data-testid="tab-personal">
                <UserCircle className="h-4 w-4 mr-2" />
                Personal
              </TabsTrigger>
              <TabsTrigger value="security" data-testid="tab-security">
                <Lock className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
              {profile?.role === 'company_admin' && (
                <TabsTrigger value="company" data-testid="tab-company">
                  <Building2 className="h-4 w-4 mr-2" />
                  Company
                </TabsTrigger>
              )}
              <TabsTrigger value="preferences" data-testid="tab-preferences">
                <Settings className="h-4 w-4 mr-2" />
                Preferences
              </TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-6">
              <Card data-testid="card-personal-info">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...personalForm}>
                    <form onSubmit={personalForm.handleSubmit(onPersonalSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={personalForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-first-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={personalForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-last-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={personalForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Input 
                                  {...field} 
                                  type="email" 
                                  data-testid="input-email"
                                  disabled
                                  className="bg-muted cursor-not-allowed"
                                  title="Email is protected as it's used for authentication"
                                />
                                {profile?.isEmailVerified && (
                                  <Shield className="h-5 w-5 text-green-500 flex-shrink-0" />
                                )}
                              </div>
                            </FormControl>
                            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed as it is used for authentication</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalForm.control}
                        name="mobileNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Number</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Input {...field} placeholder="+1234567890" data-testid="input-mobile" />
                                {profile?.isMobileVerified && (
                                  <Shield className="h-5 w-5 text-green-500 flex-shrink-0" />
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Authentication Method</Label>
                          <p className="mt-1 capitalize" data-testid="text-auth-method">{profile?.authMethod || 'Email'}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          type="submit" 
                          disabled={updateProfileMutation.isPending}
                          data-testid="button-save-personal"
                        >
                          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card data-testid="card-security">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" data-testid="input-current-password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" data-testid="input-new-password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" data-testid="input-confirm-password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="bg-muted p-4 rounded-md">
                        <p className="text-sm text-muted-foreground">
                          <strong>Password requirements:</strong>
                        </p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                          <li>Minimum 8 characters long</li>
                          <li>Use a mix of letters, numbers, and symbols</li>
                          <li>Avoid common passwords</li>
                        </ul>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          type="submit" 
                          disabled={passwordMutation.isPending}
                          data-testid="button-change-password"
                        >
                          {passwordMutation.isPending ? "Updating..." : "Update Password"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Company Information Tab - Company Admin Only */}
            {profile?.role === 'company_admin' && (
              <TabsContent value="company" className="space-y-6">
                <Card data-testid="card-company-info">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Company Details & Settings
                    </CardTitle>
                    <CardDescription>
                      Manage your organization details, company code, and account settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Company Basic Information */}
                    <div>
                      <h4 className="font-semibold text-base mb-4">Organization Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Company Name</Label>
                          <p className="text-base font-medium" data-testid="text-company-name">
                            {profile?.company?.name || 'Not set'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">
                            Company Code
                            {profile?.role === 'company_admin' && (
                              <span className="ml-1 text-xs text-muted-foreground/60">(used in job IDs)</span>
                            )}
                          </Label>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-base" data-testid="text-company-code">
                              {(profile?.company as any)?.companyCode || 'Not set'}
                            </Badge>
                            {profile?.role === 'company_admin' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setIsEditingCompanyCode(true)}
                                data-testid="button-edit-company-code"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Industry</Label>
                          <p className="text-base" data-testid="text-company-industry">
                            {profile?.company?.industry || 'Not specified'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Company Size</Label>
                          <p className="text-base" data-testid="text-company-size">
                            {profile?.company?.size || 'Not specified'}
                          </p>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-sm font-medium text-muted-foreground">Website</Label>
                          <p className="text-base" data-testid="text-company-website">
                            {profile?.company?.website ? (
                              <a href={profile.company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                                {profile.company.website}
                              </a>
                            ) : 'Not set'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-4">Subscription Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Plan</Label>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant="default" className="capitalize" data-testid="badge-subscription-tier">
                              {profile?.company?.subscriptionTier || 'Trial'}
                            </Badge>
                            <Badge 
                              variant={profile?.company?.subscriptionStatus === 'active' ? 'default' : 'destructive'}
                              data-testid="badge-subscription-status"
                            >
                              {profile?.company?.subscriptionStatus || 'Active'}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Billing Cycle</Label>
                          <p className="mt-1 capitalize" data-testid="text-billing-cycle">
                            {profile?.company?.billingCycle || 'Monthly'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Monthly Interview Limit</Label>
                          <p className="mt-1" data-testid="text-interview-limit">
                            {profile?.company?.monthlyInterviewLimit || 0}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Interviews Used This Month</Label>
                          <p className="mt-1" data-testid="text-interviews-used">
                            {profile?.company?.interviewsUsedThisMonth || 0}
                          </p>
                        </div>
                        {profile?.company?.nextBillingDate && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Next Billing Date</Label>
                            <p className="mt-1" data-testid="text-next-billing">
                              {formatDate(profile.company.nextBillingDate)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {profile?.role === 'company_admin' && (
                      <>
                        <Separator />
                        <div>
                          <Button 
                            variant="outline" 
                            data-testid="button-manage-company"
                            onClick={() => setIsEditingCompany(true)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Manage Company Settings
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <Card data-testid="card-preferences">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Account Preferences
                  </CardTitle>
                  <CardDescription>
                    Manage your notification and display preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive email updates about your account</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Interview Reminders</p>
                        <p className="text-sm text-muted-foreground">Get reminded about upcoming interviews</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Weekly Reports</p>
                        <p className="text-sm text-muted-foreground">Receive weekly summary of your activity</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Account Actions</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" data-testid="button-export-data">
                        Export My Data
                      </Button>
                      <Button variant="destructive" className="w-full justify-start" data-testid="button-delete-account">
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Manage Company Settings Dialog */}
      <Dialog open={isEditingCompany} onOpenChange={setIsEditingCompany}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Company Settings</DialogTitle>
            <DialogDescription>
              Update your company information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={companyFormData.name}
                onChange={(e) => setCompanyFormData({...companyFormData, name: e.target.value})}
                placeholder="Enter company name"
                data-testid="input-company-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-website">Website</Label>
              <Input
                id="company-website"
                value={companyFormData.website}
                onChange={(e) => setCompanyFormData({...companyFormData, website: e.target.value})}
                placeholder="https://example.com"
                data-testid="input-company-website"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-industry">Industry</Label>
              <Input
                id="company-industry"
                value={companyFormData.industry}
                onChange={(e) => setCompanyFormData({...companyFormData, industry: e.target.value})}
                placeholder="e.g., Technology, Finance"
                data-testid="input-company-industry"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-size">Company Size</Label>
              <Input
                id="company-size"
                value={companyFormData.size}
                onChange={(e) => setCompanyFormData({...companyFormData, size: e.target.value})}
                placeholder="e.g., 1-10, 11-50, 51-200"
                data-testid="input-company-size"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-description">Description</Label>
              <textarea
                id="company-description"
                value={companyFormData.description}
                onChange={(e) => setCompanyFormData({...companyFormData, description: e.target.value})}
                placeholder="Brief description of your company"
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                rows={3}
                data-testid="textarea-company-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditingCompany(false)}
              data-testid="button-cancel-company-settings"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                updateCompanyMutation.mutate({
                  name: companyFormData.name,
                  website: companyFormData.website,
                  industry: companyFormData.industry,
                  size: companyFormData.size,
                  description: companyFormData.description,
                });
              }}
              disabled={updateCompanyMutation.isPending}
              data-testid="button-save-company-settings"
            >
              {updateCompanyMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Company Code Dialog */}
      <Dialog open={isEditingCompanyCode} onOpenChange={setIsEditingCompanyCode}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Company Code</DialogTitle>
            <DialogDescription>
              Update your company's 4-letter code. This code will be used in job posting IDs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="company-code">Company Code (4 letters)</Label>
              <Input
                id="company-code"
                placeholder="E.g., SCTE"
                value={companyCodeInput}
                onChange={(e) => setCompanyCodeInput(e.target.value.toUpperCase().slice(0, 4))}
                maxLength={4}
                className="font-mono text-lg"
                data-testid="input-company-code"
              />
              <p className="text-sm text-muted-foreground">
                Current code: <span className="font-mono font-semibold">{(profile?.company as any)?.companyCode || 'Not set'}</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditingCompanyCode(false);
                setCompanyCodeInput("");
              }}
              data-testid="button-cancel-company-code"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (companyCodeInput.length === 4) {
                  updateCompanyCodeMutation.mutate(companyCodeInput);
                } else {
                  toast({
                    variant: "destructive",
                    title: "Invalid Code",
                    description: "Company code must be exactly 4 letters.",
                  });
                }
              }}
              disabled={updateCompanyCodeMutation.isPending || companyCodeInput.length !== 4}
              data-testid="button-save-company-code"
            >
              {updateCompanyCodeMutation.isPending ? "Saving..." : "Save Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
