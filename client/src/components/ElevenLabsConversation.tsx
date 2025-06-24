import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const startConversation = async () => {
    if (disabled) return;

    setIsLoading(true);
    console.log('Starting conversation simulation...');
    
    try {
      const conversationId = `conversation_${Date.now()}`;
      setCurrentConversationId(conversationId);
      
      setTimeout(() => {
        setIsLoading(false);
        setIsConnected(true);
        console.log('Connected to conversation:', conversationId);
        onConversationStart?.(conversationId);
        
        setTimeout(() => {
          simulateConversationEnd(conversationId);
        }, 15000); // Extended to 15 seconds for better demo experience
      }, 2000);
      
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setIsLoading(false);
      setIsConnected(false);
      onError?.(error as Error);
    }
  };

  const simulateConversationEnd = (conversationId: string) => {
    console.log('Ending conversation:', conversationId);
    
    fetch('/api/webhook/elevenlabs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        transcript: `AI Coach: Hi! I'm excited to practice with you today. How was your weekend? I'd love to hear about what you did.

User: It was really good! I went hiking with some friends on Saturday. We found this amazing trail that I'd never been on before. It was about a 5-mile loop through the mountains, and the views were incredible.

AI Coach: That sounds wonderful! What made this trail special compared to others you've hiked?

User: Well, it had these really unique rock formations that looked almost like natural sculptures. And there were these little waterfalls every mile or so. My friend Sarah, who's been hiking for years, said she'd never seen anything quite like it. We ended up taking so many photos.

AI Coach: It sounds like you had a great group dynamic too. How did everyone handle the 5-mile distance?

User: Actually, that was one of the best parts. We had people with different fitness levels, but everyone was really supportive. When someone needed a break, we all just enjoyed the scenery together. No one felt rushed or left behind.

AI Coach: That's fantastic - it really shows how much the company you keep can enhance an experience. Did you do anything else over the weekend?

User: Sunday was more low-key. I caught up on some reading and did meal prep for the week. Oh, and I video called my parents to tell them about the hike. They loved hearing about it.

AI Coach: It sounds like you had a perfect balance of adventure and relaxation. Thank you for sharing - your enthusiasm really came through!`,
        audio_url: "https://example.com/demo-audio.mp3",
        duration: 15,
        agent_id: agentId
      })
    }).then(() => {
      console.log('Webhook sent successfully');
    }).catch(error => {
      console.error('Error sending webhook:', error);
    });
    
    setIsConnected(false);
    setCurrentConversationId(null);
    onConversationEnd?.(conversationId);
  };

  const endConversation = () => {
    if (isConnected && currentConversationId) {
      simulateConversationEnd(currentConversationId);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {!isConnected ? (
        <Button
          onClick={startConversation}
          disabled={isLoading || disabled}
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
        <div className="flex flex-col items-center space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-coral-500 rounded-full flex items-center justify-center mb-2 animate-pulse">
              <Mic className="h-8 w-8 text-white" />
            </div>
            <p className="text-sage-700 font-medium">Voice conversation active</p>
            <p className="text-sage-600 text-sm">Practice discussing your weekend plans</p>
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