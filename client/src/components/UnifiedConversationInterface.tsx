import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, MessageCircle, Star } from "lucide-react";
import { useAnonymousConversation } from "@/contexts/AnonymousConversationContext";
import ChatThread from "@/components/ChatThread";
import type { TranscriptWithReview } from "@shared/schema";

interface UnifiedConversationInterfaceProps {
  agentId: string;
}

type ConversationState = 'idle' | 'connecting' | 'active' | 'processing' | 'review';

export default function UnifiedConversationInterface({
  agentId,
}: UnifiedConversationInterfaceProps) {
  const {
    isConnecting,
    isConnected,
    currentConversationId,
    conversationData,
    isReviewReady,
    startConversation,
    endConversation,
  } = useAnonymousConversation();

  // Determine current state
  const getState = (): ConversationState => {
    if (isReviewReady && conversationData?.review) return 'review';
    if (currentConversationId && !isReviewReady) return 'processing';
    if (isConnected) return 'active';
    if (isConnecting) return 'connecting';
    return 'idle';
  };

  const state = getState();

  const handleStartConversation = () => {
    startConversation(agentId);
  };

  const handleEndConversation = () => {
    endConversation();
  };

  const handleStartNewConversation = () => {
    // Reset to idle state and start new conversation
    endConversation();
    setTimeout(() => {
      startConversation(agentId);
    }, 100);
  };

  // Parse transcript data and merge with reviews for review state
  const getMergedTranscripts = (): TranscriptWithReview[] => {
    if (!conversationData?.review || !conversationData?.transcript) return [];
    
    try {
      const transcript = conversationData.transcript;
      const review = conversationData.review;
      
      const transcriptData = Array.isArray(transcript.transcriptData) 
        ? transcript.transcriptData 
        : JSON.parse(String(transcript.transcriptData));
      const reviewData = review.transcriptWithReviews 
        ? (Array.isArray(review.transcriptWithReviews) 
           ? review.transcriptWithReviews 
           : JSON.parse(String(review.transcriptWithReviews)))
        : [];
      
      return transcriptData.map((t: any, index: number) => ({
        ...t,
        review: reviewData.find((r: any) => r.index === index)?.review || null
      }));
    } catch (error) {
      console.error("Error parsing transcript/review data:", error);
      return [];
    }
  };

  const renderIdleState = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-8">
        <div className="w-40 h-40 rounded-full bg-gradient-to-br from-coral-100 to-sage-100 flex items-center justify-center shadow-2xl mx-auto">
          <MicOff className="w-20 h-20 text-warm-brown-400" />
        </div>
        <Button
          onClick={handleStartConversation}
          size="lg"
          className="bg-coral-500 text-white px-16 py-8 rounded-full text-3xl font-semibold hover:bg-coral-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Start Conversation
        </Button>
      </div>
    </div>
  );

  const renderConnectingState = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-8">
        <div className="w-40 h-40 rounded-full bg-gradient-to-br from-coral-100 to-sage-100 flex items-center justify-center shadow-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-coral-500"></div>
        </div>
        <p className="text-2xl text-warm-brown-600 font-medium">Connecting to AI coach...</p>
      </div>
    </div>
  );

  const renderActiveState = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-8">
        <div className="w-40 h-40 rounded-full bg-gradient-to-br from-coral-100 to-sage-100 flex items-center justify-center shadow-2xl">
          <Mic className="w-20 h-20 text-coral-600 animate-pulse" />
        </div>
        <div className="bg-green-100 border border-green-300 rounded-xl p-8">
          <p className="text-green-800 font-semibold text-2xl mb-2">
            🎙️ Conversation Active
          </p>
          <p className="text-green-700 text-lg">
            Speak naturally - the AI is listening
          </p>
        </div>
        <Button
          onClick={handleEndConversation}
          size="lg"
          variant="destructive"
          className="px-16 py-8 rounded-full text-2xl font-semibold"
        >
          End Conversation
        </Button>
      </div>
    </div>
  );

  const renderProcessingState = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-8">
        <div className="w-40 h-40 rounded-full bg-gradient-to-br from-sage-100 to-coral-100 flex items-center justify-center shadow-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-sage-500"></div>
        </div>
        <div className="space-y-4">
          <p className="text-2xl font-semibold text-warm-brown-700">
            AI Coach Analyzing...
          </p>
          <p className="text-lg text-warm-brown-600">
            Creating your personalized feedback
          </p>
        </div>
      </div>
    </div>
  );

  const renderReviewState = () => {
    const mergedTranscripts = getMergedTranscripts();
    const review = conversationData?.review;

    if (!review) return renderProcessingState();

    return (
      <div className="h-full flex">
        {/* Left side - Rating and Review Info */}
        <div className="w-1/2 p-6 border-r border-gray-200">
          <div className="space-y-6">
            {/* Rating */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-warm-brown-800 mb-4">Your Rating</h3>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-8 h-8 ${
                        i < (review.overallRating || 0)
                          ? "text-yellow-500 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <div className="text-4xl font-bold text-warm-brown-800">
                  {review.overallRating || 0}/5
                </div>
              </div>
            </div>

            {/* Summary if available */}
            {review.summary && (
              <div>
                <h4 className="text-lg font-semibold text-warm-brown-800 mb-3">Summary</h4>
                <div className="text-warm-brown-700 bg-sage-50 p-4 rounded-lg border border-sage-200">
                  {review.summary}
                </div>
              </div>
            )}

            {/* Start New Conversation Button */}
            <div className="pt-6">
              <Button
                onClick={handleStartNewConversation}
                size="lg"
                className="w-full bg-coral-500 text-white hover:bg-coral-600 py-4 text-lg font-semibold"
              >
                Start New Conversation
              </Button>
            </div>
          </div>
        </div>

        {/* Right side - Chat Thread */}
        <div className="w-1/2 p-6 flex flex-col">
          <h3 className="text-2xl font-bold text-warm-brown-800 mb-4">Conversation with Feedback</h3>
          <div className="flex-1 overflow-hidden border border-coral-200 rounded-lg">
            <div className="h-full overflow-y-auto">
              <ChatThread messages={mergedTranscripts} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentState = () => {
    switch (state) {
      case 'idle':
        return renderIdleState();
      case 'connecting':
        return renderConnectingState();
      case 'active':
        return renderActiveState();
      case 'processing':
        return renderProcessingState();
      case 'review':
        return renderReviewState();
      default:
        return renderIdleState();
    }
  };

  return (
    <Card className="w-full h-full border-2 border-coral-200 shadow-xl bg-gradient-to-br from-white to-coral-50">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-3xl font-bold text-brown-800">
            {state === 'review' ? 'Your Review' : 'AI Conversation Practice'}
          </CardTitle>
          {state === 'review' && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 text-sm px-3 py-1">
              ✓ Complete
            </Badge>
          )}
        </div>
        {state !== 'review' && (
          <p className="text-brown-600 text-base">
            {state === 'idle' && 'Click to start your free practice session'}
            {state === 'connecting' && 'Establishing connection...'}
            {state === 'active' && 'Conversation in progress'}
            {state === 'processing' && 'Analyzing your conversation...'}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        {renderCurrentState()}
      </CardContent>
    </Card>
  );
}