import { createContext, useContext, useRef, useEffect, useState, ReactNode } from "react";
import { useConversation as useElevenLabsConversation } from "@elevenlabs/react";

interface ConversationContextType {
  isConnecting: boolean;
  isConnected: boolean;
  currentConversationId: string | null;
  showEndModal: boolean;
  startConversation: (agentId: string) => Promise<void>;
  endConversation: () => void;
  closeEndModal: () => void;
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
  const [showEndModal, setShowEndModal] = useState(false);
  
  // Use refs to store stable references that persist across re-renders
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

  // Track conversation creation to prevent duplicates
  const createdConversationsRef = useRef<Set<string>>(new Set());

  // Use ElevenLabs SDK with stable callbacks
  const conversation = useElevenLabsConversation({
    onConnect: async (props: { conversationId: string }) => {
      console.log("✅ Connected to ElevenLabs conversation:", props);
      setIsConnecting(false);
      setCurrentConversationId(props.conversationId);
      
      // Prevent duplicate conversation creation
      if (createdConversationsRef.current.has(props.conversationId)) {
        console.log("🚫 Conversation already created for ID:", props.conversationId);
        callbacksRef.current.onConversationStart?.(props.conversationId);
        return;
      }
      
      // Mark as being created to prevent duplicates
      createdConversationsRef.current.add(props.conversationId);
      
      // Create database conversation record with the correct ElevenLabs ID
      try {
        console.log("🔄 Creating database conversation for ID:", props.conversationId);
        
        // Get the demo user ID first
        const userResponse = await fetch("/api/user");
        const user = await userResponse.json();
        
        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            elevenlabsConversationId: props.conversationId,
            metadata: { topic: "How was your weekend?" },
          }),
        });
        
        if (response.ok) {
          const conversation = await response.json();
          console.log("Database conversation created:", conversation.id, "for ElevenLabs ID:", props.conversationId);
        } else {
          const errorText = await response.text();
          console.log("Database conversation creation response:", response.status, errorText);
          // Remove from tracking if creation failed
          createdConversationsRef.current.delete(props.conversationId);
        }
      } catch (error) {
        console.error("Error creating database conversation:", error);
        // Remove from tracking if creation failed
        createdConversationsRef.current.delete(props.conversationId);
      }
      
      callbacksRef.current.onConversationStart?.(props.conversationId);
    },
    onDisconnect: (details: any) => {
      console.log("❌ Disconnected from ElevenLabs conversation:", details);
      console.log("🔍 Current conversation ID:", currentConversationId);
      console.log("🔍 Details conversation ID:", details?.conversationId);
      setIsConnecting(false);
      
      const conversationId = details?.conversationId || currentConversationId;
      console.log("🔍 Final conversation ID to use:", conversationId);
      
      // Show modal BEFORE clearing state
      if (conversationId) {
        console.log("🔔 Setting showEndModal to true for conversation:", conversationId);
        setShowEndModal(true);
        callbacksRef.current.onConversationEnd?.(conversationId);
      } else {
        console.log("⚠️ No conversation ID found, modal will not show");
      }
      
      // Clear tracking when conversation ends
      if (currentConversationId) {
        createdConversationsRef.current.delete(currentConversationId);
      }
      
      // Clear currentConversationId AFTER using it for modal
      setCurrentConversationId(null);
    },
    onError: (error: string) => {
      console.error("🔥 ElevenLabs conversation error:", error);
      setIsConnecting(false);
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

      // Request microphone permission FIRST before any connection attempts
      console.log("🎤 Requesting microphone permission...");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 16000,
          },
        });
        console.log("✅ Microphone permission granted");
        // Stop the test stream immediately since ElevenLabs will handle audio
        stream.getTracks().forEach(track => track.stop());
      } catch (micError) {
        console.error("❌ Microphone permission denied:", micError);
        setIsConnecting(false);
        callbacksRef.current.onError?.(new Error("Microphone permission required"));
        return;
      }

      // Initialize audio context
      console.log("🔊 Initializing audio context...");
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (context.state === "suspended") {
        await context.resume();
      }
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
      
      setIsConnecting(false);
      setCurrentConversationId(null);
    } catch (error) {
      console.error("❌ Failed to end conversation:", error);
    }
  };

  const closeEndModal = () => {
    setShowEndModal(false);
  };

  const value: ConversationContextType = {
    isConnecting,
    isConnected: conversation.status === "connected",
    currentConversationId,
    showEndModal,
    startConversation,
    endConversation,
    closeEndModal,
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