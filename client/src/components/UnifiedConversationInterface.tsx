import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, AlertCircle, Check, Clock } from "lucide-react";
import { useAnonymousConversation } from "@/contexts/AnonymousConversationContext";
import ChatThread from "@/components/ChatThread";
import AvatarSelection from "@/components/AvatarSelection";
import { AVATARS } from "@shared/schema";
import type { TranscriptWithReview, Avatar } from "@shared/schema";
import { useState, useEffect, useCallback, useRef } from "react";
import { useConversationTimer } from "@/hooks/useConversationTimer";

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
  
  // Simple scroll to top utility
  const scrollToTop = () => {
    console.log('📍 Scrolling to top');
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };



  // Log avatar selection for debugging
  const handleAvatarSelect = (avatar: Avatar) => {
    console.log(`👤 Avatar selected: ${avatar.name} (${avatar.agent_id})`);
    setSelectedAvatar(avatar);
  };

  const {
    isConnecting,
    isConnected,
    isSpeaking,
    currentConversationId,
    conversationData,
    isReviewReady,
    error,
    startConversation,
    endConversation,
    clearError,
    resetForNewConversation,
  } = useAnonymousConversation();

  // Log speaking state changes for debugging
  useEffect(() => {
    if (isConnected) {
      console.log(
        `🎤 Speaking state changed: ${isSpeaking ? "Agent is speaking" : "Agent listening"} - Avatar: ${selectedAvatar.name}`,
      );
    }
  }, [isSpeaking, isConnected, selectedAvatar.name]);

  // Scroll to top when starting conversation
  useEffect(() => {
    if (isConnecting || isConnected) {
      scrollToTop();
    }
  }, [isConnecting, isConnected]);

  // Scroll to top when review is ready
  useEffect(() => {
    if (isReviewReady) {
      scrollToTop();
    }
  }, [isReviewReady]);

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
      console.log(
        `🚀 Starting conversation with ${selectedAvatar.name} (${selectedAvatar.agent_id})`,
      );
      startConversation(selectedAvatar.agent_id);
    } else {
      console.error("❌ No avatar selected or invalid agent_id");
    }
  };

  // Timer expiration callback
  const handleTimerExpired = useCallback(() => {
    console.log("⏰ Timer expired - automatically ending conversation");
    endConversation();
  }, [endConversation]);

  // Conversation timer - 5 minutes (300,000 ms)
  const timer = useConversationTimer({
    durationMs: 5 * 60 * 1000, // 5 minutes
    onTimerExpired: handleTimerExpired,
    isActive: isConnected, // Timer only runs when conversation is active
  });

  const handleEndConversation = () => {
    endConversation();
  };

  const handleStartNewConversation = () => {
    // Reset to idle state without auto-starting
    resetForNewConversation();
    
    // Auto-scroll back to idle state anchor for new conversation
    setTimeout(() => scrollToStateAnchor("idle"), 100);
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
              onAvatarSelect={handleAvatarSelect}
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
                Setting up your AI conversation coach. This will takes just a
                few seconds
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
            {/* Avatar Profile Display */}
            <div className="flex flex-col items-center space-y-6">
              {/* Profile Photo with Dynamic Highlighting */}
              <div
                className={`relative w-32 h-32 rounded-full overflow-hidden shadow-lg transition-all duration-300 ${
                  isSpeaking
                    ? "ring-4 ring-coral-500 ring-opacity-75 shadow-coral-200 shadow-2xl scale-105"
                    : "ring-2 ring-warm-brown-200 ring-opacity-50"
                }`}
              >
                <div
                  className={`w-full h-full bg-gradient-to-br transition-all duration-300 ${
                    isSpeaking
                      ? "from-coral-400 to-coral-600"
                      : "from-sage-400 to-sage-600"
                  } flex items-center justify-center`}
                >
                  <span className="text-4xl text-white font-bold">
                    {selectedAvatar.name.charAt(0)}
                  </span>
                </div>

                {/* Speaking Indicator Pulse */}
                {isSpeaking && (
                  <div className="absolute inset-0 rounded-full">
                    <div className="absolute inset-0 rounded-full bg-coral-500 opacity-25 animate-ping"></div>
                    <div
                      className="absolute inset-2 rounded-full bg-coral-400 opacity-30 animate-ping"
                      style={{ animationDelay: "75ms" }}
                    ></div>
                  </div>
                )}
              </div>

              {/* Avatar Name and Description */}
              <div className="space-y-2 max-w-sm">
                <h3
                  className={`text-heading-2 transition-colors duration-300 ${
                    isSpeaking ? "text-coral-700" : "text-warm-brown-800"
                  }`}
                >
                  {selectedAvatar.name}
                </h3>
                <p className="text-body text-warm-brown-600 leading-relaxed">
                  {selectedAvatar.description}
                </p>
              </div>
            </div>

            {/* Timer Display */}
            <div className="flex items-center justify-center space-x-2 text-warm-brown-800">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">{timer.formattedTime}</span>
            </div>

            {/* Status and Speaking Indicator */}
            <div className="space-y-3">
              <div
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
                  isSpeaking
                    ? "bg-coral-100 text-coral-800 border border-coral-200"
                    : "bg-sage-100 text-sage-800 border border-sage-200"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    isSpeaking ? "bg-coral-500 animate-pulse" : "bg-sage-500"
                  }`}
                ></div>
                <span className="text-sm font-medium">
                  {isSpeaking ? "Speaking..." : "Listening"}
                </span>
              </div>
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
              <Button onClick={resetForNewConversation} className="btn-primary w-full">
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
              {/* Score */}
              <div>
                <h3 className="text-heading-3 text-warm-brown-800 mb-3">
                  Your Score
                </h3>
                <div className="bg-gradient-to-r from-coral-50 to-sage-50 rounded-xl p-4 border border-coral-200 shadow-sm">
                  <div className="text-center">
                    <div className="text-heading-1 text-warm-brown-800 font-bold">
                      {(review.overallRating ?? 0) > 0 ? "+" : ""}
                      {review.overallRating ?? 0}
                    </div>
                  </div>
                </div>
                
                {/* Score Explanation */}
                <div className="mt-3 text-sm text-warm-brown-600 bg-warm-brown-50 p-3 rounded-lg border border-warm-brown-200">
                  <p className="leading-relaxed">
                    Starting from a baseline of 0, you earn <span className="font-medium text-sage-700">+1 point</span> for good displays of conversational skill and <span className="font-medium text-coral-700">-1 point</span> for areas that need improvement.
                  </p>
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
    <Card 
      ref={conversationRef}
      className="flex flex-col flex-1 min-h-0 min-h-[600px] lg:h-full border-2 border-coral-200 shadow-lg bg-gradient-to-br from-white to-coral-50"
    >
      <CardContent className="flex-1 min-h-0 overflow-hidden flex flex-col p-0 md:justify-center justify-center">
        {renderCurrentState()}
      </CardContent>
    </Card>
  );
}
