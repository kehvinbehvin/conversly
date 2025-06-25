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
      <Card className="w-full h-full flex flex-col">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-brown-800">
            AI Analysis in Progress
          </CardTitle>
          <p className="text-brown-600 text-sm">
            Your conversation is being analyzed
          </p>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sage-100 to-coral-100 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-500"></div>
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-warm-brown-700">
              Processing your conversation...
            </p>
            <p className="text-sm text-warm-brown-600">
              This usually takes 30-60 seconds
            </p>
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
      <Card className="w-full h-full flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-brown-800">
              Your Conversation Review
            </CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Analysis Complete
            </Badge>
          </div>
          <p className="text-brown-600 text-sm">
            AI-powered feedback on your conversation skills
          </p>
        </CardHeader>
        
        <CardContent className="flex-1 space-y-6 overflow-y-auto">
          {/* Overall Rating */}
          <div className="bg-gradient-to-r from-sage-50 to-coral-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-warm-brown-700">Overall Rating</span>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < (review.overallRating || 0)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm font-bold text-warm-brown-800">
                  {review.overallRating || 0}/5
                </span>
              </div>
            </div>
          </div>

          {/* Summary */}
          {review.summary && (
            <div className="space-y-3">
              <h4 className="font-semibold text-warm-brown-800 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-sage-500" />
                Conversation Summary
              </h4>
              <div className="text-sm text-warm-brown-700 bg-sage-50 p-3 rounded">
                {review.summary}
              </div>
            </div>
          )}

          {/* Conversation Transcript */}
          {mergedTranscripts.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-warm-brown-800 flex items-center">
                <MessageCircle className="w-4 h-4 mr-2 text-coral-500" />
                Conversation Transcript
              </h4>
              <div className="max-h-64 overflow-y-auto">
                <ChatThread messages={mergedTranscripts} />
              </div>
            </div>
          )}

          {/* Detailed Review from Transcript */}
          {mergedTranscripts.some(t => t.review) && (
            <div className="space-y-3">
              <h4 className="font-semibold text-warm-brown-800 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-coral-500" />
                Detailed Feedback
              </h4>
              <div className="space-y-2">
                {mergedTranscripts.filter(t => t.review).map((item, index) => (
                  <div key={index} className="text-sm text-warm-brown-700 bg-coral-50 p-2 rounded">
                    <div className="font-medium text-xs text-warm-brown-500 mb-1">
                      {item.role === 'user' ? 'Your response' : 'AI response'}
                    </div>
                    <div className="text-coral-700">{item.review}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Call to Action */}
          <div className="bg-warm-brown-800 text-white rounded-lg p-4 text-center space-y-3">
            <h4 className="font-semibold">Want to track your progress?</h4>
            <p className="text-sm text-warm-brown-200">
              Create an account to save conversations and see improvement over time
            </p>
            <Link href="/dashboard">
              <Button className="bg-coral-500 text-white hover:bg-coral-600">
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default placeholder state
  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-brown-800">
          AI Conversation Review
        </CardTitle>
        <p className="text-brown-600 text-sm">
          Your personalized feedback will appear here
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col items-center justify-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sage-100 to-coral-100 flex items-center justify-center">
          <MessageCircle className="w-8 h-8 text-warm-brown-400" />
        </div>
        
        <div className="text-center space-y-4 max-w-sm">
          <h3 className="text-lg font-medium text-warm-brown-700">
            Ready for instant feedback?
          </h3>
          <p className="text-sm text-warm-brown-600">
            Start a conversation on the left and receive AI-powered analysis with:
          </p>
          <ul className="text-sm text-warm-brown-600 space-y-1">
            <li>• Overall conversation rating</li>
            <li>• Key strength highlights</li>
            <li>• Improvement suggestions</li>
            <li>• Detailed transcript review</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}