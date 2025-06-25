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
    <Card className="w-full h-full flex flex-col border-2 border-coral-200 shadow-xl bg-gradient-to-br from-white to-coral-50">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-3xl font-bold text-brown-800 mb-2">
          Start Practicing
        </CardTitle>
        <p className="text-brown-600 text-base">
          Talk with our AI coach about your weekend
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col items-center justify-center space-y-8 px-8">
        <div className="w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out bg-gradient-to-br from-coral-100 to-sage-100 border-4 border-white shadow-2xl">
          {isConnected ? (
            <Mic className="w-16 h-16 text-coral-600 animate-pulse" />
          ) : (
            <MicOff className="w-16 h-16 text-warm-brown-400" />
          )}
        </div>

        <div className="space-y-6 text-center w-full">
          {!isConnected && !isConnecting && (
            <Button
              onClick={handleStartConversation}
              size="lg"
              className="bg-coral-500 text-white px-10 py-5 rounded-full text-xl font-semibold hover:bg-coral-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl w-full max-w-sm"
            >
              Start Free Conversation
            </Button>
          )}

          {isConnecting && (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-coral-500 mx-auto"></div>
              <p className="text-lg text-warm-brown-600 font-medium">Connecting to AI coach...</p>
            </div>
          )}

          {isConnected && (
            <div className="space-y-4">
              <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-semibold text-lg">
                  🎙️ Conversation Active
                </p>
                <p className="text-green-700 text-sm mt-1">
                  Speak naturally - the AI is listening
                </p>
              </div>
              <Button
                onClick={handleEndConversation}
                size="lg"
                variant="destructive"
                className="px-10 py-5 rounded-full text-xl font-semibold w-full max-w-sm"
              >
                End Conversation
              </Button>
            </div>
          )}
        </div>

        {!isConnected && !isConnecting && (
          <div className="text-center space-y-3 bg-sage-50 p-6 rounded-xl">
            <p className="text-base text-warm-brown-700 font-medium">
              Practice makes perfect
            </p>
            <div className="grid grid-cols-1 gap-2 text-sm text-warm-brown-600">
              <div>✓ No account required</div>
              <div>✓ 5-minute sessions</div>
              <div>✓ Instant AI feedback</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}