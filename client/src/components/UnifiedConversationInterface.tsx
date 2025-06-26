import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Star, AlertCircle, Check } from "lucide-react";
import { useAnonymousConversation } from "@/contexts/AnonymousConversationContext";
import ChatThread from "@/components/ChatThread";
import AvatarSelection from "@/components/AvatarSelection";
import { AVATARS } from "@shared/schema";
import type { TranscriptWithReview, Avatar } from "@shared/schema";
import { useState } from "react";

interface UnifiedConversationInterfaceProps {
  agentId?: string; // Made optional since we'll manage it internally
}

type ConversationState =
  | "idle"
  | "connecting"
  | "active"
  | "processing"
  | "review"
  | "error";

export default function UnifiedConversationInterface({
  agentId,
}: UnifiedConversationInterfaceProps) {
  // Avatar selection state - default to first avatar
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar>(AVATARS[0]);
  
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
    console.log(
      "🔍 State check - error:",
      !!error,
      "isReviewReady:",
      isReviewReady,
      "hasConversationData:",
      !!conversationData,
      "hasReview:",
      !!conversationData?.review,
      "conversationStatus:",
      conversationData?.status,
      "isConnected:",
      isConnected,
      "isConnecting:",
      isConnecting,
      "currentConversationId:",
      !!currentConversationId,
    );

    // Error state takes priority
    if (error) return "error";
    // Check for review state first - review is ready if we have both the flag and the data
    if (isReviewReady && conversationData?.review) {
      console.log("🔍 Review state: isReviewReady=true AND hasReview=true");
      return "review";
    }
    // Alternative review check - if conversation is completed and has review, show review
    if (conversationData?.status === "completed" && conversationData?.review) {
      console.log("🔍 Review state: conversation completed AND hasReview=true");
      return "review";
    }
    // Active state - currently connected to ElevenLabs
    if (isConnected) return "active";
    // Connecting state
    if (isConnecting) return "connecting";
    // Processing state - conversation ended but review not ready yet OR review is ready but data still loading
    if (
      currentConversationId &&
      !isConnected &&
      !isConnecting &&
      (!isReviewReady || !conversationData?.review)
    )
      return "processing";
    // Default idle state
    return "idle";
  };

  const state = getState();

  const handleStartConversation = () => {
    if (selectedAvatar?.agent_id) {
      startConversation(selectedAvatar.agent_id);
    }
  };

  const handleEndConversation = () => {
    endConversation();
  };

  const handleStartNewConversation = () => {
    // Reset to idle state without auto-starting
    resetForNewConversation();
  };

  const handleRetry = () => {
    clearError();
    if (selectedAvatar?.agent_id) {
      startConversation(selectedAvatar.agent_id);
    }
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
        ? Array.isArray(review.transcriptWithReviews)
          ? review.transcriptWithReviews
          : JSON.parse(String(review.transcriptWithReviews))
        : [];

      return transcriptData.map((t: any, index: number) => ({
        ...t,
        review: reviewData.find((r: any) => r.index === index)?.review || null,
      }));
    } catch (error) {
      console.error("Error parsing transcript/review data:", error);
      return [];
    }
  };

  const renderIdleState = () => (
    <div className="h-full lg:h-full flex p-4 sm:p-6 lg:p-8">
      <div className="w-conversation-sm md:w-conversation-md xl:w-conversation mx-auto flex flex-col lg:flex-row lg:h-full">
        {/* Left side - Marketing content */}
        <div className="w-full lg:w-1/2 pr-0 lg:pr-8 flex flex-col justify-center mb-8 lg:mb-0 lg:h-full">
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              <span className="text-warm-brown-800">
                Practice conversations.{" "}
              </span>
              <span className="text-coral-500">Build confidence.</span>
            </h1>
            <p className="text-base sm:text-lg text-warm-brown-600">
              AI-powered conversation practice with instant feedback
            </p>
            <div className="space-y-3 text-sm text-warm-brown-600">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-sage-500" />
                <span>Free to try</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-sage-500" />
                <span>Instant feedback</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-sage-500" />
                <span>No signup required</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Action section */}
        <div className="w-full lg:w-1/2 pl-0 lg:pl-8 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-warm-brown-200 pt-8 lg:pt-0">
          <div className="space-y-6">
            <AvatarSelection
              selectedAvatar={selectedAvatar}
              onAvatarSelect={setSelectedAvatar}
            />
            <div className="text-center">
              <Button
                onClick={handleStartConversation}
                size="lg"
                className="btn-primary px-8 sm:px-12 lg:px-16 py-4 sm:py-5 lg:py-6 text-heading-3 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Start Conversation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConnectingState = () => (
    <div className="h-full flex p-4 sm:p-6 lg:p-8">
      <div className="w-conversation-sm md:w-conversation-md xl:w-conversation mx-auto">
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-8">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-coral-200 border-t-coral-600"></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-heading-2 text-warm-brown-800">
                Connecting...
              </h3>
              <p className="text-body text-warm-brown-600">
                Setting up your AI conversation coach. This will takes just a few seconds
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActiveState = () => (
    <div className="h-full flex p-4 sm:p-6 lg:p-8">
      <div className="w-conversation-sm md:w-conversation-md xl:w-conversation mx-auto">
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-8">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-coral-500 shadow-lg"></div>
            </div>
            <div className="space-y-3">
              <h3 className="text-heading-1 text-warm-brown-800">Connected!</h3>
              <p className="text-body-large text-warm-brown-700">
                Speak naturally and confidently into your microphone. The AI is listening!
              </p>
            </div>
            <Button
              onClick={handleEndConversation}
              size="lg"
              className="btn-primary px-8 sm:px-12 lg:px-16 py-4 sm:py-5 lg:py-6 text-heading-3 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Stop Conversation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProcessingState = () => (
    <div className="h-full flex p-4 sm:p-6 lg:p-8">
      <div className="w-conversation-sm md:w-conversation-md xl:w-conversation mx-auto">
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-8">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-coral-200 border-t-coral-600"></div>
            </div>
            <div className="space-y-3">
              <h3 className="text-heading-2 text-warm-brown-800">
                Processing your conversation...
              </h3>
              <p className="text-body text-warm-brown-600">
                Our AI is analyzing your conversation and preparing detailed
                feedback
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="h-full flex p-4 sm:p-6 lg:p-8">
      <div className="w-conversation-sm md:w-conversation-md xl:w-conversation mx-auto">
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-8">
            <div className="w-32 h-32 rounded-full bg-red-100 flex items-center justify-center shadow-lg mx-auto">
              <AlertCircle className="w-16 h-16 text-red-500" />
            </div>
            <div className="space-y-4">
              <h3 className="text-heading-1 text-red-700">Connection Error</h3>
              <p className="text-body text-warm-brown-600">
                {error || "Unable to start conversation. Please try again."}
              </p>
            </div>
            <div className="space-y-4 max-w-md mx-auto">
              <Button onClick={handleRetry} className="btn-primary w-full">
                Try Again
              </Button>
              <Button onClick={clearError} className="btn-secondary w-full">
                Back to Start
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReviewState = () => {
    const mergedTranscripts = getMergedTranscripts();
    const review = conversationData?.review;

    if (!review) return renderProcessingState();

    return (
      <div className="lg:h-full flex overflow-hidden p-4 sm:p-6 lg:p-8">
        <div className="w-conversation-sm md:w-conversation-md xl:w-conversation mx-auto flex flex-col lg:flex-row lg:min-h-0">
          {/* Left side - Rating and Review Info */}
          <div className="w-full lg:w-1/2 pr-0 lg:pr-8 border-b lg:border-b-0 lg:border-r border-warm-brown-200 flex flex-col lg:min-h-0 mb-6 lg:mb-0 pb-6 lg:pb-0">
            <div className="space-y-4 pr-2 lg:flex-1 lg:overflow-y-auto">
              {/* Rating */}
              <div>
                <h3 className="text-heading-3 text-warm-brown-800 mb-3">
                  Your Rating
                </h3>
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
                  <h4 className="text-body-large font-semibold text-warm-brown-800 mb-2">
                    Summary
                  </h4>
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
          <div className="w-full lg:w-1/2 pl-0 lg:pl-8 flex flex-col min-h-0 max-h-[75vh] lg:max-h-none">
            <h3 className="text-heading-3 text-warm-brown-800 mb-3">
              Conversation with Feedback
            </h3>
            <div className="flex-1 min-h-0">
              <ChatThread
                messages={mergedTranscripts}
                className="h-full border border-coral-200 rounded-xl shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentState = () => {
    switch (state) {
      case "idle":
        return renderIdleState();
      case "connecting":
        return renderConnectingState();
      case "active":
        return renderActiveState();
      case "processing":
        return renderProcessingState();
      case "review":
        return renderReviewState();
      case "error":
        return renderErrorState();
      default:
        return renderIdleState();
    }
  };

  return (
    <Card className="flex flex-col flex-1 min-h-0 min-h-[600px] lg:h-full border-2 border-coral-200 shadow-lg bg-gradient-to-br from-white to-coral-50">
      <CardContent className="flex-1 min-h-0 overflow-hidden flex flex-col p-0 md:justify-center justify-center">
        {renderCurrentState()}
      </CardContent>
    </Card>
  );
}
