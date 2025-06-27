import { useEffect, useRef, useState } from 'react';

interface SSEMessage {
  type: string;
  conversationId?: string;
  dbConversationId?: number;
}

interface UseSSEOptions {
  onMessage?: (message: SSEMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useSSE(options: UseSSEOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const optionsRef = useRef(options);
  
  // Update options ref when they change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const connectSSE = (conversationId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sseUrl = `/api/events/${conversationId}`;
    console.log('📡 Connecting to SSE:', sseUrl);
    
    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('✅ SSE connected for:', conversationId);
      setIsConnected(true);
      optionsRef.current.onConnect?.();
    };

    eventSource.onmessage = (event) => {
      try {
        console.log('📨 SSE message received:', event.data);
        const message: SSEMessage = JSON.parse(event.data);
        console.log('📨 Parsed SSE message:', message);
        optionsRef.current.onMessage?.(message);
      } catch (error) {
        console.error('❌ Error parsing SSE message:', error);
        console.error('❌ Raw event data:', event.data);
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ SSE error for conversation:', conversationId, error);
      setIsConnected(false);
      optionsRef.current.onDisconnect?.();
      
      // Auto-reconnect after a delay during development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Attempting SSE reconnection in 2 seconds...');
        setTimeout(() => {
          if (eventSourceRef.current?.readyState !== EventSource.OPEN) {
            console.log('🔄 Reconnecting SSE for:', conversationId);
            connectSSE(conversationId);
          }
        }, 2000);
      }
    };
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const registerForConversation = (conversationId: string) => {
    connectSSE(conversationId);
  };

  return {
    isConnected,
    registerForConversation
  };
}

// Export useSSE as primary interface