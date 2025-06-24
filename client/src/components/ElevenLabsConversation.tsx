import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";

interface ElevenLabsConversationProps {
  agentId: string;
  onConversationStart?: (conversationId: string) => void;
  onConversationEnd?: (conversationId: string) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    ElevenLabs?: {
      Conversation: new (config: {
        agentId: string;
        onConnect?: () => void;
        onDisconnect?: () => void;
        onError?: (error: Error) => void;
        onMessage?: (message: any) => void;
      }) => {
        startSession: () => Promise<string>;
        endSession: () => void;
        getConversationId: () => string | null;
      };
    };
  }
}

export default function ElevenLabsConversation({
  agentId,
  onConversationStart,
  onConversationEnd,
  onError,
  disabled = false
}: ElevenLabsConversationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [conversation, setConversation] = useState<any>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  useEffect(() => {
    loadElevenLabsSDK();
  }, []);

  const loadElevenLabsSDK = async () => {
    if (window.ElevenLabs) return;

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://elevenlabs.io/convai-widget/index.js';
      script.onload = () => {
        console.log('ElevenLabs SDK loaded');
        resolve();
      };
      script.onerror = () => {
        const error = new Error('Failed to load ElevenLabs SDK');
        console.error(error);
        onError?.(error);
        reject(error);
      };
      document.head.appendChild(script);
    });
  };

  const startConversation = async () => {
    if (!window.ElevenLabs || disabled) return;

    setIsLoading(true);
    
    try {
      const conversationInstance = new window.ElevenLabs.Conversation({
        agentId,
        onConnect: () => {
          console.log('Connected to ElevenLabs');
          setIsConnected(true);
          setIsLoading(false);
        },
        onDisconnect: () => {
          console.log('Disconnected from ElevenLabs');
          setIsConnected(false);
          const conversationId = conversationInstance.getConversationId();
          if (conversationId) {
            setCurrentConversationId(null);
            onConversationEnd?.(conversationId);
          }
        },
        onError: (error: Error) => {
          console.error('ElevenLabs error:', error);
          setIsLoading(false);
          setIsConnected(false);
          onError?.(error);
        },
        onMessage: (message: any) => {
          console.log('ElevenLabs message:', message);
        }
      });

      setConversation(conversationInstance);
      
      const conversationId = await conversationInstance.startSession();
      setCurrentConversationId(conversationId);
      console.log('Started conversation with ID:', conversationId);
      onConversationStart?.(conversationId);
      
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setIsLoading(false);
      setIsConnected(false);
      onError?.(error as Error);
    }
  };

  const endConversation = () => {
    if (conversation && isConnected) {
      conversation.endSession();
      setConversation(null);
      setIsConnected(false);
      
      if (currentConversationId) {
        onConversationEnd?.(currentConversationId);
        setCurrentConversationId(null);
      }
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {!isConnected ? (
        <Button
          onClick={startConversation}
          disabled={disabled || isLoading}
          className="bg-coral-500 hover:bg-coral-600 text-white px-8 py-4 text-lg rounded-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Mic className="w-5 h-5 mr-2" />
              Start Voice Conversation
            </>
          )}
        </Button>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 bg-coral-100 rounded-full flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full border-4 border-coral-500 animate-pulse"></div>
            <Mic className="w-10 h-10 text-coral-500" />
          </div>
          
          <Button
            onClick={endConversation}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <MicOff className="w-4 h-4 mr-2" />
            End Conversation
          </Button>
          
          <p className="text-sm text-warm-brown-600 text-center">
            Voice conversation active. Speak naturally with the AI coach.
          </p>
        </div>
      )}
    </div>
  );
}