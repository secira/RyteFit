import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Video, VideoOff, Volume2, VolumeX, Play, Square, Loader2, Briefcase, Building2, MapPin, Send } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Job {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  experienceLevel: string | null;
}

interface Application {
  id: string;
  jobId: string;
  status: string;
}

interface InterviewSession {
  id: string;
  applicationId: string;
  jobId: string;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
}

export default function AIInterview() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get application ID from URL (/ai-interview/:applicationId)
  const [, params] = useRoute("/ai-interview/:applicationId");
  const applicationId = params?.applicationId;
  
  // Fetch application data
  const { data: application } = useQuery<Application>({
    queryKey: ['/api/applications', applicationId],
    enabled: !!applicationId && !!user,
  });

  // Fetch job data
  const { data: job } = useQuery<Job>({
    queryKey: ['/api/jobs', application?.jobId],
    enabled: !!application?.jobId,
  });

  // Fetch or check for existing interview session
  const { data: existingSession } = useQuery<InterviewSession | null>({
    queryKey: ['/api/interviews/application', applicationId],
    enabled: !!applicationId,
  });
  
  // Interview state
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isObjectiveQuestion, setIsObjectiveQuestion] = useState(false); // Track if question has options
  
  // Answer state
  const [textAnswer, setTextAnswer] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Media state
  const [isVideoMicOn, setIsVideoMicOn] = useState(false); // Video mic OFF by default - separate from answer mic
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false); // For video recording
  const [isVoiceRecording, setIsVoiceRecording] = useState(false); // For voice-to-text answer recording
  
  // Configuration state
  const [examType, setExamType] = useState<string>("Technical");
  const [subject, setSubject] = useState<string>("Software Development");
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null); // For video recording
  const voiceRecorderRef = useRef<MediaRecorder | null>(null); // For voice-to-text recording
  const audioChunksRef = useRef<Blob[]>([]);
  const voiceChunksRef = useRef<Blob[]>([]); // For voice-to-text chunks
  const audioContextRef = useRef<AudioContext | null>(null);

  // Use existing session if available
  useEffect(() => {
    if (existingSession && !currentSession) {
      setCurrentSession(existingSession);
    }
  }, [existingSession]);

  // Initialize WebSocket connection
  const initializeWebSocket = async (sessionId: string) => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/interview`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      ws.send(JSON.stringify({
        type: 'init',
        sessionId,
        userId: (user as any)?.id,
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to establish WebSocket connection.",
        variant: "destructive",
      });
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
  };

  // Handle WebSocket messages
  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'init_success':
        console.log('Interview session initialized');
        requestNextQuestion();
        break;
      
      case 'question':
      case 'next_question':
        setCurrentQuestion(message.questionText);
        setQuestionNumber(message.questionNumber || 0);
        setTotalQuestions(message.totalQuestions || 0);
        
        // Determine if this is an objective question (has options A/B/C/D)
        // For now, we'll check if the question contains "A)", "B)", "C)", "D)" patterns
        const hasOptions = /[A-D]\)/.test(message.questionText);
        setIsObjectiveQuestion(hasOptions);
        
        // Clear previous answer when new question arrives
        setTextAnswer("");
        
        // Play audio if available
        if (message.audioData && isSpeakerOn) {
          playAudio(message.audioData);
        }
        break;
      
      case 'transcription':
        console.log('Transcription received:', message.text);
        // Populate the text answer field with transcribed voice
        if (message.text) {
          setTextAnswer(prev => prev ? `${prev} ${message.text}` : message.text);
          toast({
            title: "Voice Transcribed",
            description: "Your voice has been converted to text.",
          });
        }
        break;
      
      case 'interview_complete':
        setIsInterviewActive(false);
        toast({
          title: "Interview Complete!",
          description: `Your score: ${message.overallScore}/100`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/interviews'] });
        stopMediaStreams();
        break;
      
      case 'error':
        toast({
          title: "Error",
          description: message.message,
          variant: "destructive",
        });
        break;
    }
  };

  // Play audio from base64
  const playAudio = async (audioBase64: string) => {
    try {
      const audioBlob = base64ToBlob(audioBase64, 'audio/mpeg');
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  // Convert base64 to Blob
  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArrays.push(byteCharacters.charCodeAt(i));
    }
    
    return new Blob([new Uint8Array(byteArrays)], { type: mimeType });
  };

  // Request next question
  const requestNextQuestion = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'question_request',
        sessionId: currentSession?.id,
      }));
    }
  };

  // Submit answer
  // Submit text answer
  const submitAnswer = async (answerText?: string) => {
    const finalAnswer = answerText || textAnswer;
    
    if (!finalAnswer.trim()) {
      toast({
        title: "Empty Answer",
        description: "Please provide an answer before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'answer_submit',
        sessionId: currentSession?.id,
        answerText: finalAnswer,
        audioUrl: null,
        duration: 0,
      }));
      
      // Clear the text answer after submission
      setTextAnswer("");
      
      toast({
        title: "Answer Submitted",
        description: "Your answer has been recorded.",
      });
    }
    
    setIsSubmitting(false);
  };

  // Start interview
  const startInterview = async () => {
    if (!currentSession) {
      toast({
        title: "No Interview Session",
        description: "Please start from your scheduled interviews.",
        variant: "destructive",
      });
      return;
    }
    
    await initializeWebSocket(currentSession.id);
    setIsInterviewActive(true);
    startMediaStreams();
  };

  // Start media streams (video/audio) - For video recording only
  const startMediaStreams = async () => {
    try {
      // Only request media if at least one is enabled
      if (!isVideoMicOn && !isVideoOn) {
        console.log('Skipping media streams - both video mic and video are off');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoOn,
        audio: isVideoMicOn, // Separate video mic for recording
      });

      if (videoRef.current && isVideoOn) {
        videoRef.current.srcObject = stream;
      }

      // Setup audio recording if video mic is on
      if (isVideoMicOn) {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          audioChunksRef.current = [];
          
          // This is for storing video/audio recording, not for voice-to-text
          console.log('Video recording audio stopped, size:', audioBlob.size);
        };

        setIsRecording(true);
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast({
        title: "Media Access Error",
        description: "Failed to access camera/microphone. You can still continue without media.",
        variant: "destructive",
      });
      // Continue without media - WebSocket is already initialized
    }
  };

  // Stop media streams
  const stopMediaStreams = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Toggle video on/off during interview
  const toggleVideo = async () => {
    const newVideoState = !isVideoOn;
    setIsVideoOn(newVideoState);

    if (!newVideoState) {
      // Turn OFF video - stop only video tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const videoTracks = stream.getVideoTracks();
        videoTracks.forEach(track => track.stop());
        
        // If no audio track either, clear the srcObject completely
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
          videoRef.current.srcObject = null;
        }
      }
    } else {
      // Turn ON video - request new video stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false, // Don't re-request audio
        });

        if (videoRef.current) {
          // If there's an existing stream with audio, add video track to it
          if (videoRef.current.srcObject) {
            const existingStream = videoRef.current.srcObject as MediaStream;
            const videoTrack = stream.getVideoTracks()[0];
            existingStream.addTrack(videoTrack);
          } else {
            // No existing stream, set the new one
            videoRef.current.srcObject = stream;
          }
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        toast({
          title: "Camera Access Error",
          description: "Failed to access camera.",
          variant: "destructive",
        });
        setIsVideoOn(false);
      }
    }
  };

  // Toggle recording (for video recording)
  const toggleRecording = () => {
    if (mediaRecorderRef.current) {
      if (isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      } else {
        mediaRecorderRef.current.start();
        setIsRecording(true);
      }
    }
  };

  // Voice-to-text recording - Hold to speak, release to convert
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const voiceRecorder = new MediaRecorder(stream);
      voiceRecorderRef.current = voiceRecorder;
      voiceChunksRef.current = [];

      voiceRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          voiceChunksRef.current.push(event.data);
        }
      };

      voiceRecorder.onstop = async () => {
        const audioBlob = new Blob(voiceChunksRef.current, { type: 'audio/webm' });
        voiceChunksRef.current = [];
        
        // Convert to base64 and send to server for transcription
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          if (base64Audio && wsRef.current) {
            wsRef.current.send(JSON.stringify({
              type: 'audio_chunk',
              sessionId: currentSession?.id,
              audioData: base64Audio,
              timestamp: Date.now(),
            }));
          }
        };

        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
      };

      voiceRecorder.start();
      setIsVoiceRecording(true);
    } catch (error) {
      console.error('Error accessing microphone for voice recording:', error);
      toast({
        title: "Microphone Access Error",
        description: "Failed to access microphone for voice recording.",
        variant: "destructive",
      });
    }
  };

  const stopVoiceRecording = () => {
    if (voiceRecorderRef.current && isVoiceRecording) {
      voiceRecorderRef.current.stop();
      setIsVoiceRecording(false);
    }
  };

  // End interview
  const endInterview = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'session_end',
        sessionId: currentSession?.id,
      }));
      wsRef.current.close();
    }
    
    setIsInterviewActive(false);
    stopMediaStreams();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      stopMediaStreams();
    };
  }, []);

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Video Interview</CardTitle>
            <CardDescription>Please log in to access your interview.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  // Require applicationId for real interviews
  if (!applicationId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Interview Selected</CardTitle>
            <CardDescription>Please start from your scheduled interviews page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Video Interview</h1>
          <p className="text-muted-foreground">Complete your interview with our AI interviewer</p>
        </div>
      </div>

      {!isInterviewActive ? (
        <>
          {/* Configuration Card */}
          <Card>
            <CardHeader>
              <CardTitle>Start New Interview</CardTitle>
              <CardDescription>Configure your interview settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Interview Type</label>
                  <Select value={examType} onValueChange={setExamType}>
                    <SelectTrigger data-testid="select-exam-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technical">Technical Interview</SelectItem>
                      <SelectItem value="Behavioral">Behavioral Interview</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Focus Area</label>
                  <Select value={subject || ""} onValueChange={setSubject}>
                    <SelectTrigger data-testid="select-subject">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Software Development">Software Development</SelectItem>
                      <SelectItem value="Data Science">Data Science</SelectItem>
                      <SelectItem value="Product Management">Product Management</SelectItem>
                      {examType === "Technical" && <SelectItem value="System Design">System Design</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setIsVideoMicOn(!isVideoMicOn)}
                  variant={isVideoMicOn ? "default" : "outline"}
                  size="sm"
                  data-testid="button-toggle-video-mic"
                >
                  {isVideoMicOn ? <Mic className="h-4 w-4 mr-2" /> : <MicOff className="h-4 w-4 mr-2" />}
                  {isVideoMicOn ? "Video Mic On" : "Video Mic Off"}
                </Button>

                <Button
                  onClick={toggleVideo}
                  variant={isVideoOn ? "default" : "outline"}
                  size="sm"
                  data-testid="button-toggle-video"
                >
                  {isVideoOn ? <Video className="h-4 w-4 mr-2" /> : <VideoOff className="h-4 w-4 mr-2" />}
                  {isVideoOn ? "Video On" : "Video Off"}
                </Button>

                <Button
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  variant={isSpeakerOn ? "default" : "outline"}
                  size="sm"
                  data-testid="button-toggle-speaker"
                >
                  {isSpeakerOn ? <Volume2 className="h-4 w-4 mr-2" /> : <VolumeX className="h-4 w-4 mr-2" />}
                  {isSpeakerOn ? "Speaker On" : "Speaker Off"}
                </Button>
              </div>

              <Button
                onClick={startInterview}
                disabled={!currentSession}
                className="w-full"
                size="lg"
                data-testid="button-start-interview"
              >
                <Play className="h-5 w-5 mr-2" />
                {currentSession ? 'Start Interview' : 'Loading...'}
              </Button>
            </CardContent>
          </Card>

        </>
      ) : (
        <>
          {/* Active Interview - Redesigned Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Questions & Answers */}
            <div className="lg:col-span-2 space-y-6">
              {/* Interview Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Interview in Progress</CardTitle>
                      <CardDescription>
                        Question {questionNumber} of {totalQuestions}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={endInterview}
                      variant="destructive"
                      size="sm"
                      data-testid="button-end-interview"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      End Interview
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Current Question - Large Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Current Question</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-medium leading-relaxed whitespace-pre-wrap">
                    {currentQuestion || "Waiting for question..."}
                  </p>
                </CardContent>
              </Card>

              {/* Answer Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Answer</CardTitle>
                  <CardDescription>
                    Type your answer below or use voice recording
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Text Answer Input (DEFAULT) */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Textarea
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        className="flex-1 min-h-[120px] text-base"
                        data-testid="textarea-answer"
                      />
                      {/* Voice-to-text mic button - Always visible, hold to speak */}
                      <Button
                        onPointerDown={startVoiceRecording}
                        onPointerUp={stopVoiceRecording}
                        onPointerLeave={stopVoiceRecording}
                        variant={isVoiceRecording ? "destructive" : "outline"}
                        size="icon"
                        className="shrink-0"
                        data-testid="button-voice-to-text"
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {isVoiceRecording && (
                      <div className="flex items-center gap-2 text-destructive animate-pulse">
                        <div className="h-2 w-2 rounded-full bg-destructive"></div>
                        <span className="text-sm font-medium">Recording... (release to convert to text)</span>
                      </div>
                    )}
                    
                    <Button
                      onClick={() => submitAnswer()}
                      disabled={isSubmitting || !textAnswer.trim()}
                      className="w-full"
                      size="lg"
                      data-testid="button-submit-answer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5 mr-2" />
                          Submit Answer
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Multiple Choice Options - Only for Objective Questions */}
                  {isObjectiveQuestion && (
                    <div className="space-y-2 pt-4 border-t">
                      <p className="text-sm font-medium text-muted-foreground">Or select an option:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {['A', 'B', 'C', 'D'].map((option) => (
                          <Button
                            key={option}
                            onClick={() => submitAnswer(option)}
                            variant="outline"
                            size="lg"
                            className="h-16 text-xl font-semibold"
                            data-testid={`button-answer-${option.toLowerCase()}`}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Video Feed (Small) */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-sm">Candidate Video</CardTitle>
                  <CardDescription className="text-xs">Monitor your reactions</CardDescription>
                </CardHeader>
                <CardContent className="p-3">
                  {isVideoOn ? (
                    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="relative bg-muted rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                      <VideoOff className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Quick Media Controls */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={() => setIsVideoMicOn(!isVideoMicOn)}
                      variant={isVideoMicOn ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      data-testid="button-toggle-video-mic-active"
                    >
                      {isVideoMicOn ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
                    </Button>
                    <Button
                      onClick={toggleVideo}
                      variant={isVideoOn ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      data-testid="button-toggle-video-active"
                    >
                      {isVideoOn ? <Video className="h-3 w-3" /> : <VideoOff className="h-3 w-3" />}
                    </Button>
                    <Button
                      onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                      variant={isSpeakerOn ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      data-testid="button-toggle-speaker-active"
                    >
                      {isSpeakerOn ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
