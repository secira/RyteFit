import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileUp, Trash2, Plus, File, Edit2, Check, X, Zap } from "lucide-react";
import { PaginatedResponse, SelectCandidateResume } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";

const DEFAULT_SLOT_NAMES = ["Professional", "Entry Level", "Academic", "Technical", "General"];

export default function ResumesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  // Debug: Check authentication
  useEffect(() => {
    if (!user) {
      console.log("⚠️ Not authenticated! User is:", user);
      toast({ title: "Please log in to upload resumes", variant: "destructive" });
    } else {
      console.log("✅ Authenticated user:", user.email, "ID:", user.id);
    }
  }, [user, toast]);

  const { data: resumes, isLoading, refetch } = useQuery<PaginatedResponse<SelectCandidateResume>>({
    queryKey: ["/api/resumes/my"],
    enabled: !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: { slotNumber: number; typeName: string; fileData?: string; fileName?: string; fileType?: string; fileSize?: number }) => {
      console.log("🚀 Starting upload mutation with:", formData.slotNumber, formData.typeName, formData.fileName);
      try {
        const response = await apiRequest("/api/resumes", { method: "POST", body: formData });
        const result = await response.json();
        console.log("✅ Upload successful:", result);
        return result;
      } catch (error: any) {
        console.error("❌ Upload error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("📝 Invalidating cache and refetching...");
      queryClient.invalidateQueries({ queryKey: ["/api/resumes/my"] });
      toast({ title: "Resume saved successfully" });
      setDialogOpen(false);
      setSelectedSlot(null);
      setSelectedFile(null);
      setTimeout(() => refetch(), 500);
    },
    onError: (error: any) => {
      console.error("❌ Mutation error:", error);
      toast({ title: error.message || "Failed to save resume", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/resumes/${id}`, { method: "DELETE" });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes/my"] });
      toast({ title: "Resume deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to delete resume", variant: "destructive" });
    },
  });

  const updateNameMutation = useMutation({
    mutationFn: async (data: { id: string; typeName: string }) => {
      const response = await apiRequest(`/api/resumes/${data.id}`, { method: "PATCH", body: { typeName: data.typeName } });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes/my"] });
      toast({ title: "Resume name updated" });
      setEditingSlot(null);
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to update resume name", variant: "destructive" });
    },
  });

  const simulateInterviewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/interviews/simulate", { method: "POST", body: {} });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Interview simulation started!", description: "Redirecting you to the interview..." });
      // Navigate to the interview page with the simulation token
      setTimeout(() => {
        navigate(`/interview/${data.interviewToken}`);
      }, 500);
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to start simulation", variant: "destructive" });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!validTypes.includes(file.type)) {
        toast({ title: "Invalid file type. Please upload PDF or Word document", variant: "destructive" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File size must be less than 10MB", variant: "destructive" });
        return;
      }
      console.log("📄 File selected:", file.name, "Size:", file.size);
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedSlot) {
      toast({ title: "Please select a resume slot", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "You must be logged in to upload", variant: "destructive" });
      return;
    }

    const existingResume = resumes?.data?.find(r => r.slotNumber === selectedSlot);
    const typeName = editingName || existingResume?.typeName || DEFAULT_SLOT_NAMES[selectedSlot - 1];

    console.log("📤 Upload handler called - Slot:", selectedSlot, "Type:", typeName, "File:", selectedFile?.name);

    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const base64 = e.target?.result as string;
          const fileType = selectedFile.type.includes("word") ? "docx" : "pdf";

          console.log("📨 Submitting upload - Base64 length:", base64.length);

          uploadMutation.mutate({
            slotNumber: selectedSlot,
            typeName,
            fileData: base64,
            fileName: selectedFile.name,
            fileType,
            fileSize: selectedFile.size,
          });
        } catch (err) {
          console.error("❌ Error in FileReader:", err);
          toast({ title: "Error reading file", variant: "destructive" });
        }
      };
      reader.onerror = () => {
        console.error("❌ FileReader error");
        toast({ title: "Error reading file", variant: "destructive" });
      };
      console.log("🔍 Starting FileReader...");
      reader.readAsDataURL(selectedFile);
    } else {
      console.log("⚠️ No file selected, just updating name");
      uploadMutation.mutate({
        slotNumber: selectedSlot,
        typeName,
      });
    }
  };

  if (!user) {
    return (
      <div className="space-y-4 p-6">
        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded p-4">
          <p className="text-yellow-800 dark:text-yellow-200">Please log in to manage your resumes</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-resumes-title">
            My Resumes
          </h1>
          <p className="text-muted-foreground">Organize up to 5 resumes by role type and customize names to match your target positions</p>
        </div>
      </div>

      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Test the AI Interview</h2>
              <p className="text-sm text-muted-foreground">Simulate the full interview experience to see how it works</p>
            </div>
            <Button
              onClick={() => simulateInterviewMutation.mutate()}
              disabled={simulateInterviewMutation.isPending}
              data-testid="button-simulate-interview"
            >
              <Zap className="h-4 w-4 mr-2" />
              {simulateInterviewMutation.isPending ? "Starting..." : "Simulate"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5].map((slot) => {
          const existingResume = resumes?.data?.find(r => r.slotNumber === slot);
          const displayName = existingResume?.typeName || DEFAULT_SLOT_NAMES[slot - 1];

          return (
            <Card key={slot} data-testid={`card-resume-slot-${slot}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {editingSlot === slot ? (
                      <div className="flex gap-1 items-center">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          placeholder="Resume type name"
                          className="h-8 text-sm"
                          data-testid={`input-edit-name-${slot}`}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div>
                        <CardTitle className="text-lg">{displayName}</CardTitle>
                        <CardDescription className="text-xs mt-1">Slot {slot} of 5</CardDescription>
                      </div>
                    )}
                  </div>
                  {editingSlot === slot ? (
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => {
                          if (editingName.trim()) {
                            if (existingResume) {
                              updateNameMutation.mutate({ id: existingResume.id, typeName: editingName.trim() });
                            } else {
                              setEditingName("");
                              setEditingSlot(null);
                              setSelectedSlot(slot);
                              setDialogOpen(true);
                            }
                          }
                        }}
                        data-testid={`button-confirm-edit-${slot}`}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => {
                          setEditingSlot(null);
                          setEditingName("");
                        }}
                        data-testid={`button-cancel-edit-${slot}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {existingResume?.fileData ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" data-testid={`text-filename-${existingResume.id}`}>
                          {existingResume.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`text-upload-date-${existingResume.id}`}>
                          {existingResume.uploadedAt
                            ? new Date(existingResume.uploadedAt).toLocaleDateString()
                            : "No date"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        data-testid={`button-edit-name-${slot}`}
                        onClick={() => {
                          setEditingSlot(slot);
                          setEditingName(displayName);
                        }}
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Rename
                      </Button>
                      <Dialog open={selectedSlot === slot && dialogOpen} onOpenChange={(open) => {
                        if (!open) {
                          setSelectedSlot(null);
                          setDialogOpen(false);
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            data-testid={`button-replace-${slot}`}
                            onClick={() => {
                              setSelectedSlot(slot);
                              setDialogOpen(true);
                            }}
                          >
                            <FileUp className="h-3 w-3 mr-1" />
                            Replace
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Update Resume</DialogTitle>
                            <DialogDescription>
                              Upload a new resume for {displayName}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor={`file-input-${slot}`} className="block mb-2">
                                Resume File (PDF or Word)
                              </Label>
                              <Input
                                id={`file-input-${slot}`}
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileSelect}
                                data-testid={`input-file-upload-${slot}`}
                              />
                              {selectedFile && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setDialogOpen(false);
                                  setSelectedSlot(null);
                                  setSelectedFile(null);
                                }}
                                data-testid="button-cancel"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleUpload}
                                disabled={uploadMutation.isPending || !selectedFile}
                                data-testid="button-upload-confirm"
                              >
                                {uploadMutation.isPending ? "Uploading..." : "Upload"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        data-testid={`button-delete-${slot}`}
                        onClick={() => deleteMutation.mutate(existingResume.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <FileUp className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                    <p className="text-xs text-muted-foreground mb-3">No resume</p>
                    <Dialog open={selectedSlot === slot && dialogOpen} onOpenChange={(open) => {
                      if (!open) {
                        setSelectedSlot(null);
                        setDialogOpen(false);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="secondary"
                          data-testid={`button-upload-${slot}`}
                          onClick={() => {
                            setSelectedSlot(slot);
                            setEditingName("");
                            setDialogOpen(true);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Upload
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Upload Resume</DialogTitle>
                          <DialogDescription>
                            Add a resume for this slot
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor={`name-input-${slot}`} className="block mb-2">
                              Resume Type Name
                            </Label>
                            <Input
                              id={`name-input-${slot}`}
                              placeholder={DEFAULT_SLOT_NAMES[slot - 1]}
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              data-testid={`input-type-name-${slot}`}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              e.g., CTO, VP Engg, Director Technology
                            </p>
                          </div>
                          <div>
                            <Label htmlFor={`file-input-new-${slot}`} className="block mb-2">
                              Resume File (PDF or Word)
                            </Label>
                            <Input
                              id={`file-input-new-${slot}`}
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={handleFileSelect}
                              data-testid={`input-file-upload-new-${slot}`}
                            />
                            {selectedFile && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setDialogOpen(false);
                                setSelectedSlot(null);
                                setSelectedFile(null);
                                setEditingName("");
                              }}
                              data-testid="button-cancel"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleUpload}
                              disabled={uploadMutation.isPending || !selectedFile}
                              data-testid="button-upload-confirm"
                            >
                              {uploadMutation.isPending ? "Uploading..." : "Upload"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
