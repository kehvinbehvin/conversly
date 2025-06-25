import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff } from "lucide-react";
import { useAnonymousConversation } from "@/contexts/AnonymousConversationContext";

interface AnonymousConversationToolProps {
  agentId: string;
}

export default function AnonymousConversationTool({
  agentId,
}: AnonymousConversationToolProps) {
  const {
    isConnecting,
    isConnected,
    startConversation,
    endConversation,
  } = useAnonymousConversation();

  const handleStartConversation = () => {
    startConversation(agentId);
  };

  const handleEndConversation = () => {
    endConversation();
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-brown-800">
          Try It Now - Free Practice Session
        </CardTitle>
        <p className="text-brown-600 text-sm">
          Experience our AI conversation coach instantly
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col items-center justify-center space-y-6">
        <div className="w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out bg-gradient-to-br from-coral-100 to-sage-100 border-4 border-white shadow-lg">
          {isConnected ? (
            <Mic className="w-12 h-12 text-coral-600 animate-pulse" />
          ) : (
            <MicOff className="w-12 h-12 text-warm-brown-400" />
          )}
        </div>

        <div className="space-y-4 text-center">
          {!isConnected && !isConnecting && (
            <Button
              onClick={handleStartConversation}
              size="lg"
              className="bg-coral-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-coral-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Start Free Conversation
            </Button>
          )}

          {isConnecting && (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500 mx-auto"></div>
              <p className="text-sm text-warm-brown-600">Connecting...</p>
            </div>
          )}

          {isConnected && (
            <Button
              onClick={handleEndConversation}
              size="lg"
              variant="destructive"
              className="px-8 py-4 rounded-full text-lg font-semibold"
            >
              End Conversation
            </Button>
          )}
        </div>

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
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Click to start your free practice session
              </p>
              <p className="text-xs text-warm-brown-500">
                No account required • 5-minute session • Instant AI feedback
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}