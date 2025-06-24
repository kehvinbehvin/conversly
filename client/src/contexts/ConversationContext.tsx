import { createContext, useContext, useRef, useEffect, useState, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";

interface ConversationContextType {
  isConnecting: boolean;
  isConnected: boolean;
  currentConversationId: string | null;
  startConversation: (agentId: string) => Promise<void>;
  endConversation: () => void;
  onConversationStart?: (conversationId: string) => void;
  onConversationEnd?: (conversationId: string) => void;
  onError?: (error: Error) => void;
}

const ConversationContext = createContext<ConversationContextType | null>(null);

export function useConversation() {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error("useConversation must be used within a ConversationProvider");
  }
  return context;
}

interface ConversationProviderProps {
  children: ReactNode;
  onConversationStart?: (conversationId: string) => void;
  onConversationEnd?: (conversationId: string) => void;
  onError?: (error: Error) => void;
}

export function ConversationProvider({
  children,
  onConversationStart,
  onConversationEnd,
  onError,
}: ConversationProviderProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  
  // Use refs to store stable references that persist across re-renders
  const websocketRef = useRef<WebSocket | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const callbacksRef = useRef({
    onConversationStart,
    onConversationEnd,
    onError,
  });

  // Update callbacks without causing re-renders
  useEffect(() => {
    callbacksRef.current = {
      onConversationStart,
      onConversationEnd,
      onError,
    };
  }, [onConversationStart, onConversationEnd, onError]);

  // Cleanup function that doesn't depend on state
  const cleanup = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setCurrentConversationId(null);
  };

  // WebSocket connection setup with stable references
  const setupWebSocket = (signedUrl: string) => {
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
            callbacksRef.current.onConversationStart?.(conversationId);
          }
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onclose = (event) => {
      console.log("❌ WebSocket disconnected:", { code: event.code, reason: event.reason });
      const conversationId = currentConversationId;
      cleanup();
      
      if (conversationId) {
        callbacksRef.current.onConversationEnd?.(conversationId);
      }
    };

    ws.onerror = (error) => {
      console.error("🔥 WebSocket error:", error);
      cleanup();
      callbacksRef.current.onError?.(new Error("WebSocket connection failed"));
    };
  };

  const startConversation = async (agentId: string) => {
    if (isConnecting || isConnected) return;

    try {
      setIsConnecting(true);

      // Request microphone permission
      console.log("🎤 Requesting microphone permission...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      audioStreamRef.current = stream;
      console.log("✅ Microphone permission granted");

      // Initialize audio context
      console.log("🔊 Initializing audio context...");
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (context.state === "suspended") {
        await context.resume();
      }
      audioContextRef.current = context;
      console.log("Audio context state:", context.state);

      // Get signed URL
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
      console.log("🚀 Starting WebSocket connection...");
      
      setupWebSocket(data.signedUrl);

    } catch (error) {
      console.error("❌ Failed to start conversation:", error);
      cleanup();
      callbacksRef.current.onError?.(error as Error);
    }
  };

  const endConversation = () => {
    console.log("🛑 Ending conversation...");
    cleanup();
  };

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);

  const value: ConversationContextType = {
    isConnecting,
    isConnected,
    currentConversationId,
    startConversation,
    endConversation,
    onConversationStart,
    onConversationEnd,
    onError,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}