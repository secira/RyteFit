import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, MessageCircle, Send, Sparkles, Plus, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MathText } from "@/components/LaTeX";
import type { ChatSession, ChatMessage } from "@shared/schema";

export default function AITutorPage() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user's chat sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<ChatSession[]>({
    queryKey: ['/api/chat/sessions'],
  });

  // Fetch messages for current session
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/sessions', currentSessionId, 'messages'],
    enabled: !!currentSessionId,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);

  // Auto-select first session or create one if none exist
  useEffect(() => {
    if (!sessionsLoading && sessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessions, sessionsLoading, currentSessionId]);

  // Create new chat session
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });
      return await response.json() as ChatSession;
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
      setCurrentSessionId(newSession.id);
      toast({
        title: "New chat created!",
        description: "Start asking your NEET/JEE questions."
      });
    },
    onError: () => {
      toast({
        title: "Failed to create chat",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete chat session
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await apiRequest(`/api/chat/sessions/${sessionId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
      setCurrentSessionId(null);
      toast({
        title: "Chat deleted",
      });
    },
  });

  // Send message with streaming response
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentSessionId || isStreaming) return;

    const message = messageInput.trim();
    setMessageInput("");
    setIsStreaming(true);
    setStreamingMessage("");

    try {
      const response = await fetch(`/api/chat/sessions/${currentSessionId}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Handle Server-Sent Events (SSE) streaming
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) {
                setStreamingMessage("");
                queryClient.invalidateQueries({ 
                  queryKey: ['/api/chat/sessions', currentSessionId, 'messages'] 
                });
                queryClient.invalidateQueries({ 
                  queryKey: ['/api/chat/sessions'] 
                });
              } else if (data.content) {
                setStreamingMessage(prev => prev + data.content);
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        }
      }
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsStreaming(false);
      setStreamingMessage("");
    }
  };

  // Quick question handler
  const handleQuickQuestion = async (question: string) => {
    if (!currentSessionId) {
      // Create a session first
      const newSession = await createSessionMutation.mutateAsync();
      setCurrentSessionId(newSession.id);
      
      // Wait a moment for the state to update
      setTimeout(() => {
        setMessageInput(question);
      }, 100);
    } else {
      setMessageInput(question);
    }
  };

  // No sessions yet - show welcome screen
  if (!sessionsLoading && sessions.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-12">
          <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
            <Bot className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-ai-tutor-title">
            AI Tutor - Your NEET & JEE Study Companion
          </h1>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Get instant help with your preparation doubts. Ask questions, get step-by-step explanations, 
            and discover related practice problems - all powered by advanced AI.
          </p>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mb-8">
            <Sparkles className="h-3 w-3 mr-1" />
            Free AI Doubt Clearing for All Students
          </Badge>

          <Button 
            onClick={() => createSessionMutation.mutate()}
            disabled={createSessionMutation.isPending}
            size="lg"
            data-testid="button-create-first-chat"
          >
            {createSessionMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                Start Your First Chat
              </>
            )}
          </Button>

          {/* Quick Help Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
            {[
              { subject: "Physics", color: "blue", example: "Explain Newton's laws of motion" },
              { subject: "Chemistry", color: "green", example: "How does electronegativity affect bonding?" },
              { subject: "Biology", color: "red", example: "Explain the process of photosynthesis" },
              { subject: "Mathematics", color: "purple", example: "Solve quadratic equations step-by-step" },
            ].map((item) => (
              <Card key={item.subject} className="text-left hover-elevate">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{item.subject}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.example}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar - Chat Sessions */}
      <div className="w-64 border-r flex flex-col">
        <div className="p-4 border-b">
          <Button 
            onClick={() => createSessionMutation.mutate()}
            disabled={createSessionMutation.isPending}
            className="w-full"
            variant="default"
            data-testid="button-new-chat"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`flex items-center justify-between p-3 rounded-md cursor-pointer hover-elevate ${
                  currentSessionId === session.id ? 'bg-accent' : ''
                }`}
                onClick={() => setCurrentSessionId(session.id)}
                data-testid={`chat-session-${session.id}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{session.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.messageCount || 0} messages
                  </p>
                </div>
                {currentSessionId === session.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSessionMutation.mutate(session.id);
                    }}
                    data-testid={`button-delete-session-${session.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-muted-foreground">AI Tutor Online</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentSessionId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">
                    {sessions.find(s => s.id === currentSessionId)?.title || "AI Tutor"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Ask anything about NEET & JEE
                  </p>
                </div>
              </div>
              <Badge variant="outline">
                <Sparkles className="h-3 w-3 mr-1" />
                Free
              </Badge>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="max-w-3xl mx-auto space-y-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Start your conversation by asking a question below
                    </p>
                    <div className="mt-6 space-y-2">
                      <p className="text-sm font-medium">Try asking:</p>
                      {[
                        "Explain Newton's laws of motion with examples",
                        "How do I solve quadratic equations?",
                        "What is the structure of DNA?",
                      ].map((question, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuickQuestion(question)}
                          className="block mx-auto"
                          data-testid={`quick-question-${index}`}
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="flex-shrink-0 p-2 bg-primary/10 rounded-full h-fit">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-card border'
                          }`}
                        >
                          <MathText className="text-sm leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </MathText>
                        </div>
                      </div>
                    ))}

                    {/* Streaming Message */}
                    {isStreaming && streamingMessage && (
                      <div className="flex gap-3 justify-start">
                        <div className="flex-shrink-0 p-2 bg-primary/10 rounded-full h-fit">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="max-w-[80%] rounded-lg p-4 bg-card border">
                          <MathText className="text-sm leading-relaxed whitespace-pre-wrap">
                            {streamingMessage}
                          </MathText>
                          <Loader2 className="h-4 w-4 animate-spin mt-2 text-muted-foreground" />
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto">
                <div className="flex gap-2">
                  <Textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Ask a question about Physics, Chemistry, Biology, or Mathematics..."
                    className="resize-none"
                    rows={2}
                    disabled={isStreaming}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    data-testid="input-message"
                  />
                  <Button
                    type="submit"
                    disabled={!messageInput.trim() || isStreaming}
                    size="icon"
                    className="h-full"
                    data-testid="button-send-message"
                  >
                    {isStreaming ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Select a chat or create a new one to get started
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
