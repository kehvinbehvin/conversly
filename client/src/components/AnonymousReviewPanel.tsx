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
        
        <CardContent className="flex-1 space-y-6 overflow-y-auto px-6">
          {/* Overall Rating */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-semibold text-warm-brown-700">Overall Rating</span>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-6 h-6 ${
                      i < (review.overallRating || 0)
                        ? "text-yellow-500 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="ml-3 text-xl font-bold text-warm-brown-800">
                  {review.overallRating || 0}/5
                </span>
              </div>
            </div>
          </div>

          {/* Summary */}
          {review.summary && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-warm-brown-800 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-sage-500" />
                Conversation Summary
              </h4>
              <div className="text-base text-warm-brown-700 bg-sage-50 p-4 rounded-lg border border-sage-200">
                {review.summary}
              </div>
            </div>
          )}

          {/* Conversation Transcript */}
          {mergedTranscripts.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-warm-brown-800 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-coral-500" />
                Conversation Transcript
              </h4>
              <div className="max-h-80 overflow-y-auto border border-coral-200 rounded-lg">
                <ChatThread messages={mergedTranscripts} />
              </div>
            </div>
          )}

          {/* Detailed Review from Transcript */}
          {mergedTranscripts.some(t => t.review) && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-warm-brown-800 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-coral-500" />
                Detailed Feedback
              </h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {mergedTranscripts.filter(t => t.review).map((item, index) => (
                  <div key={index} className="text-sm text-warm-brown-700 bg-coral-50 p-4 rounded-lg border border-coral-200">
                    <div className="font-semibold text-sm text-warm-brown-600 mb-2">
                      {item.role === 'user' ? '👤 Your response' : '🤖 AI response'}
                    </div>
                    <div className="text-coral-700 leading-relaxed">{item.review}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-warm-brown-800 to-warm-brown-700 text-white rounded-xl p-6 text-center space-y-4 border border-warm-brown-600">
            <h4 className="text-lg font-bold">Want to track your progress?</h4>
            <p className="text-base text-warm-brown-200">
              Create an account to save conversations and see improvement over time
            </p>
            <Link href="/dashboard">
              <Button className="bg-coral-500 text-white hover:bg-coral-600 px-6 py-3 text-base font-semibold transform hover:scale-105 transition-all duration-200">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
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
        
        <div className="text-center space-y-6 max-w-md">
          <h3 className="text-xl font-semibold text-warm-brown-700">
            Ready for instant feedback?
          </h3>
          <p className="text-base text-warm-brown-600">
            Start a conversation on the left and receive AI-powered analysis with:
          </p>
          <div className="bg-sage-50 p-6 rounded-xl border border-sage-200">
            <div className="grid grid-cols-1 gap-3 text-base text-warm-brown-600">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-sage-500 rounded-full"></div>
                <span>Overall conversation rating</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-coral-500 rounded-full"></div>
                <span>Detailed transcript analysis</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Personalized improvement tips</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-warm-brown-50 p-6 rounded-xl w-full max-w-md text-center">
          <p className="text-sm text-warm-brown-600 font-medium mb-2">
            Free to try • No account required
          </p>
          <p className="text-xs text-warm-brown-500">
            Analysis takes 30-60 seconds after conversation ends
          </p>
        </div>
      </CardContent>
    </Card>
  );
}