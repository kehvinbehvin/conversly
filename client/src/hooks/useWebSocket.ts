import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: string;
  conversationId?: string;
  dbConversationId?: number;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const { onMessage, onConnect, onDisconnect } = options;

  useEffect(() => {
    // Determine WebSocket URL based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('📡 Connecting to WebSocket:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      onConnect?.();
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('📨 WebSocket message received:', message);
        onMessage?.(message);
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('📡 WebSocket disconnected');
      setIsConnected(false);
      onDisconnect?.();
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [onMessage, onConnect, onDisconnect]);

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      console.log('📤 WebSocket message sent:', message);
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message:', message);
    }
  };

  const registerForConversation = (conversationId: string) => {
    sendMessage({
      type: 'register',
      conversationId
    });
  };

  return {
    isConnected,
    sendMessage,
    registerForConversation
  };
}