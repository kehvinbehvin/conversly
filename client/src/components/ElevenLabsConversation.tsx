import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useConversation } from "@/contexts/ConversationContext";

interface ElevenLabsConversationProps {
  agentId: string;
  disabled?: boolean;
}

export default function ElevenLabsConversation({
  agentId,
  disabled = false,
}: ElevenLabsConversationProps) {
  const { isConnecting, isConnected, startConversation, endConversation } = useConversation();

  const handleStartConversation = () => {
    if (!disabled && !isConnecting) {
      startConversation(agentId);
    }
  };

  const isLoading = isConnecting;

  return (
    <div className="flex flex-col items-center space-y-6">
      {!isConnected ? (
        <Button
          onClick={handleStartConversation}
          disabled={isLoading || disabled}
          size="lg"
          className="h-16 w-16 rounded-full bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          ) : (
            <Mic className="h-8 w-8 text-white" />
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
        {isLoading && (
          <p className="text-sm text-muted-foreground">Connecting...</p>
        )}
        {isConnected && (
          <p className="text-sm text-green-600 font-medium">
            Connected - Conversation active
          </p>
        )}
        {!isConnected && !isLoading && (
          <p className="text-sm text-muted-foreground">
            Tap to start conversation
          </p>
        )}
      </div>
    </div>
  );
}