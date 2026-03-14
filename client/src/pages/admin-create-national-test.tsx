import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, Clock, Users, FileText, Trophy } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const nationalTestSchema = z.object({
  testNumber: z.string().min(1, "Test number is required").regex(/^NT\d{3}$/, "Test number must be in format NT001, NT002, etc."),
  examType: z.enum(["NEET", "JEE"], { required_error: "Exam type is required" }),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  instructions: z.string().min(1, "Instructions are required"),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  scheduledTime: z.string().min(1, "Scheduled time is required"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  totalQuestions: z.coerce.number().min(1, "Must have at least 1 question"),
  maxScore: z.coerce.number().min(1, "Max score must be at least 1"),
  correctMarks: z.coerce.number().min(0, "Correct marks cannot be negative"),
  incorrectMarks: z.coerce.number().max(0, "Incorrect marks should be negative or zero"),
  unansweredMarks: z.coerce.number().max(0, "Unanswered marks should be zero or negative"),
  registrationStartDate: z.string().min(1, "Registration start date is required"),
  registrationStartTime: z.string().min(1, "Registration start time is required"),
  registrationEndDate: z.string().min(1, "Registration end date is required"),
  registrationEndTime: z.string().min(1, "Registration end time is required"),
  maxParticipants: z.coerce.number().min(1, "Must allow at least 1 participant"),
  isPublished: z.boolean().default(false),
});

type NationalTestFormData = z.infer<typeof nationalTestSchema>;

export default function AdminCreateNationalTest() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<NationalTestFormData>({
    resolver: zodResolver(nationalTestSchema),
    defaultValues: {
      examType: "NEET",
      duration: 180,
      correctMarks: 4,
      incorrectMarks: -1,
      unansweredMarks: 0,
      maxParticipants: 10000,
      isPublished: false,
    },
  });

  const createTestMutation = useMutation({
    mutationFn: async (data: NationalTestFormData) => {
      // Combine date and time
      const scheduledDate = new Date(`${data.scheduledDate}T${data.scheduledTime}`);
      const registrationStartDate = new Date(`${data.registrationStartDate}T${data.registrationStartTime}`);
      const registrationEndDate = new Date(`${data.registrationEndDate}T${data.registrationEndTime}`);

      const payload = {
        testNumber: data.testNumber,
        examType: data.examType,
        title: data.title,
        description: data.description || "",
        instructions: data.instructions,
        scheduledDate: scheduledDate.toISOString(),
        duration: data.duration,
        totalQuestions: data.totalQuestions,
        maxScore: data.maxScore,
        markingScheme: {
          correct: data.correctMarks,
          incorrect: data.incorrectMarks,
          unanswered: data.unansweredMarks,
        },
        registrationStartDate: registrationStartDate.toISOString(),
        registrationEndDate: registrationEndDate.toISOString(),
        maxParticipants: data.maxParticipants,
        isPublished: data.isPublished,
      };

      const response = await apiRequest("/api/admin/national-tests/create", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "National test created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/national-tests'] });
      navigate("/admin/national-tests");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create national test",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NationalTestFormData) => {
    createTestMutation.mutate(data);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/national-tests">
          <Button variant="ghost" size="sm" data-testid="button-back-national-tests">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to National Tests
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create National Test</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            National Test Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Test Number and Exam Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="testNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Number</FormLabel>
                      <FormControl>
                        <Input placeholder="NT001" {...field} data-testid="input-test-number" />
                      </FormControl>
                      <FormDescription>Unique test number (format: NT001, NT002, etc.)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="examType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-exam-type">
                            <SelectValue placeholder="Select exam type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NEET">NEET</SelectItem>
                          <SelectItem value="JEE">JEE Main</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Title</FormLabel>
                    <FormControl>
                      <Input placeholder="All India NEET Mock Test - January 2026" {...field} data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief description of the test..." {...field} data-testid="textarea-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Instructions */}
              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed exam instructions for students..." 
                        {...field} 
                        data-testid="textarea-instructions"
                        className="min-h-[120px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Scheduled Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-exam-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduledTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid="input-exam-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Duration, Questions, Max Score */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="180" {...field} data-testid="input-duration" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalQuestions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Questions</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="180" {...field} data-testid="input-total-questions" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Score</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="720" {...field} data-testid="input-max-score" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Marking Scheme */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="correctMarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marks for Correct Answer</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="4" {...field} data-testid="input-correct-marks" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="incorrectMarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marks for Incorrect Answer</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="-1" {...field} data-testid="input-incorrect-marks" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unansweredMarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marks for Unanswered</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} data-testid="input-unanswered-marks" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Registration Start Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="registrationStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-reg-start-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="registrationStartTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid="input-reg-start-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Registration End Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="registrationEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-reg-end-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="registrationEndTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid="input-reg-end-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Max Participants */}
              <FormField
                control={form.control}
                name="maxParticipants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Number of Participants</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="10000" {...field} data-testid="input-max-participants" />
                    </FormControl>
                    <FormDescription>Maximum number of students who can register</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Publish Test Checkbox */}
              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-is-published"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Publish Test
                      </FormLabel>
                      <FormDescription>
                        Make this test visible to students. Unpublished tests are only visible in admin panel.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/national-tests")}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTestMutation.isPending}
                  data-testid="button-create-test"
                >
                  {createTestMutation.isPending ? "Creating..." : "Create National Test"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
