import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Clock, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import ElevenLabsConversation from "@/components/ElevenLabsConversation";

export default function Conversation() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isRecording, setIsRecording] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dbConversationId, setDbConversationId] = useState<number | null>(null);

  // Create conversation in database
  const createConversationMutation = useMutation({
    mutationFn: async (elevenlabsId: string) => {
      const response = await apiRequest("POST", "/api/conversations", {
        elevenlabsConversationId: elevenlabsId,
        metadata: { topic: "How was your weekend?" }
      });
      return response.json();
    },
    onSuccess: (conversation) => {
      setDbConversationId(conversation.id);
      console.log("Database conversation created:", conversation.id);
    },
    onError: (error) => {
      console.error("Failed to create conversation record:", error);
      setError("Failed to create conversation record. Please try again.");
    }
  });

  const startTimer = () => {
    const interval = setInterval(() => {
      setTimeElapsed(prev => {
        if (prev >= 300) { // 5 minutes
          clearInterval(interval);
          // Don't auto-end conversation, let user control it
          return 300;
        }
        return prev + 1;
      });
    }, 1000);
    
    // Store interval ID to clear it later
    return interval;
  };

  const handleConversationStart = (elevenlabsId: string) => {
    console.log('Starting conversation with ID:', elevenlabsId);
    setConversationId(elevenlabsId);
    setIsRecording(true);
    setError(null);
    startTimer();
    
    // Create database record
    createConversationMutation.mutate(elevenlabsId);
  };

  const handleConversationEnd = (elevenlabsId: string) => {
    console.log('Conversation ended with ID:', elevenlabsId);
    setIsRecording(false);
    setConversationId(null);
    
    // Wait for analysis to complete, then navigate to review
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (dbConversationId) {
        setLocation(`/review/${dbConversationId}`);
      } else {
        setLocation("/dashboard");
      }
    }, 3000); // Give a bit more time for analysis to complete
  };

  const handleError = (error: Error) => {
    setError(error.message);
    setIsRecording(false);
    setConversationId(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timeRemaining = Math.max(0, 300 - timeElapsed);
  const progress = (timeElapsed / 300) * 100;

  return (
    <div className="min-h-screen bg-warm-brown-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Conversation Interface */}
        <Card className="shadow-2xl border-0">
          <CardHeader className="bg-warm-brown-700 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Weekend Conversation Practice</CardTitle>
              <div className="flex items-center space-x-2">
                {isRecording ? (
                  <>
                    <div className="w-3 h-3 bg-sage-400 rounded-full animate-pulse"></div>
                    <span className="text-sm">Recording</span>
                  </>
                ) : (
                  <Badge variant="secondary" className="bg-warm-brown-600 text-white">
                    Ready to Start
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {!isRecording ? (
              // Pre-conversation state
              <div className="text-center space-y-6">
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-coral-100 rounded-full mx-auto flex items-center justify-center">
                    <Mic className="w-10 h-10 text-coral-500" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-warm-brown-800">
                    Ready to Practice?
                  </h2>
                  
                  <p className="text-warm-brown-600 max-w-md mx-auto">
                    You'll have a 5-minute conversation about "How was your weekend?" 
                    Speak naturally and share details about what you did.
                  </p>
                </div>

                <div className="space-y-4">
                  <ElevenLabsConversation
                    agentId="agent_01jyfb9fh8f67agfzvv09tvg3t"
                    onConversationStart={handleConversationStart}
                    onConversationEnd={handleConversationEnd}
                    onError={handleError}
                  />

                  <div className="text-sm text-warm-brown-500 space-y-2">
                    <div className="flex items-center justify-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>5 minutes</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Mic className="w-4 h-4" />
                        <span>Voice only</span>
                      </div>
                    </div>
                    <p>AI feedback will be ready after your session</p>
                  </div>
                </div>
              </div>
            ) : (
              // During conversation state
              <div className="text-center space-y-6">
                <div className="space-y-4">
                  <div className="w-32 h-32 bg-coral-100 rounded-full mx-auto flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border-4 border-coral-500 animate-pulse"></div>
                    <Mic className="w-16 h-16 text-coral-500" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-warm-brown-800">
                    Conversation in Progress
                  </h2>
                  
                  <p className="text-warm-brown-600">
                    The AI coach will ask about your weekend. Share details and speak naturally!
                  </p>
                </div>

                {/* Timer and Progress */}
                <div className="space-y-4">
                  <div className="text-3xl font-mono font-bold text-warm-brown-800">
                    {formatTime(timeRemaining)}
                  </div>
                  
                  <div className="w-full bg-warm-brown-200 rounded-full h-2">
                    <div 
                      className="bg-coral-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-sm text-warm-brown-500">
                    Time remaining • Conversation will end automatically
                  </p>
                </div>

                {/* Real ElevenLabs Widget */}
                <div className="mt-8 p-6 bg-white border border-warm-brown-200 rounded-xl">
                  <ElevenLabsConversation
                    agentId="agent_01jyfb9fh8f67agfzvv09tvg3t"
                    onConversationStart={handleConversationStart}
                    onConversationEnd={handleConversationEnd}
                    onError={handleError}
                    disabled={true}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversation Tips */}
        {!isRecording && (
          <Card className="mt-6 bg-sage-50 border-sage-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-warm-brown-800 mb-4">Conversation Tips</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-warm-brown-600">
                <div className="space-y-2">
                  <h4 className="font-medium text-warm-brown-700">Share Details</h4>
                  <ul className="space-y-1">
                    <li>• Mention specific activities</li>
                    <li>• Describe locations and people</li>
                    <li>• Share your feelings and reactions</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-warm-brown-700">Stay Engaged</h4>
                  <ul className="space-y-1">
                    <li>• Listen to follow-up questions</li>
                    <li>• Build on what the AI says</li>
                    <li>• Ask questions back when appropriate</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
