import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ChatThread from "@/components/ChatThread";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { ConversationWithReview, TranscriptWithReview } from "@shared/schema";

export default function ConversationDetail({ id }: { id: string }) {
  const { data: conversation, isLoading, error } = useQuery<ConversationWithReview>({
    queryKey: [`/api/conversations/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-brown-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid lg:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="min-h-screen bg-warm-brown-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-warm-brown-800 mb-2">
                Conversation Not Found
              </h2>
              <p className="text-warm-brown-600 mb-4">
                The conversation you're looking for doesn't exist or couldn't be loaded.
              </p>
              <Link href="/dashboard">
                <Button>Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (conversation.status !== "completed" || !conversation.review) {
    return (
      <div className="min-h-screen bg-warm-brown-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-warm-brown-800 mb-2">
                Processing Your Conversation
              </h2>
              <p className="text-warm-brown-600 mb-4">
                We're analyzing your conversation and generating feedback. This usually takes a few moments.
              </p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const review = conversation.review;
  const transcriptWithReviews = Array.isArray(review.transcriptWithReviews)
    ? (review.transcriptWithReviews as TranscriptWithReview[])
    : [];

  return (
    <div className="min-h-screen bg-warm-brown-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-warm-brown-800 mb-2">
                Conversation Review
              </h1>
              <p className="text-warm-brown-600">
                {new Date(conversation.createdAt).toLocaleDateString()} • Practice Session
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {review?.overallRating && (
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-coral-500 fill-current" />
                  <span className="text-xl font-bold text-warm-brown-800">
                    {review.overallRating}/5
                  </span>
                </div>
              )}
              <Badge
                variant={conversation.status === "completed" ? "default" : "secondary"}
                className={conversation.status === "completed" ? "bg-sage-100 text-sage-700" : ""}
              >
                {conversation.status === "completed" ? "Analysis Complete" : conversation.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          <ErrorBoundary>
            <ChatThread messages={transcriptWithReviews} className="lg:col-span-2" />
          </ErrorBoundary>

          {/* Review Summary */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-sage-500" />
                  <span>Overall Assessment</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-warm-brown-700 leading-relaxed text-sm">{review.summary}</p>
              </CardContent>
            </Card>

            {/* Action Items */}
            <Card className="bg-coral-50 border-coral-200">
              <CardContent className="p-4 lg:p-6">
                <h3 className="font-semibold text-warm-brown-800 mb-3">
                  Ready for Your Next Session?
                </h3>
                <p className="text-warm-brown-600 mb-4 text-sm">
                  Practice makes perfect. Keep building your conversation skills with another session.
                </p>
                <Link href="/conversation">
                  <Button className="bg-coral-500 hover:bg-coral-600 text-white w-full lg:w-auto">
                    Start New Conversation
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
