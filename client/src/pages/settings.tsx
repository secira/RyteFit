import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ArrowLeft, Zap, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { DEFAULT_SCORING_WEIGHTS } from '@shared/constants/scoring';

const scoringConfigSchema = z.object({
  skillsMatch: z.number().min(30).max(35),
  experienceLevel: z.number().min(25).max(30),
  education: z.number().min(10).max(15),
  workHistoryRelevance: z.number().min(20).max(25),
  keywords: z.number().min(5).max(10),
  culturalFit: z.number().min(5).max(10),
}).refine((data) => {
  const total = data.skillsMatch + data.experienceLevel + data.education + data.workHistoryRelevance + data.keywords + data.culturalFit;
  return Math.abs(total - 100) < 0.01; // Allow for floating point errors
}, {
  message: "Total weightages must equal 100%",
  path: ["skillsMatch"],
});

type ScoringConfig = z.infer<typeof scoringConfigSchema>;

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("scoring");

  // Fetch scoring config
  const { data: scoringConfig, isLoading } = useQuery({
    queryKey: ['/api/scoring-config'],
    enabled: user?.role === 'company_admin' || user?.role === 'recruiter',
  });

  // Update scoring config mutation
  const updateScoringMutation = useMutation({
    mutationFn: async (data: ScoringConfig) => {
      return await apiRequest('/api/scoring-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Scoring parameters updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/scoring-config'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update settings.",
      });
    },
  });

  const form = useForm<ScoringConfig>({
    resolver: zodResolver(scoringConfigSchema),
    defaultValues: DEFAULT_SCORING_WEIGHTS,
  });

  React.useEffect(() => {
    if (scoringConfig) {
      form.reset({
        skillsMatch: Number(scoringConfig.skillsMatch) || DEFAULT_SCORING_WEIGHTS.skillsMatch,
        experienceLevel: Number(scoringConfig.experienceLevel) || DEFAULT_SCORING_WEIGHTS.experienceLevel,
        education: Number(scoringConfig.education) || DEFAULT_SCORING_WEIGHTS.education,
        workHistoryRelevance: Number(scoringConfig.workHistoryRelevance) || DEFAULT_SCORING_WEIGHTS.workHistoryRelevance,
        keywords: Number(scoringConfig.keywords) || DEFAULT_SCORING_WEIGHTS.keywords,
        culturalFit: Number(scoringConfig.culturalFit) || DEFAULT_SCORING_WEIGHTS.culturalFit,
      });
    }
  }, [scoringConfig, form]);

  const onSubmit = (data: ScoringConfig) => {
    updateScoringMutation.mutate(data);
  };

  const total = form.watch(['skillsMatch', 'experienceLevel', 'education', 'workHistoryRelevance', 'keywords', 'culturalFit']).reduce((a, b) => a + b, 0);
  const totalColor = Math.abs(total - 100) < 0.01 ? 'text-green-600' : 'text-red-600';

  if (user?.role === 'candidate') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Settings are only available for company admins and recruiters.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your company settings and AI scoring parameters.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1 lg:grid-cols-2">
          <TabsTrigger value="scoring" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Scoring Parameters
          </TabsTrigger>
          <TabsTrigger value="general">
            General Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scoring" className="space-y-6">
          <Card data-testid="card-scoring-params">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI Scoring Configuration
              </CardTitle>
              <CardDescription>
                Configure the weightages for AI resume screening. Total must equal 100%.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Skills Match */}
                    <FormField
                      control={form.control}
                      name="skillsMatch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            <span>Skills Match</span>
                            <span className="text-xs font-normal text-muted-foreground">(30-35%)</span>
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input
                                type="number"
                                step={0.1}
                                min={30}
                                max={35}
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                data-testid="input-skills-match"
                              />
                              <p className="text-xs text-muted-foreground">
                                Technical skills, soft skills, tools, technologies
                              </p>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Experience Level */}
                    <FormField
                      control={form.control}
                      name="experienceLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            <span>Experience Level</span>
                            <span className="text-xs font-normal text-muted-foreground">(25-30%)</span>
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input
                                type="number"
                                step={0.1}
                                min={25}
                                max={30}
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                data-testid="input-experience-level"
                              />
                              <p className="text-xs text-muted-foreground">
                                Years of experience, seniority level, job progression
                              </p>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Education */}
                    <FormField
                      control={form.control}
                      name="education"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            <span>Education</span>
                            <span className="text-xs font-normal text-muted-foreground">(10-15%)</span>
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input
                                type="number"
                                step={0.1}
                                min={10}
                                max={15}
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                data-testid="input-education"
                              />
                              <p className="text-xs text-muted-foreground">
                                Degree requirements, certifications, relevant coursework
                              </p>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Work History Relevance */}
                    <FormField
                      control={form.control}
                      name="workHistoryRelevance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            <span>Work History Relevance</span>
                            <span className="text-xs font-normal text-muted-foreground">(20-25%)</span>
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input
                                type="number"
                                step={0.1}
                                min={20}
                                max={25}
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                data-testid="input-work-history"
                              />
                              <p className="text-xs text-muted-foreground">
                                Industry experience, similar roles, company types
                              </p>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Keywords */}
                    <FormField
                      control={form.control}
                      name="keywords"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            <span>Keywords/Terms</span>
                            <span className="text-xs font-normal text-muted-foreground">(5-10%)</span>
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input
                                type="number"
                                step={0.1}
                                min={5}
                                max={10}
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                data-testid="input-keywords"
                              />
                              <p className="text-xs text-muted-foreground">
                                Job-specific terminology, domain acronyms
                              </p>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Cultural Fit */}
                    <FormField
                      control={form.control}
                      name="culturalFit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            <span>Cultural Fit</span>
                            <span className="text-xs font-normal text-muted-foreground">(5-10%)</span>
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input
                                type="number"
                                step={0.1}
                                min={5}
                                max={10}
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                data-testid="input-cultural-fit"
                              />
                              <p className="text-xs text-muted-foreground">
                                Company values alignment, work style preferences
                              </p>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Total Weightage Indicator */}
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total Weightage</span>
                      <span className={`text-lg font-bold ${totalColor}`} data-testid="text-total-weightage">
                        {total.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      All percentages must add up to exactly 100%. Adjust the values above.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={updateScoringMutation.isPending || Math.abs(total - 100) > 0.1}
                    data-testid="button-save-scoring"
                  >
                    {updateScoringMutation.isPending ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Additional settings coming soon.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">More settings will be available here in future releases.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
