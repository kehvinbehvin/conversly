import { createContext, useContext, useRef, useEffect, useState, ReactNode, useCallback } from "react";
import { useConversation as useElevenLabsConversation } from "@elevenlabs/react";

interface ConversationContextType {
  isConnecting: boolean;
  isConnected: boolean;
  currentConversationId: string | null;
  modalConversationId: string | null;
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
  const [modalConversationId, setModalConversationId] = useState<string | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  
  // Store conversation ID in ref to persist through state changes
  const conversationIdRef = useRef<string | null>(null);
  
  // Track conversation creation to prevent duplicates
  const createdConversationsRef = useRef<Set<string>>(new Set());
  
  // Store callback refs to avoid dependency changes
  const onConversationStartRef = useRef(onConversationStart);
  const onConversationEndRef = useRef(onConversationEnd);
  const onErrorRef = useRef(onError);
  
  // Update refs when props change
  useEffect(() => {
    onConversationStartRef.current = onConversationStart;
    onConversationEndRef.current = onConversationEnd;
    onErrorRef.current = onError;
  });

  // Create stable callback functions using useCallback to prevent hook order violations
  const handleConnect = useCallback(async (props: { conversationId: string }) => {
    setIsConnecting(false);
    setCurrentConversationId(props.conversationId);
    conversationIdRef.current = props.conversationId;
    
    // Prevent duplicate conversation creation
    if (createdConversationsRef.current.has(props.conversationId)) {
      console.log("🚫 Conversation already created for ID:", props.conversationId);
      onConversationStartRef.current?.(props.conversationId);
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
    
    onConversationStartRef.current?.(props.conversationId);
  }, []);

  const handleDisconnect = useCallback((details: { conversationId?: string; reason?: string }) => {
    setIsConnecting(false);
    
    const conversationId = details?.conversationId || conversationIdRef.current;
    
    if (conversationId) {
      setModalConversationId(conversationId);
      setShowEndModal(true);
    }
    
    // Clear tracking when conversation ends
    if (conversationIdRef.current) {
      createdConversationsRef.current.delete(conversationIdRef.current);
    }
    
    // Clear conversation ID from both state and ref
    setCurrentConversationId(null);
    conversationIdRef.current = null;
  }, []);

  const handleError = useCallback((error: string) => {
    setIsConnecting(false);
    onErrorRef.current?.(new Error(error));
  }, []);

  // Use ElevenLabs SDK with stable callbacks
  const conversation = useElevenLabsConversation({
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onError: handleError,
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
        onError?.(new Error("Microphone permission required"));
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
        body: JSON.stringify({ agent_id: agentId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get signed URL: ${response.statusText}`);
      }

      const { signedUrl } = await response.json();
      console.log("📝 Received signed URL:", signedUrl);

      // Start conversation session with signed URL
      console.log("🚀 Starting conversation session...");
      await conversation.startSession({ signedUrl });
    } catch (error) {
      console.error("❌ Failed to start conversation:", error);
      setIsConnecting(false);
      onError?.(error as Error);
    }
  };

  const endConversation = () => {
    if (conversation.status === "connected") {
      console.log("🛑 Ending conversation...");
      conversation.endSession();
    }
    setIsConnecting(false);
  };

  const closeEndModal = () => {
    setShowEndModal(false);
    setModalConversationId(null);
  };

  const value: ConversationContextType = {
    isConnecting,
    isConnected: conversation.status === "connected",
    currentConversationId,
    modalConversationId,
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