import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, MessageCircle, Star, AlertCircle } from "lucide-react";
import { useAnonymousConversation } from "@/contexts/AnonymousConversationContext";
import ChatThread from "@/components/ChatThread";
import type { TranscriptWithReview } from "@shared/schema";

interface UnifiedConversationInterfaceProps {
  agentId: string;
}

type ConversationState = 'idle' | 'connecting' | 'active' | 'processing' | 'review' | 'error';

export default function UnifiedConversationInterface({
  agentId,
}: UnifiedConversationInterfaceProps) {
  const {
    isConnecting,
    isConnected,
    currentConversationId,
    conversationData,
    isReviewReady,
    error,
    startConversation,
    endConversation,
    clearError,
    resetForNewConversation,
  } = useAnonymousConversation();

  // Determine current state
  const getState = (): ConversationState => {
    console.log('🔍 State check - error:', !!error, 'isReviewReady:', isReviewReady, 'hasConversationData:', !!conversationData, 'hasReview:', !!conversationData?.review, 'conversationStatus:', conversationData?.status, 'isConnected:', isConnected, 'isConnecting:', isConnecting, 'currentConversationId:', !!currentConversationId);
    
    // Error state takes priority
    if (error) return 'error';
    // Check for review state first - review is ready if we have both the flag and the data
    if (isReviewReady && conversationData?.review) {
      console.log('🔍 Review state: isReviewReady=true AND hasReview=true');
      return 'review';
    }
    // Alternative review check - if conversation is completed and has review, show review
    if (conversationData?.status === 'completed' && conversationData?.review) {
      console.log('🔍 Review state: conversation completed AND hasReview=true');
      return 'review';
    }
    // Active state - currently connected to ElevenLabs
    if (isConnected) return 'active';
    // Connecting state
    if (isConnecting) return 'connecting';
    // Processing state - conversation ended but review not ready yet
    if (currentConversationId && !isConnected && !isConnecting && !isReviewReady) return 'processing';
    // Default idle state
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
    clearError();
    endConversation();
    setTimeout(() => {
      startConversation(agentId);
    }, 100);
  };

  const handleRetry = () => {
    clearError();
    startConversation(agentId);
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
    <div className="flex items-center justify-center h-full p-6">
      <div className="text-center space-y-8">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-sage-100 to-coral-100 flex items-center justify-center shadow-lg mx-auto">
          <Mic className="w-16 h-16 text-warm-brown-600" />
        </div>
        <div className="space-y-4">
          <h3 className="text-heading-1 text-warm-brown-800">
            Ready to practice?
          </h3>
          <p className="text-body-large text-warm-brown-600 max-w-md mx-auto">
            Click the button below to start your conversation practice session
          </p>
        </div>
        <Button
          onClick={handleStartConversation}
          size="lg"
          className="btn-primary px-16 py-6 text-heading-3 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Start Conversation
        </Button>
      </div>
    </div>
  );

  const renderConnectingState = () => (
    <div className="flex items-center justify-center h-full p-6">
      <div className="text-center space-y-8">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-coral-100 to-sage-100 flex items-center justify-center shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-coral-500"></div>
        </div>
        <div className="space-y-2">
          <h3 className="text-heading-2 text-warm-brown-800">Connecting...</h3>
          <p className="text-body text-warm-brown-600">Setting up your AI conversation coach</p>
        </div>
      </div>
    </div>
  );

  const renderActiveState = () => (
    <div className="flex items-center justify-center h-full p-6">
      <div className="text-center space-y-8">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-100 to-sage-200 flex items-center justify-center shadow-lg border-4 border-green-200 animate-pulse">
          <Mic className="w-16 h-16 text-green-600 animate-pulse" />
        </div>
        <div className="space-y-3">
          <h3 className="text-heading-1 text-green-700">Connected!</h3>
          <p className="text-body-large text-green-700">
            Speak naturally - the AI is listening
          </p>
        </div>
        <Button
          onClick={handleEndConversation}
          size="lg"
          variant="destructive"
          className="px-16 py-4 text-heading-3 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Stop Conversation
        </Button>
      </div>
    </div>
  );

  const renderProcessingState = () => (
    <div className="flex items-center justify-center h-full p-6">
      <div className="text-center space-y-8">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-sage-100 to-coral-100 flex items-center justify-center shadow-lg mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-sage-500"></div>
        </div>
        <div className="space-y-3">
          <h3 className="text-heading-2 text-warm-brown-800">
            Processing your conversation...
          </h3>
          <p className="text-body text-warm-brown-600 max-w-md mx-auto">
            Our AI is analyzing your conversation and preparing detailed feedback
          </p>
        </div>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="flex items-center justify-center h-full p-6">
      <div className="text-center space-y-8 max-w-md mx-auto">
        <div className="w-32 h-32 rounded-full bg-red-100 flex items-center justify-center shadow-lg mx-auto">
          <AlertCircle className="w-16 h-16 text-red-500" />
        </div>
        <div className="space-y-4">
          <h3 className="text-heading-1 text-red-700">
            Connection Error
          </h3>
          <p className="text-body text-warm-brown-600">
            {error || "Unable to start conversation. Please try again."}
          </p>
        </div>
        <div className="space-y-4">
          <Button
            onClick={handleRetry}
            className="btn-primary w-full"
          >
            Try Again
          </Button>
          <Button
            onClick={clearError}
            className="btn-secondary w-full"
          >
            Back to Start
          </Button>
        </div>
      </div>
    </div>
  );

  const renderReviewState = () => {
    const mergedTranscripts = getMergedTranscripts();
    const review = conversationData?.review;

    if (!review) return renderProcessingState();

    return (
      <div className="h-full flex overflow-hidden p-4">
        {/* Left side - Rating and Review Info */}
        <div className="w-1/2 pr-4 border-r border-warm-brown-200 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {/* Rating */}
            <div className="text-center">
              <h3 className="text-heading-3 text-warm-brown-800 mb-3">Your Rating</h3>
              <div className="bg-gradient-to-r from-coral-50 to-sage-50 rounded-xl p-4 border border-coral-200 shadow-sm">
                <div className="flex items-center justify-center space-x-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${
                        i < (review.overallRating || 0)
                          ? "text-coral-500 fill-current"
                          : "text-warm-brown-200"
                      }`}
                    />
                  ))}
                </div>
                <div className="text-heading-2 text-warm-brown-800">
                  {review.overallRating || 0}/5
                </div>
              </div>
            </div>

            {/* Summary if available */}
            {review.summary && (
              <div>
                <h4 className="text-body-large font-semibold text-warm-brown-800 mb-2">Summary</h4>
                <div className="text-body text-warm-brown-700 bg-sage-50 p-3 rounded-xl border border-sage-200 shadow-sm">
                  {review.summary}
                </div>
              </div>
            )}
          </div>
          
          {/* Start New Conversation Button - Fixed at bottom */}
          <div className="pt-4 border-t border-warm-brown-100">
            <Button
              onClick={handleStartNewConversation}
              size="lg"
              className="btn-primary w-full py-3 text-body-large font-semibold"
            >
              Start New Conversation
            </Button>
          </div>
        </div>

        {/* Right side - Chat Thread */}
        <div className="w-1/2 pl-4 flex flex-col min-h-0">
          <h3 className="text-heading-3 text-warm-brown-800 mb-3">Conversation with Feedback</h3>
          <div className="flex-1 overflow-hidden border border-coral-200 rounded-xl shadow-sm min-h-0">
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
      case 'error':
        return renderErrorState();
      default:
        return renderIdleState();
    }
  };

  return (
    <Card className="card-surface w-full h-full border-2 border-coral-200 shadow-lg bg-gradient-to-br from-white to-coral-50">
      {state === 'review' && (
        <CardHeader className="text-center py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-heading-2 text-warm-brown-800">
              Your Review
            </CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800 text-caption px-2 py-1 rounded-lg">
              ✓ Complete
            </Badge>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={`${state === 'review' ? 'flex-1' : 'flex-1'} flex flex-col p-0`}>
        {renderCurrentState()}
      </CardContent>
    </Card>
  );
}