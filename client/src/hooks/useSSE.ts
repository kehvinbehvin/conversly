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
      console.log('✅ SSE connected');
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
      console.error('❌ SSE error:', error);
      setIsConnected(false);
      optionsRef.current.onDisconnect?.();
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