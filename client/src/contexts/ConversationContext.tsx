import { createContext, useContext, useRef, useEffect, useState, ReactNode } from "react";
import { useConversation as useElevenLabsConversation } from "@elevenlabs/react";
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
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  
  // Use refs to store stable references that persist across re-renders
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

  // Use ElevenLabs SDK with stable callbacks
  const conversation = useElevenLabsConversation({
    onConnect: (props: { conversationId: string }) => {
      console.log("✅ Connected to ElevenLabs conversation:", props);
      setIsConnecting(false);
      setCurrentConversationId(props.conversationId);
      callbacksRef.current.onConversationStart?.(props.conversationId);
    },
    onDisconnect: (details: any) => {
      console.log("❌ Disconnected from ElevenLabs conversation:", details);
      setIsConnecting(false);
      setSignedUrl(null);
      
      // Clean up audio resources when disconnected
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      const conversationId = details?.conversationId || currentConversationId;
      if (conversationId) {
        callbacksRef.current.onConversationEnd?.(conversationId);
      }
      setCurrentConversationId(null);
    },
    onError: (error: string) => {
      console.error("🔥 ElevenLabs conversation error:", error);
      setIsConnecting(false);
      setSignedUrl(null);
      
      // Clean up audio resources on error
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      callbacksRef.current.onError?.(new Error(error));
    },
    onMessage: (props: { message: string; source: string }) => {
      console.log("📝 ElevenLabs message:", props);
    },
  });

  const startConversation = async (agentId: string) => {
    if (isConnecting || conversation.status === "connected") return;

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
      const response = await fetch("/api/elevenlabs/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });

      const data = await response.json();
      if (!data.signedUrl) {
        throw new Error("Failed to get signed URL");
      }

      console.log("📝 Received signed URL:", data.signedUrl);
      setSignedUrl(data.signedUrl);
      
      console.log("🚀 Starting conversation session...");
      await conversation.startSession({
        signedUrl: data.signedUrl,
      });

    } catch (error) {
      console.error("❌ Failed to start conversation:", error);
      setIsConnecting(false);
      callbacksRef.current.onError?.(error as Error);
    }
  };

  const endConversation = async () => {
    try {
      console.log("🛑 Ending conversation...");
      if (conversation.status === "connected") {
        await conversation.endSession();
      }
      
      // Clean up audio resources
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      setSignedUrl(null);
      setIsConnecting(false);
      setCurrentConversationId(null);
    } catch (error) {
      console.error("❌ Failed to end conversation:", error);
    }
  };

  const value: ConversationContextType = {
    isConnecting,
    isConnected: conversation.status === "connected",
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