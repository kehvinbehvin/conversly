import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { lazy, Suspense } from "react";

const ElevenLabsConversation = lazy(
  () => import("@/components/ElevenLabsConversation"),
);

export default function ConversationStarter() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-brown-50 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

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
            <Suspense
              fallback={
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
              }
            >
              <ElevenLabsConversation agentId="agent_01jyfb9fh8f67agfzvv09tvg3t" />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
