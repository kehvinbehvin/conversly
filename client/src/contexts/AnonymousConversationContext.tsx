import React, { createContext, useContext, useState, useRef, useMemo, ReactNode } from "react";
import { useConversation } from "@elevenlabs/react";
import { useSSE } from "@/hooks/useSSE";
import { useQuery } from "@tanstack/react-query";
import type { ConversationWithReview } from "@shared/schema";

interface AnonymousConversationContextType {
  isConnecting: boolean;
  isConnected: boolean;
  currentConversationId: string | null;
  conversationData: ConversationWithReview | null;
  isReviewReady: boolean;
  startConversation: (agentId: string) => Promise<void>;
  endConversation: () => void;
  onError?: (error: Error) => void;
}

const AnonymousConversationContext = createContext<AnonymousConversationContextType | undefined>(undefined);

export function useAnonymousConversation() {
  const context = useContext(AnonymousConversationContext);
  if (!context) {
    throw new Error("useAnonymousConversation must be used within AnonymousConversationProvider");
  }
  return context;
}

interface AnonymousConversationProviderProps {
  children: ReactNode;
  onError?: (error: Error) => void;
}

export function AnonymousConversationProvider({
  children,
  onError,
}: AnonymousConversationProviderProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversationData, setConversationData] = useState<ConversationWithReview | null>(null);
  const [isReviewReady, setIsReviewReady] = useState(false);
  const conversationIdRef = useRef<string | null>(null);
  const createdConversationsRef = useRef<Set<string>>(new Set());

  // SSE connection for real-time notifications
  const { isConnected: sseConnected, registerForConversation } = useSSE({
    onMessage: (message: any) => {
      if (message.type === 'review_ready' && message.conversationId === conversationIdRef.current) {
        console.log('📡 Review ready notification received');
        setIsReviewReady(true);
        // Refetch conversation data to get the latest review
        if (message.dbConversationId) {
          fetchConversationData(message.dbConversationId);
        }
      }
    }
  });

  // Store conversation data in session storage for persistence
  const storeConversationData = (data: ConversationWithReview) => {
    sessionStorage.setItem('anonymous_conversation', JSON.stringify(data));
    setConversationData(data);
  };

  const loadConversationData = () => {
    const stored = sessionStorage.getItem('anonymous_conversation');
    if (stored) {
      const data = JSON.parse(stored) as ConversationWithReview;
      setConversationData(data);
      setCurrentConversationId(data.elevenlabsConversationId || null);
      conversationIdRef.current = data.elevenlabsConversationId || null;
      
      // Check if review is ready
      if (data.status === 'completed' && data.review) {
        setIsReviewReady(true);
      }
    }
  };

  const fetchConversationData = async (dbConversationId: number) => {
    try {
      const response = await fetch(`/api/conversations/${dbConversationId}`);
      if (response.ok) {
        const data = await response.json();
        storeConversationData(data);
      }
    } catch (error) {
      console.error('❌ Failed to fetch conversation data:', error);
    }
  };

  // Initialize from session storage on mount
  React.useEffect(() => {
    loadConversationData();
  }, []);

  const conversation = useConversation({
    onConnect: async (props: { conversationId: string }) => {
      setIsConnecting(false);
      setCurrentConversationId(props.conversationId);
      conversationIdRef.current = props.conversationId;
      
      // Register for WebSocket notifications now that we have conversation ID
      registerForConversation(props.conversationId);
      console.log('📡 Registered WebSocket for conversation:', props.conversationId);
      
      // Prevent duplicate conversation creation
      if (createdConversationsRef.current.has(props.conversationId)) {
        console.log("🚫 Conversation already created for ID:", props.conversationId);
        return;
      }
      
      createdConversationsRef.current.add(props.conversationId);
      
      try {
        console.log("🔄 Creating database conversation for anonymous user");
        
        // Get the anonymous user ID
        const userResponse = await fetch("/api/user/anonymous");
        const user = await userResponse.json();
        
        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            elevenlabsConversationId: props.conversationId,
            metadata: { topic: "How was your weekend?", anonymous: true },
          }),
        });
        
        if (response.ok) {
          const conversation = await response.json();
          console.log("✅ Anonymous conversation created:", conversation.id);
          storeConversationData(conversation);
        } else {
          console.error("❌ Failed to create anonymous conversation");
        }
      } catch (error) {
        console.error("❌ Error creating anonymous conversation:", error);
        onError?.(error as Error);
      }
    },
    onDisconnect: () => {
      console.log("🔌 Anonymous conversation disconnected");
      setIsConnecting(false);
    },
    onError: (error) => {
      console.error("❌ Anonymous conversation error:", error);
      setIsConnecting(false);
      onError?.(new Error(String(error)));
    },
  });

  const startConversation = async (agentId: string) => {
    if (isConnecting || conversation.status === "connected") return;
    
    setIsConnecting(true);
    setIsReviewReady(false);
    
    try {
      console.log("🔑 Getting signed URL for anonymous conversation...");
      const response = await fetch("/api/elevenlabs/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get signed URL: ${response.status}`);
      }

      const { signedUrl } = await response.json();
      console.log("📝 Received signed URL for anonymous user");

      console.log("🚀 Starting anonymous conversation session...");
      await conversation.startSession({ signedUrl });
    } catch (error) {
      console.error("❌ Failed to start anonymous conversation:", error);
      setIsConnecting(false);
      onError?.(error as Error);
    }
  };

  const endConversation = () => {
    if (conversation.status === "connected") {
      console.log("🛑 Ending anonymous conversation...");
      conversation.endSession();
    }
    setIsConnecting(false);
  };

  const value: AnonymousConversationContextType = {
    isConnecting,
    isConnected: conversation.status === "connected",
    currentConversationId,
    conversationData,
    isReviewReady,
    startConversation,
    endConversation,
    onError,
  };

  return (
    <AnonymousConversationContext.Provider value={value}>
      {children}
    </AnonymousConversationContext.Provider>
  );
}