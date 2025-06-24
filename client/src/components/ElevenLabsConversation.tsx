import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useConversation } from "@/contexts/ConversationContext";

interface ElevenLabsConversationProps {
  agentId: string;
}

export default function ElevenLabsConversation({
  agentId,
}: ElevenLabsConversationProps) {
  const { isConnecting, isConnected, startConversation, endConversation } = useConversation();

  const handleStartConversation = () => {
    if (!isConnecting) {
      startConversation(agentId);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {!isConnected ? (
        <Button
          onClick={handleStartConversation}
          disabled={isConnecting}
          size="lg"
          className="bg-coral-600 hover:bg-coral-700 text-white px-8 py-6 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Mic className="mr-2 h-5 w-5" />
              Tap to start conversation
            </>
          )}
        </Button>
      ) : (
        <Button
          onClick={endConversation}
          size="lg"
          variant="destructive"
          className="h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <MicOff className="h-8 w-8" />
        </Button>
      )}

      <div className="text-center space-y-2">
        {isConnecting && (
          <p className="text-sm text-muted-foreground">Connecting...</p>
        )}
        {isConnected && (
          <p className="text-sm text-green-600 font-medium">
            Connected - Conversation active
          </p>
        )}
        {!isConnected && !isConnecting && (
          <p className="text-sm text-muted-foreground">
            Tap to start conversation
          </p>
        )}
      </div>
    </div>
  );
}