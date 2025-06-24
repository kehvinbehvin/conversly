import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ElevenLabsConversationProps {
  agentId: string;
  onConversationStart?: (conversationId: string) => void;
  onConversationEnd?: (conversationId: string) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

export default function ElevenLabsConversation({
  agentId,
  onConversationStart,
  onConversationEnd,
  onError,
  disabled = false,
}: ElevenLabsConversationProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  
  // Use refs to store stable references
  const websocketRef = useRef<WebSocket | null>(null);
  const onConversationStartRef = useRef(onConversationStart);
  const onConversationEndRef = useRef(onConversationEnd);
  const onErrorRef = useRef(onError);
  
  // Update callback refs without causing re-renders
  useEffect(() => {
    onConversationStartRef.current = onConversationStart;
    onConversationEndRef.current = onConversationEnd;
    onErrorRef.current = onError;
  }, [onConversationStart, onConversationEnd, onError]);

  // Cleanup function
  const cleanup = () => {
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setCurrentConversationId(null);
  };

  // Start WebSocket connection
  const startConnection = async (signedUrl: string) => {
    try {
      const ws = new WebSocket(signedUrl);
      websocketRef.current = ws;

      ws.onopen = () => {
        console.log("✅ WebSocket connected");
        setIsConnected(true);
        setIsConnecting(false);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📝 WebSocket message:", data);
          
          if (data.type === "conversation_initiation_metadata") {
            const conversationId = data.conversation_initiation_metadata?.conversation_id;
            if (conversationId) {
              console.log("✅ Connected to ElevenLabs conversation:", { conversationId });
              setCurrentConversationId(conversationId);
              onConversationStartRef.current?.(conversationId);
            }
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onclose = (event) => {
        console.log("❌ WebSocket disconnected:", { code: event.code, reason: event.reason });
        setIsConnected(false);
        setIsConnecting(false);
        
        if (currentConversationId) {
          onConversationEndRef.current?.(currentConversationId);
        }
        cleanup();
      };

      ws.onerror = (error) => {
        console.error("🔥 WebSocket error:", error);
        setIsConnecting(false);
        onErrorRef.current?.(new Error("WebSocket connection failed"));
        cleanup();
      };

    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      setIsConnecting(false);
      onErrorRef.current?.(error as Error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);

  const requestMicrophonePermission = async (): Promise<MediaStream> => {
    console.log("🎤 Requesting microphone permission...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      console.log("✅ Microphone permission granted and stream active");
      return stream;
    } catch (error) {
      console.error("❌ Microphone permission denied:", error);
      throw new Error("Microphone access is required for conversation");
    }
  };

  const initializeAudioContext = async (): Promise<AudioContext> => {
    console.log("🔊 Initializing audio context...");
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (context.state === "suspended") {
      await context.resume();
    }
    
    console.log("Audio context state:", context.state);
    return context;
  };

  const startConversation = async () => {
    if (isConnecting || disabled) return;

    try {
      setIsConnecting(true);

      // Request microphone permission and initialize audio context
      const stream = await requestMicrophonePermission();
      setAudioStream(stream);

      const context = await initializeAudioContext();
      setAudioContext(context);

      // Get signed URL from server
      console.log("🌐 Generating signed URL...");
      const response = await apiRequest("/api/elevenlabs/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });

      const data = await response.json();

      if (!data.signedUrl) {
        throw new Error("Failed to get signed URL");
      }

      console.log("📝 Received signed URL:", data.signedUrl);
      console.log("📊 Signed URL analysis:");
      console.log("- Length:", data.signedUrl.length);
      console.log("- Contains agent ID:", data.signedUrl.includes(agentId));
      console.log("- URL domain:", new URL(data.signedUrl).hostname);

      console.log("🚀 Starting WebSocket connection...");
      await startConnection(data.signedUrl);
    } catch (error) {
      console.error("❌ Failed to start conversation:", error);
      setIsConnecting(false);
      onErrorRef.current?.(error as Error);
    }
  };

  const endConversation = () => {
    console.log("🛑 Manually ending conversation...");
    cleanup();
  };

  const isLoading = isConnecting;

  return (
    <div className="flex flex-col items-center space-y-6">
      {!isConnected ? (
        <Button
          onClick={startConversation}
          disabled={isLoading || disabled}
          size="lg"
          className="h-16 w-16 rounded-full bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          ) : (
            <Mic className="h-8 w-8 text-white" />
          )}
        </Button>
      ) : (
        <Button
          onClick={endConversation}
          size="lg"
          variant="destructive"
          className="h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <MicOff className="h-8 w-8" />
        </Button>
      )}

      <div className="text-center space-y-2">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Connecting...</p>
        )}
        {isConnected && (
          <p className="text-sm text-green-600 font-medium">
            Connected - Conversation active
          </p>
        )}
        {!isConnected && !isLoading && (
          <p className="text-sm text-muted-foreground">
            Tap to start conversation
          </p>
        )}
      </div>
    </div>
  );
}