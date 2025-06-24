import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useConversation } from "@elevenlabs/react";
import { apiRequest } from "@/lib/queryClient";

interface ElevenLabsConversationProps {
  agentId: string;
  onConversationStart?: (conversationId: string) => void;
  onConversationEnd?: (conversationId: string) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

export default function ElevenLabsConversation({
  agentId,
  onConversationStart,
  onConversationEnd,
  onError,
  disabled = false
}: ElevenLabsConversationProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: (conversationId: string) => {
      console.log('Connected to ElevenLabs conversation:', conversationId);
      setIsConnecting(false);
      onConversationStart?.(conversationId);
    },
    onDisconnect: (conversationId: string) => {
      console.log('Disconnected from ElevenLabs conversation:', conversationId);
      setIsConnecting(false);
      setSignedUrl(null); // Clear signed URL on disconnect
      onConversationEnd?.(conversationId);
    },
    onError: (error: string) => {
      console.error('ElevenLabs conversation error:', error);
      setIsConnecting(false);
      setSignedUrl(null); // Clear signed URL on error
      onError?.(new Error(error));
    },
    onMessage: (message: any) => {
      console.log('ElevenLabs message:', message);
    }
  });

  const startConversation = async () => {
    if (disabled || isConnecting) return;
    
    setIsConnecting(true);
    try {
      // Generate signed URL from backend with agent ID
      const response = await apiRequest("POST", "/api/elevenlabs/signed-url", {
        agentId: agentId
      });
      const data = await response.json();
      
      if (!data.signedUrl) {
        throw new Error("Failed to get signed URL");
      }
      
      console.log('Received signed URL:', data.signedUrl);
      setSignedUrl(data.signedUrl);
      
      // Start session with the signed URL (agentId is embedded in the signed URL)
      await conversation.startSession({
        signedUrl: data.signedUrl
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setIsConnecting(false);
      setSignedUrl(null);
      onError?.(error as Error);
    }
  };

  const endConversation = async () => {
    try {
      await conversation.endSession();
      setSignedUrl(null); // Clear signed URL
    } catch (error) {
      console.error('Failed to end conversation:', error);
    }
  };

  const isConnected = conversation.status === 'connected';
  const isLoading = isConnecting || conversation.status === 'connecting';

  return (
    <div className="flex flex-col items-center space-y-6">
      {!isConnected ? (
        <Button
          onClick={startConversation}
          disabled={disabled || isLoading}
          size="lg"
          className="bg-coral-500 hover:bg-coral-600 text-white min-w-[200px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              Start Voice Conversation
            </>
          )}
        </Button>
      ) : (
        <div className="flex flex-col items-center space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-coral-500 rounded-full flex items-center justify-center mb-3 animate-pulse">
              <Mic className="h-8 w-8 text-white" />
            </div>
            <p className="text-sage-700 font-medium text-lg">Voice conversation active</p>
            <p className="text-sage-600 text-sm">Practice discussing your weekend plans</p>
            
            {/* Show conversation status */}
            <div className="mt-3 space-y-1">
              <p className="text-xs text-sage-500">
                Status: {conversation.status}
              </p>
              {conversation.getId() && (
                <p className="text-xs text-sage-500">
                  ID: {conversation.getId()}
                </p>
              )}
              {conversation.isSpeaking && (
                <p className="text-xs text-coral-600 font-medium">
                  AI is speaking...
                </p>
              )}
            </div>
          </div>
          
          <Button
            onClick={endConversation}
            variant="outline"
            size="lg"
            className="border-coral-300 text-coral-600 hover:bg-coral-50"
          >
            <MicOff className="mr-2 h-4 w-4" />
            End Conversation
          </Button>
        </div>
      )}
    </div>
  );
}