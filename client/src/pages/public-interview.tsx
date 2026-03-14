import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Video, Loader2, CheckCircle, Mic, MicOff, Clock, MessageSquare, Code2, Volume2, Play, User, Building2, AlertTriangle, Type, XCircle, StopCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface Question {
  id: string;
  question: string;
  category: string;
  type: 'subject' | 'behavioral' | 'coding' | 'team_management';
  conceptsCovered?: string[];
}

interface ConceptCoverage {
  totalConcepts: number;
  conceptsCovered: string[];
  coveragePercentage: number;
  coverageByCategory?: Record<string, { covered: number; total: number; percentage: number }>;
}

// Check if browser supports Web Speech API
const hasSpeechRecognition = () => {
  return !!(typeof window !== 'undefined' && 
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
};

export default function PublicInterview() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [totalInterviewTime, setTotalInterviewTime] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<BlobPart[]>([]);
  const [questionAnswered, setQuestionAnswered] = useState<boolean[]>([]);
  const [useTextFallback, setUseTextFallback] = useState(!hasSpeechRecognition());
  const [textAnswer, setTextAnswer] = useState("");
  
  // Maximum interview duration: 60 minutes (3600 seconds)
  const MAX_INTERVIEW_TIME = 3600;
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  // Fetch interview details
  const { data: interviewData, isLoading, error } = useQuery({
    queryKey: [`/api/public/interview/${token}`],
    enabled: !!token,
  });

  // Fetch questions based on job role - fetch early to show concept coverage on welcome page
  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: [`/api/public/interview/${token}/questions`],
    enabled: !!token && !!(interviewData as any)?.sessionId,
  });

  const questions: Question[] = (questionsData as any)?.questions || [];
  const conceptCoverage: ConceptCoverage | null = (questionsData as any)?.conceptCoverage || null;
  const currentQ = questions[currentQuestion];

  // Initialize answers array when questions load
  useEffect(() => {
    if (questions.length > 0 && answers.length === 0) {
      setAnswers(new Array(questions.length).fill(""));
      setQuestionAnswered(new Array(questions.length).fill(false));
    }
  }, [questions.length, answers.length]);

  // Start continuous video recording when interview starts
  const startContinuousRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320, max: 320 },
          height: { ideal: 240, max: 240 },
          frameRate: { ideal: 10, max: 15 }
        },
        audio: true,
      });
      
      setMediaStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 150000,
        audioBitsPerSecond: 32000
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setRecordedChunks((prev) => [...prev, e.data]);
        }
      };

      // Record in 10-second chunks for continuous capture
      mediaRecorder.start(10000);
      
      toast({
        title: "Camera Active",
        description: "Your video is being recorded throughout the interview.",
      });
    } catch (error) {
      toast({
        title: "Camera/Microphone Required",
        description: "Please allow access to your camera and microphone to continue.",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  // Track which questions have had TTS played to prevent loops
  const ttsPlayedForQuestionRef = useRef<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  // Cache decoded audio buffers for replay without re-fetching
  const audioBufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  
  // Play TTS for current question using Web Audio API (most reliable)
  const playQuestionAudio = useCallback(async (questionText: string, questionId: string, forceReplay: boolean = false) => {
    // Prevent playing TTS multiple times for the same question (unless forced replay)
    if (!forceReplay && ttsPlayedForQuestionRef.current.has(questionId)) {
      console.log('[TTS] Already played for question:', questionId);
      return;
    }
    
    if (!forceReplay) {
      ttsPlayedForQuestionRef.current.add(questionId);
    }
    setIsPlayingTTS(true);
    
    try {
      // Initialize AudioContext (required for Web Audio API)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioContext = audioContextRef.current;
      
      // Resume context if suspended (browser autoplay policy)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('[TTS] AudioContext resumed');
      }
      
      let audioBuffer: AudioBuffer;
      
      // Check if we have a cached audio buffer for replay
      if (forceReplay && audioBufferCacheRef.current.has(questionId)) {
        console.log('[TTS] Using cached audio buffer for replay:', questionId);
        audioBuffer = audioBufferCacheRef.current.get(questionId)!;
      } else {
        console.log('[TTS] Requesting speech for question:', questionId);
        
        // Use streaming format for raw binary audio
        const response = await fetch(`/api/public/interview/${token}/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: questionText, questionId, format: 'stream' }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[TTS] Server error:', errorText);
          throw new Error('Failed to generate speech');
        }
        
        // Get raw binary audio directly from response
        const arrayBuffer = await response.arrayBuffer();
        console.log('[TTS] Received audio data, size:', arrayBuffer.byteLength, 'bytes');
        
        // Decode the MP3 audio data
        console.log('[TTS] Decoding audio buffer...');
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
        console.log('[TTS] Audio decoded, duration:', audioBuffer.duration, 'seconds');
        
        // Cache the decoded buffer for replay
        audioBufferCacheRef.current.set(questionId, audioBuffer);
      }
      
      // Stop any previous audio
      if (audioSourceRef.current) {
        try {
          audioSourceRef.current.stop();
        } catch (e) {
          // Ignore errors from stopping already stopped source
        }
      }
      
      // Create and configure audio source
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      // Set up completion handler
      source.onended = () => {
        console.log('[TTS] Audio playback ended successfully');
        setIsPlayingTTS(false);
      };
      
      audioSourceRef.current = source;
      
      // Start playback
      console.log('[TTS] Starting audio playback...');
      source.start(0);
      console.log('[TTS] Audio playback started');
      
    } catch (error: any) {
      console.error('[TTS] Error:', error?.message || error);
      setIsPlayingTTS(false);
    }
  }, [token]);

  // Start voice recognition for answering
  const startListening = useCallback(async () => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Please use Chrome or Edge browser for voice input.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Append voice transcription directly to the editable text answer
      if (finalTranscript) {
        setTextAnswer((prev) => prev ? prev + finalTranscript : finalTranscript);
        setCurrentTranscript((prev) => prev + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        toast({
          title: "Voice Recognition Error",
          description: "Please try speaking again.",
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => {
      // Restart if still listening
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Ignore if already started
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);

    toast({
      title: "Listening...",
      description: "Speak your answer clearly.",
    });
  }, [toast, isListening]);

  // Stop voice recognition
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);

    // Voice transcript is already being added to textAnswer via onresult
    // Just save the current textAnswer to answers
    if (textAnswer.trim()) {
      const newAnswers = [...answers];
      newAnswers[currentQuestion] = textAnswer.trim();
      setAnswers(newAnswers);

      const newAnswered = [...questionAnswered];
      newAnswered[currentQuestion] = true;
      setQuestionAnswered(newAnswered);
    }
  }, [textAnswer, currentQuestion, answers, questionAnswered]);

  // Save text answer (fallback mode)
  const saveTextAnswer = useCallback(() => {
    if (textAnswer.trim()) {
      const newAnswers = [...answers];
      newAnswers[currentQuestion] = textAnswer.trim();
      setAnswers(newAnswers);

      const newAnswered = [...questionAnswered];
      newAnswered[currentQuestion] = true;
      setQuestionAnswered(newAnswered);
    }
  }, [textAnswer, currentQuestion, answers, questionAnswered]);

  // Handle next question
  const handleNextQuestion = useCallback(() => {
    // Stop current listening
    stopListening();
    
    // Save text answer if using fallback
    if (useTextFallback) {
      saveTextAnswer();
    }
    
    // Move to next question
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setCurrentTranscript("");
      setTextAnswer("");
    }
  }, [currentQuestion, questions.length, stopListening, useTextFallback, saveTextAnswer]);

  // Play TTS when question changes
  useEffect(() => {
    if (interviewStarted && currentQ?.question && currentQ?.id && !isPlayingTTS && questions.length > 0) {
      playQuestionAudio(currentQ.question, currentQ.id);
    }
  }, [currentQuestion, interviewStarted, currentQ?.id, questions.length]);

  // Connect video stream to video element when both are available
  useEffect(() => {
    if (mediaStream && videoRef.current) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch(err => {
        console.log('Video autoplay prevented:', err);
      });
    }
  }, [mediaStream, interviewStarted, questions.length]);

  // Overall interview timer - 60 minutes maximum
  useEffect(() => {
    if (interviewStarted && questions.length > 0) {
      totalTimerRef.current = setInterval(() => {
        setTotalInterviewTime((prev) => {
          if (prev >= MAX_INTERVIEW_TIME - 1) {
            // Time's up - auto-submit the interview
            clearInterval(totalTimerRef.current!);
            toast({
              title: "Time Limit Reached",
              description: "The 60-minute interview time limit has been reached. Submitting your answers now.",
              variant: "destructive",
            });
            // Trigger auto-submit after a brief delay
            setTimeout(() => {
              document.querySelector('[data-testid="button-submit-interview"]')?.dispatchEvent(
                new MouseEvent('click', { bubbles: true })
              );
            }, 1000);
            return MAX_INTERVIEW_TIME;
          }
          return prev + 1;
        });
      }, 1000);
    }
    
    return () => {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    };
  }, [interviewStarted, questions.length, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaStream]);

  const startInterviewMutation = useMutation({
    mutationFn: async () => {
      // Start video recording first
      await startContinuousRecording();
      
      return await fetch(`/api/public/interview/${token}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).then(r => r.json());
    },
    onSuccess: () => {
      setInterviewStarted(true);
      toast({
        title: "Interview Started",
        description: "Your video is being recorded. Listen to each question and answer verbally.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Start Interview",
        description: error.message || "Could not start interview. Please allow camera access.",
        variant: "destructive",
      });
    },
  });

  // Cancel/Stop interview
  const cancelInterview = useCallback(() => {
    // Stop any active listening
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    
    // Stop TTS if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsPlayingTTS(false);
    
    // Stop video recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop media stream
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    
    // Clear timer
    if (totalTimerRef.current) {
      clearInterval(totalTimerRef.current);
    }
    
    // Reset states
    setInterviewStarted(false);
    setCurrentQuestion(0);
    setAnswers([]);
    setCurrentTranscript("");
    setTextAnswer("");
    setTotalInterviewTime(0);
    setRecordedChunks([]);
    
    toast({
      title: "Interview Cancelled",
      description: "You have exited the interview. You can restart anytime.",
    });
  }, [mediaStream]);

  // Submit interview
  const submitInterview = async () => {
    if (isSubmitting) return;
    
    // Stop listening if active
    stopListening();
    
    // Save text answer if using fallback
    if (useTextFallback) {
      saveTextAnswer();
    }
    
    // Check if at least half of the questions have been answered
    const answeredCount = answers.filter(a => a && a.trim().length > 0).length;
    const minRequired = Math.ceil(questions.length / 2);
    
    if (answeredCount < minRequired) {
      toast({
        title: "Please Answer More Questions",
        description: `You have answered ${answeredCount} of ${questions.length} questions. Please answer at least ${minRequired} questions before submitting.`,
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Stop video recording and wait for final chunk
      let finalVideoBlob: Blob | null = null;
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        console.log('[VIDEO] Stopping MediaRecorder and waiting for final chunk...');
        
        // Create a promise that resolves when onstop is called
        finalVideoBlob = await new Promise<Blob | null>((resolve) => {
          const recorder = mediaRecorderRef.current!;
          const allChunks = [...recordedChunks];
          
          // Handle the final data chunk
          const originalOnDataAvailable = recorder.ondataavailable;
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              console.log('[VIDEO] Final chunk received:', e.data.size, 'bytes');
              allChunks.push(e.data);
            }
            if (originalOnDataAvailable) {
              originalOnDataAvailable.call(recorder, e);
            }
          };
          
          // When recording stops, create the final blob
          recorder.onstop = () => {
            console.log('[VIDEO] MediaRecorder stopped, total chunks:', allChunks.length);
            if (allChunks.length > 0) {
              const blob = new Blob(allChunks, { type: "video/webm" });
              console.log('[VIDEO] Final blob size:', Math.round(blob.size / 1024 / 1024 * 100) / 100, 'MB');
              resolve(blob);
            } else {
              console.log('[VIDEO] No video chunks recorded');
              resolve(null);
            }
          };
          
          // Stop the recorder
          recorder.stop();
        });
      } else if (recordedChunks.length > 0) {
        // Fallback: use existing chunks if recorder already stopped
        finalVideoBlob = new Blob(recordedChunks, { type: "video/webm" });
        console.log('[VIDEO] Using existing chunks, blob size:', Math.round(finalVideoBlob.size / 1024 / 1024 * 100) / 100, 'MB');
      }

      // Convert blob to base64
      let videoBase64 = null;
      if (finalVideoBlob && finalVideoBlob.size > 0) {
        console.log('[VIDEO] Converting blob to base64...');
        const arrayBuffer = await finalVideoBlob.arrayBuffer();
        videoBase64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        console.log('[VIDEO] Base64 conversion complete, length:', videoBase64.length);
      }

      console.log('[INTERVIEW] Submitting interview with video:', !!videoBase64);
      
      const response = await fetch(`/api/public/interview/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          videoBlob: videoBase64,
          completedAt: new Date().toISOString(),
        }),
      }).then(r => r.json());

      console.log('[INTERVIEW] Submit response:', response);

      // Stop all media tracks
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }

      toast({
        title: "Interview Submitted",
        description: "Thank you! Your interview has been recorded and submitted for evaluation.",
      });

      setTimeout(() => {
        window.location.href = "/interview-complete";
      }, 2000);
    } catch (error: any) {
      console.error('[INTERVIEW] Submit error:', error);
      toast({
        title: "Submission Error",
        description: error.message || "Failed to submit interview.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getQuestionIcon = (category: string) => {
    switch (category) {
      case "subject":
      case "technical":
      case "coding":
        return <Code2 className="h-4 w-4" />;
      case "behavioral":
        return <MessageSquare className="h-4 w-4" />;
      case "team_management":
        return <User className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };


  // Minimal header component for interview pages
  const MinimalHeader = () => (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <span className="text-xl font-bold text-primary">RyteFit</span>
      </div>
    </header>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <MinimalHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <h1 className="text-xl font-semibold">Invalid or Expired Interview Link</h1>
                <p className="text-sm text-muted-foreground">
                  This interview link is no longer valid. Please contact your recruiter.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <MinimalHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-4xl w-full">
            <CardContent className="pt-6">
              <Skeleton className="h-96 w-full mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const interviewInfo = interviewData as any;
  const candidateName = interviewInfo?.candidateName || "Candidate";
  const jobTitle = interviewInfo?.job?.title || "Position";
  const companyName = interviewInfo?.company?.name || "Company";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MinimalHeader />

      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          {!interviewStarted ? (
            // Pre-Interview Screen with Welcome Message
            <Card className="w-full">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Video className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Welcome to Your Interview!</CardTitle>
              <CardDescription className="text-lg mt-2">
                Hello! We're excited to meet you for the <strong>{jobTitle}</strong> position at <strong>{companyName}</strong>.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Welcome Message */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
                <p className="text-base leading-relaxed">
                  This AI-powered interview will help us understand your skills and experience better.
                  Please relax, be yourself, and answer each question naturally. Your video will be recorded 
                  throughout the interview for our hiring team to review.
                </p>
              </div>

              {/* Concept Coverage Section */}
              {questionsLoading && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-700 dark:text-blue-300">Generating personalized questions for your interview...</span>
                  </div>
                </div>
              )}

              {conceptCoverage && !questionsLoading && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Interview Coverage Analysis
                    </h3>
                    <Badge variant={conceptCoverage.coveragePercentage >= 60 ? "default" : "secondary"}>
                      {conceptCoverage.coveragePercentage}% Coverage
                    </Badge>
                  </div>
                  <Progress value={conceptCoverage.coveragePercentage} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    Your interview consists of <strong>{questions.length} questions</strong> covering <strong>{conceptCoverage.coveragePercentage}%</strong> of the key concepts required for this role.
                  </p>
                  {conceptCoverage.conceptsCovered && conceptCoverage.conceptsCovered.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {conceptCoverage.conceptsCovered.slice(0, 8).map((concept, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {concept}
                        </Badge>
                      ))}
                      {conceptCoverage.conceptsCovered.length > 8 && (
                        <Badge variant="outline" className="text-xs">
                          +{conceptCoverage.conceptsCovered.length - 8} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Interview Format
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex gap-2">
                      <Volume2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Each question will be <strong>read aloud by AI</strong> and displayed on screen</span>
                    </li>
                    <li className="flex gap-2">
                      <Mic className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Answer each question <strong>verbally</strong> - no typing needed</span>
                    </li>
                    <li className="flex gap-2">
                      <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>You have <strong>60 minutes total</strong> to complete the interview</span>
                    </li>
                    <li className="flex gap-2">
                      <Video className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Video records <strong>continuously</strong> throughout the interview</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span><strong>{questions.length || '8-30'} questions</strong> customized based on role complexity</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Before You Start
                  </h3>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      Ensure camera and microphone are working
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      Find a quiet, well-lit place
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      Use headphones for better audio quality
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      Close other browser tabs and applications
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      Ensure stable internet connection
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <p className="text-sm text-amber-700 dark:text-amber-400 text-center">
                  <strong>Important:</strong> Once you start, your video will record continuously. 
                  You have 60 minutes to complete the interview. Take your time on each question - 
                  there is no per-question time limit. The interview will auto-submit when time expires.
                </p>
              </div>

              <Button
                onClick={() => startInterviewMutation.mutate()}
                disabled={startInterviewMutation.isPending}
                className="w-full"
                size="lg"
                data-testid="button-start-interview"
              >
                {startInterviewMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting Interview...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Interview
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : questionsLoading || (interviewStarted && questions.length === 0) ? (
          // Loading questions
          <Card className="w-full">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-lg font-medium">Preparing your interview questions...</p>
                <p className="text-sm text-muted-foreground">Our AI is customizing questions for this role. This may take a few moments.</p>
                <Button
                  variant="outline"
                  onClick={cancelInterview}
                  className="mt-4"
                  data-testid="button-cancel-loading"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Interview Screen - Split Layout
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Top Timer Bar */}
            <div className="lg:col-span-3 flex items-center justify-between gap-4 p-4 bg-card rounded-lg border">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-base px-3 py-1">
                  Question {currentQuestion + 1} / {questions.length}
                </Badge>
                <Badge variant={questionAnswered[currentQuestion] ? "default" : "secondary"}>
                  {questionAnswered[currentQuestion] ? "Answered" : "Pending"}
                </Badge>
              </div>
              
              {/* Interview timer - 60 minutes max */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total</span>
                <span className={`font-mono text-sm font-bold min-w-14 ${
                  MAX_INTERVIEW_TIME - totalInterviewTime <= 300 ? 'text-red-500' : ''
                }`}>
                  {formatTime(MAX_INTERVIEW_TIME - totalInterviewTime)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isPlayingTTS && (
                  <Badge className="bg-blue-500">
                    <Volume2 className="h-3 w-3 mr-1 animate-pulse" />
                    Reading Question
                  </Badge>
                )}
                {isListening && (
                  <Badge className="bg-green-500">
                    <Mic className="h-3 w-3 mr-1 animate-pulse" />
                    Listening
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelInterview}
                  data-testid="button-stop-test"
                >
                  <StopCircle className="h-4 w-4 mr-1" />
                  Stop Test
                </Button>
              </div>
            </div>

            {/* Left Content - Questions and Answers */}
            <div className="lg:col-span-2 space-y-4">
              {/* Current Question */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {getQuestionIcon(currentQ?.category || 'subject')}
                    <div>
                      <CardTitle className="text-lg">
                        Question {currentQuestion + 1}
                      </CardTitle>
                      <CardDescription className="capitalize">
                        {currentQ?.category?.replace('_', ' ')} Question
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Question Text Display */}
                  <div className="p-6 bg-muted rounded-lg border">
                    <p className="text-lg leading-relaxed" data-testid="text-current-question">
                      {currentQ?.question || "Loading question..."}
                    </p>
                  </div>

                  {/* Answer Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <label className="text-sm font-medium">
                        Your Answer {!useTextFallback && hasSpeechRecognition() && "(Voice + Text)"}
                      </label>
                      <div className="flex items-center gap-2">
                        {hasSpeechRecognition() && (
                          <Button
                            size="sm"
                            variant={useTextFallback ? "outline" : "secondary"}
                            onClick={() => setUseTextFallback(!useTextFallback)}
                            data-testid="button-toggle-input-mode"
                          >
                            {useTextFallback ? (
                              <>
                                <Mic className="h-4 w-4 mr-1" />
                                Enable Voice
                              </>
                            ) : (
                              <>
                                <Type className="h-4 w-4 mr-1" />
                                Text Only
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => playQuestionAudio(currentQ?.question || '', currentQ?.id || '', true)}
                          disabled={isPlayingTTS}
                          data-testid="button-replay-question"
                        >
                          <Volume2 className="h-4 w-4 mr-1" />
                          Replay
                        </Button>
                      </div>
                    </div>
                    
                    {/* Browser compatibility warning */}
                    {!hasSpeechRecognition() && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                        <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Voice input not supported in this browser. Please type your answer below.
                        </p>
                      </div>
                    )}
                    
                    {/* Unified Answer Textarea - works with both voice and text */}
                    <div className="relative">
                      <Textarea
                        value={textAnswer || answers[currentQuestion] || ''}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        placeholder={useTextFallback 
                          ? "Type your answer here..." 
                          : "Click 'Start Speaking' to use voice, or type your answer here. You can edit the transcribed text if needed."
                        }
                        className="min-h-32 resize-none pr-12"
                        data-testid="input-text-answer"
                      />
                      {/* Voice mic button inside textarea area */}
                      {!useTextFallback && hasSpeechRecognition() && (
                        <Button
                          size="icon"
                          variant={isListening ? "destructive" : "outline"}
                          className="absolute right-2 top-2"
                          onClick={isListening ? stopListening : startListening}
                          disabled={isPlayingTTS}
                          data-testid="button-voice-mic"
                        >
                          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                    
                    {/* Voice recording indicator */}
                    {isListening && (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-medium">Listening... speak now. Click the mic to stop.</span>
                      </div>
                    )}
                    
                    <Button
                      onClick={() => {
                        if (isListening) stopListening();
                        saveTextAnswer();
                        toast({
                          title: "Answer Saved",
                          description: "Your answer has been recorded.",
                        });
                      }}
                      disabled={!textAnswer.trim() && !answers[currentQuestion]}
                      className="w-full"
                      data-testid="button-save-text-answer"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Save Answer
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    stopListening();
                    if (useTextFallback) saveTextAnswer();
                    setCurrentQuestion(Math.max(0, currentQuestion - 1));
                    setCurrentTranscript("");
                    setTextAnswer("");
                  }}
                  variant="outline"
                  disabled={currentQuestion === 0}
                  data-testid="button-previous-question"
                >
                  Previous
                </Button>

                <Button
                  onClick={handleNextQuestion}
                  variant="outline"
                  disabled={currentQuestion === questions.length - 1}
                  className="flex-1"
                  data-testid="button-next-question"
                >
                  Next Question
                </Button>

                {currentQuestion === questions.length - 1 && (
                  <Button
                    onClick={submitInterview}
                    disabled={isSubmitting}
                    className="bg-green-600"
                    data-testid="button-submit-interview"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Submit Interview
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Right Sidebar - Video Preview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Video Recording
                </CardTitle>
                <CardDescription>
                  Continuous recording in progress
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Video Preview */}
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Recording Indicator */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-medium">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    REC
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Camera Status</span>
                  <Badge variant="default" className="bg-green-500">
                    Active
                  </Badge>
                </div>

                {/* Concept Coverage Display */}
                {conceptCoverage && (
                  <div className="space-y-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Concept Coverage</span>
                      <Badge variant={conceptCoverage.coveragePercentage >= 60 ? "default" : "destructive"} className="text-xs">
                        {conceptCoverage.coveragePercentage}%
                      </Badge>
                    </div>
                    <Progress 
                      value={conceptCoverage.coveragePercentage} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      These questions cover {conceptCoverage.coveragePercentage}% of the key concepts for this role
                    </p>
                    {conceptCoverage.conceptsCovered && conceptCoverage.conceptsCovered.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {conceptCoverage.conceptsCovered.slice(0, 6).map((concept, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs py-0">
                            {concept}
                          </Badge>
                        ))}
                        {conceptCoverage.conceptsCovered.length > 6 && (
                          <Badge variant="outline" className="text-xs py-0">
                            +{conceptCoverage.conceptsCovered.length - 6} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Progress Indicator */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Interview Progress</span>
                    <span>{currentQuestion + 1}/{questions.length}</span>
                  </div>
                  <Progress 
                    value={((currentQuestion + 1) / questions.length) * 100}
                  />
                </div>

                {/* Question Overview */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Questions Status</p>
                  <div className="flex flex-wrap gap-1">
                    {questions.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border ${
                          idx === currentQuestion
                            ? 'bg-primary text-primary-foreground border-primary'
                            : questionAnswered[idx]
                            ? 'bg-green-500 text-white border-green-500'
                            : 'bg-muted border-border'
                        }`}
                      >
                        {idx + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          )}
        </div>
      </div>
      
      {/* Hidden audio element for TTS */}
      <audio ref={audioRef} onEnded={() => {
        setIsPlayingTTS(false);
      }} />
    </div>
  );
}
