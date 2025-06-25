import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { MessageCircle, Star, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { useAnonymousConversation } from "@/contexts/AnonymousConversationContext";
import ChatThread from "@/components/ChatThread";
import type { TranscriptWithReview } from "@shared/schema";

export default function AnonymousReviewPanel() {
  const { conversationData, isReviewReady, currentConversationId } = useAnonymousConversation();

  // Show waiting state when conversation is active but review not ready
  if (currentConversationId && !isReviewReady) {
    return (
      <Card className="w-full h-full flex flex-col border-2 border-sage-200 shadow-xl bg-gradient-to-br from-white to-sage-50">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl font-bold text-brown-800 mb-2">
            AI Coach Analyzing
          </CardTitle>
          <p className="text-brown-600 text-base">
            Creating your personalized feedback
          </p>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col items-center justify-center space-y-8 px-8">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-sage-100 to-coral-100 flex items-center justify-center shadow-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-sage-500"></div>
          </div>
          
          <div className="text-center space-y-4">
            <p className="text-xl font-semibold text-warm-brown-700">
              Analyzing your conversation...
            </p>
            <p className="text-base text-warm-brown-600">
              This usually takes 30-60 seconds
            </p>
            <div className="bg-sage-50 p-6 rounded-xl">
              <p className="text-sm text-warm-brown-600 mb-3 font-medium">What you'll get:</p>
              <div className="grid grid-cols-1 gap-2 text-sm text-warm-brown-600">
                <div>✓ Overall conversation rating</div>
                <div>✓ Detailed transcript with feedback</div>
                <div>✓ Personalized improvement tips</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show review content when ready
  if (isReviewReady && conversationData?.review) {
    const review = conversationData.review;
    const transcript = conversationData.transcript;
    
    // Parse transcript data and merge with reviews
    let mergedTranscripts: TranscriptWithReview[] = [];
    if (transcript?.transcriptData) {
      try {
        const transcriptData = Array.isArray(transcript.transcriptData) 
          ? transcript.transcriptData 
          : JSON.parse(String(transcript.transcriptData));
        const reviewData = review.transcriptWithReviews 
          ? (Array.isArray(review.transcriptWithReviews) 
             ? review.transcriptWithReviews 
             : JSON.parse(String(review.transcriptWithReviews)))
          : [];
        
        mergedTranscripts = transcriptData.map((t: any, index: number) => ({
          ...t,
          review: reviewData.find((r: any) => r.index === index)?.review || null
        }));
      } catch (error) {
        console.error("Error parsing transcript/review data:", error);
      }
    }

    return (
      <Card className="w-full h-full flex flex-col border-2 border-green-200 shadow-xl bg-gradient-to-br from-white to-green-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-bold text-brown-800">
              Your Review
            </CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800 text-sm px-3 py-1">
              ✓ Complete
            </Badge>
          </div>
          <p className="text-brown-600 text-base">
            AI coach feedback on your conversation
          </p>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col px-6">
          {/* Condensed Rating */}
          <div className="flex items-center justify-between bg-yellow-50 rounded-lg p-4 mb-4 border border-yellow-200">
            <span className="font-semibold text-warm-brown-700">Rating:</span>
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < (review.overallRating || 0)
                      ? "text-yellow-500 fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
              <span className="ml-2 font-bold text-warm-brown-800">
                {review.overallRating || 0}/5
              </span>
            </div>
          </div>

          {/* Conversation Transcript - Scrollable Only */}
          {mergedTranscripts.length > 0 && (
            <div className="flex-1 flex flex-col">
              <h4 className="font-semibold text-warm-brown-800 flex items-center mb-3">
                <MessageCircle className="w-4 h-4 mr-2 text-coral-500" />
                Conversation with Feedback
              </h4>
              <div className="flex-1 overflow-y-auto border border-coral-200 rounded-lg">
                <ChatThread messages={mergedTranscripts} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default placeholder state
  return (
    <Card className="w-full h-full flex flex-col border-2 border-sage-200 shadow-xl bg-gradient-to-br from-white to-sage-50">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-3xl font-bold text-brown-800 mb-2">
          AI Feedback Preview
        </CardTitle>
        <p className="text-brown-600 text-base">
          Your personalized review will appear here
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col items-center justify-center space-y-8 px-8">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-sage-100 to-coral-100 flex items-center justify-center shadow-2xl">
          <MessageCircle className="w-16 h-16 text-warm-brown-400" />
        </div>
        
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-semibold text-warm-brown-700">
            Your AI Review
          </h3>
          <p className="text-lg text-warm-brown-600">
            Will appear here after conversation
          </p>
        </div>
      </CardContent>
    </Card>
  );
}