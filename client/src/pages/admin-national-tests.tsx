import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  Users, 
  Clock, 
  Trophy, 
  Search, 
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  XCircle,
  IndianRupee,
  UserCheck,
  UserX,
  Edit,
  Ban,
  Eye
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QuestionPaperPreview } from "@/components/QuestionPaperPreview";

interface AllIndiaExam {
  id: string;
  examType: string;
  title: string;
  description: string;
  scheduledDate: string;
  duration: number;
  totalQuestions: number;
  maxScore: number;
  status: string;
  registrationStartDate: string;
  registrationEndDate: string;
  maxParticipants: number;
  currentParticipants: number;
}

interface ExamRegistration {
  id: string;
  userId: string;
  registeredAt: string;
  status: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl: string | null;
  };
  isPaid: boolean;
  paymentAmount: number;
  paymentDate: string | null;
}

export default function AdminNationalTests() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [editingExam, setEditingExam] = useState<AllIndiaExam | null>(null);
  const [previewExamId, setPreviewExamId] = useState<string | null>(null);
  const [previewExamTitle, setPreviewExamTitle] = useState<string>("");
  const [editFormData, setEditFormData] = useState({
    scheduledDate: "",
    maxParticipants: 0,
  });
  const { toast } = useToast();

  // Fetch all National Tests
  const { data: nationalTests, isLoading: testsLoading } = useQuery({
    queryKey: ['/api/admin/national-tests'],
  });

  // Fetch registrations for selected exam
  const { data: registrations, isLoading: registrationsLoading } = useQuery({
    queryKey: ['/api/admin/national-tests', selectedExam, 'registrations'],
    enabled: !!selectedExam,
  });

  // Fetch questions for preview
  const { data: previewQuestions } = useQuery({
    queryKey: ['/api/admin/national-tests', previewExamId, 'questions'],
    enabled: !!previewExamId,
  });

  // Mutation to update test
  const updateTestMutation = useMutation({
    mutationFn: async (data: { examId: string; updates: any }) => {
      return await apiRequest(`/api/admin/national-tests/${data.examId}`, 'PATCH', data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/national-tests'] });
      toast({
        title: "Success",
        description: "National test updated successfully",
      });
      setEditingExam(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update test",
        variant: "destructive",
      });
    },
  });

  // Mutation to cancel test
  const cancelTestMutation = useMutation({
    mutationFn: async (examId: string) => {
      return await apiRequest(`/api/admin/national-tests/${examId}`, 'PATCH', { status: 'cancelled' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/national-tests'] });
      toast({
        title: "Success",
        description: "National test cancelled successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel test",
        variant: "destructive",
      });
    },
  });

  const handleEditClick = (test: AllIndiaExam) => {
    setEditingExam(test);
    setEditFormData({
      scheduledDate: new Date(test.scheduledDate).toISOString().slice(0, 16),
      maxParticipants: test.maxParticipants,
    });
  };

  const handleEditSubmit = () => {
    if (!editingExam) return;
    
    updateTestMutation.mutate({
      examId: editingExam.id,
      updates: {
        scheduledDate: new Date(editFormData.scheduledDate).toISOString(),
        maxParticipants: editFormData.maxParticipants,
      },
    });
  };

  const handleCancelTest = (examId: string) => {
    if (confirm("Are you sure you want to cancel this test? This action cannot be undone.")) {
      cancelTestMutation.mutate(examId);
    }
  };

  const filteredTests = nationalTests?.filter((test: AllIndiaExam) => 
    test.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.examType?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (testsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" data-testid="button-back-admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">National Tests Management</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading National Tests...</div>
        </div>
      </div>
    );
  }

  if (selectedExam) {
    const exam = nationalTests?.find((t: AllIndiaExam) => t.id === selectedExam);
    
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedExam(null)}
            data-testid="button-back-tests"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tests
          </Button>
          <h1 className="text-2xl font-bold">{exam?.title} - Registrations</h1>
        </div>

        {/* Exam Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Exam Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Exam Type</p>
                <p className="font-semibold">{exam?.examType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scheduled Date</p>
                <p className="font-semibold">
                  {exam?.scheduledDate ? new Date(exam.scheduledDate).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Registrations</p>
                <p className="font-semibold">{exam?.currentParticipants || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={exam?.status === 'upcoming' ? 'default' : 'secondary'}>
                  {exam?.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Registrations</p>
                  <p className="text-2xl font-bold" data-testid="text-total-registrations">
                    {registrations?.length || 0}
                  </p>
                </div>
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Paid Registrations</p>
                  <p className="text-2xl font-bold text-green-600" data-testid="text-paid-registrations">
                    {registrations?.filter((r: ExamRegistration) => r.isPaid).length || 0}
                  </p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payments</p>
                  <p className="text-2xl font-bold text-orange-600" data-testid="text-pending-payments">
                    {registrations?.filter((r: ExamRegistration) => !r.isPaid).length || 0}
                  </p>
                </div>
                <XCircle className="h-6 w-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Registrations List */}
        <Card>
          <CardHeader>
            <CardTitle>Registered Students</CardTitle>
          </CardHeader>
          <CardContent>
            {registrationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading registrations...</div>
              </div>
            ) : registrations?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No registrations found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {registrations?.map((registration: ExamRegistration) => (
                  <div 
                    key={registration.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`registration-${registration.id}`}
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={registration.user.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {registration.user.firstName?.[0]}{registration.user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {registration.user.firstName} {registration.user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {registration.user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Registered: {new Date(registration.registeredAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        {registration.isPaid ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-green-600">Paid</p>
                              <p className="text-xs text-muted-foreground">
                                ₹{registration.paymentAmount}
                              </p>
                              {registration.paymentDate && (
                                <p className="text-xs text-muted-foreground">
                                  {new Date(registration.paymentDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-orange-600" />
                            <p className="text-sm font-medium text-orange-600">Payment Pending</p>
                          </div>
                        )}
                      </div>
                      
                      <Badge variant={registration.status === 'registered' ? 'default' : 'secondary'}>
                        {registration.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm" data-testid="button-back-admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">National Tests Management</h1>
        </div>
        <Link href="/admin/national-tests/create">
          <Button data-testid="button-create-national-test">
            <Trophy className="h-4 w-4 mr-2" />
            Create National Test
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by test name or exam type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-tests"
              />
            </div>
          </CardContent>
        </Card>

        {/* National Tests List */}
        <Card>
          <CardHeader>
            <CardTitle>All National Tests</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? 'No tests found matching your search.' : 'No national tests found.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTests.map((test: AllIndiaExam) => (
                  <div 
                    key={test.id} 
                    className="border rounded-lg p-4 hover-elevate"
                    data-testid={`test-${test.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{test.title}</h3>
                          <Badge variant={test.examType === 'NEET' ? 'default' : 'secondary'}>
                            {test.examType}
                          </Badge>
                          <Badge variant={test.status === 'upcoming' ? 'default' : 'outline'}>
                            {test.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {test.description}
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Scheduled</p>
                              <p className="text-sm font-medium">
                                {new Date(test.scheduledDate).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Duration</p>
                              <p className="text-sm font-medium">{test.duration} min</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Questions</p>
                              <p className="text-sm font-medium">{test.totalQuestions}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Registrations</p>
                              <p className="text-sm font-medium">
                                {test.currentParticipants} / {test.maxParticipants}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button 
                          onClick={() => setSelectedExam(test.id)}
                          data-testid={`button-view-registrations-${test.id}`}
                        >
                          View Registrations
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setPreviewExamId(test.id);
                            setPreviewExamTitle(test.title);
                          }}
                          disabled={test.totalQuestions === 0}
                          data-testid={`button-dry-run-${test.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Dry Run
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleEditClick(test)}
                          data-testid={`button-edit-${test.id}`}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Test
                        </Button>
                        {test.status !== 'cancelled' && (
                          <Button 
                            variant="destructive"
                            onClick={() => handleCancelTest(test.id)}
                            disabled={cancelTestMutation.isPending}
                            data-testid={`button-cancel-${test.id}`}
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Cancel Test
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Test Dialog */}
      <Dialog open={!!editingExam} onOpenChange={(open) => !open && setEditingExam(null)}>
        <DialogContent data-testid="dialog-edit-test">
          <DialogHeader>
            <DialogTitle>Edit National Test</DialogTitle>
            <DialogDescription>
              Update test schedule and participant limits
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Scheduled Date & Time</Label>
              <Input
                id="scheduledDate"
                type="datetime-local"
                value={editFormData.scheduledDate}
                onChange={(e) => setEditFormData({ ...editFormData, scheduledDate: e.target.value })}
                data-testid="input-scheduled-date"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Maximum Participants</Label>
              <Input
                id="maxParticipants"
                type="number"
                min="1"
                value={editFormData.maxParticipants}
                onChange={(e) => setEditFormData({ ...editFormData, maxParticipants: parseInt(e.target.value) || 0 })}
                data-testid="input-max-participants"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditingExam(null)}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditSubmit}
              disabled={updateTestMutation.isPending}
              data-testid="button-save-edit"
            >
              {updateTestMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Paper Preview Dialog */}
      <QuestionPaperPreview
        open={!!previewExamId}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewExamId(null);
            setPreviewExamTitle("");
          }
        }}
        questions={previewQuestions || []}
        paperTitle={previewExamTitle}
      />
    </div>
  );
}