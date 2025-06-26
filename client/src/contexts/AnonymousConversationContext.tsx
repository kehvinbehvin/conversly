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
  error: string | null;
  startConversation: (agentId: string) => Promise<void>;
  endConversation: () => void;
  clearError: () => void;
  resetForNewConversation: () => void;
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
  const [error, setError] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const createdConversationsRef = useRef<Set<string>>(new Set());

  const clearError = () => setError(null);

  const resetForNewConversation = () => {
    console.log("🔄 Resetting state for new conversation");
    setCurrentConversationId(null);
    setConversationData(null);
    setIsReviewReady(false);
    setError(null);
    conversationIdRef.current = null;
  };

  // SSE connection for real-time notifications
  const { isConnected: sseConnected, registerForConversation } = useSSE({
    onMessage: (message: any) => {
      console.log('📡 SSE message received in context:', message);
      console.log('📡 Current conversation ID ref:', conversationIdRef.current);
      
      if (message.type === 'review_ready') {
        console.log('📡 Review ready message detected');
        
        if (message.conversationId === conversationIdRef.current) {
          console.log('📡 Conversation ID matches - setting review ready');
          console.log('📡 Setting isReviewReady to true');
          setIsReviewReady(true);
          
          // Refetch conversation data to get the latest review
          if (message.dbConversationId) {
            console.log('📡 Fetching conversation data for ID:', message.dbConversationId);
            fetchConversationData(message.dbConversationId);
          }
        } else {
          console.log('📡 Conversation ID mismatch:', {
            messageId: message.conversationId,
            currentId: conversationIdRef.current
          });
        }
      }
    }
  });

  // Store conversation data in memory only
  const storeConversationData = (data: ConversationWithReview) => {
    setConversationData(data);
  };

  const fetchConversationData = async (dbConversationId: number) => {
    try {
      console.log('📡 Fetching conversation data from API for ID:', dbConversationId);
      const response = await fetch(`/api/conversations/${dbConversationId}`);
      console.log('📡 API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📡 Received conversation data:', data);
        console.log('📡 Has review data:', !!data.review);
        storeConversationData(data);
        console.log('📡 Stored conversation data in state');
      } else {
        console.error('❌ API response not ok:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Failed to fetch conversation data:', error);
    }
  };

  // No initialization needed for memory-only state

  const conversation = useConversation({
    onConnect: async (props: { conversationId: string }) => {
      setIsConnecting(false);
      setCurrentConversationId(props.conversationId);
      conversationIdRef.current = props.conversationId;
      
      // Register for SSE notifications now that we have conversation ID
      registerForConversation(props.conversationId);
      console.log('📡 Registered SSE for conversation:', props.conversationId);
      
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
    setError(null); // Clear any previous errors
    
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
      setError(error instanceof Error ? error.message : String(error));
      onError?.(error as Error);
    }
  };

  const endConversation = () => {
    if (conversation.status === "connected") {
      console.log("🛑 Ending anonymous conversation...");
      conversation.endSession();
    }
    setIsConnecting(false);
    setIsReviewReady(false);
    // Keep conversation ID and current conversation state to receive webhook notification
    console.log("📡 Keeping conversation ID for webhook notification:", conversationIdRef.current);
    console.log("📡 Current conversation data:", conversationData?.id);
  };

  const value: AnonymousConversationContextType = {
    isConnecting,
    isConnected: conversation.status === "connected",
    currentConversationId,
    conversationData,
    isReviewReady,
    error,
    startConversation,
    endConversation,
    clearError,
    resetForNewConversation,
  };

  return (
    <AnonymousConversationContext.Provider value={value}>
      {children}
    </AnonymousConversationContext.Provider>
  );
}