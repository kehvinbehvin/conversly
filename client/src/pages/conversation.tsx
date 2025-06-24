import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ElevenLabsConversation from "@/components/ElevenLabsConversation";

export default function Conversation() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-brown-50 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <Card className="border-sage-200 shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold text-brown-800">
              Practice Session
            </CardTitle>
            <p className="text-brown-600 mt-2">
              Start a conversation to practice your communication skills
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-8 pb-8">
            <ElevenLabsConversation agentId="agent_01jyfb9fh8f67agfzvv09tvg3t" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}