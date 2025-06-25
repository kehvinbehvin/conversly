import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Star, TrendingUp, CheckCircle, AlertCircle, Clock } from "lucide-react";
import InlineHighlighter from "@/components/InlineHighlighter";
import type { ConversationWithReview, ReviewHighlight, ReviewSuggestion, ReviewStrength, Improvement } from "@shared/schema";

export default function Review() {
  const { id } = useParams();
  
  const { data: conversation, isLoading, error } = useQuery<ConversationWithReview>({
    queryKey: [`/api/conversations/${id}`],
    enabled: !!id,
  });

  const { data: improvements } = useQuery<Improvement[]>({
    queryKey: [`/api/reviews/${conversation?.review?.id}/improvements`],
    enabled: !!conversation?.review?.id,
  });

  // Fetch transcript separately since it's not included in conversation response
  const { data: transcript } = useQuery({
    queryKey: [`/api/transcripts/${conversation?.transcriptId}`],
    enabled: !!conversation?.transcriptId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-brown-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid gap-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
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

  const review = conversation.review;
  
  // Group improvements by type for better display
  const positiveImprovements = improvements?.filter(imp => imp.improvementType === 'positive') || [];
  const improvementSuggestions = improvements?.filter(imp => imp.improvementType === 'improvement') || [];
  const neutralImprovements = improvements?.filter(imp => imp.improvementType === 'neutral') || [];
  
  // Legacy highlights and suggestions (fallback if no improvements)
  const highlights = (review?.highlights as ReviewHighlight[]) || [];
  const suggestions = (review?.suggestions as ReviewSuggestion[]) || [];
  const strengths = (review?.strengths as ReviewStrength[]) || [];

  return (
    <div className="min-h-screen bg-warm-brown-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                {new Date(conversation.createdAt).toLocaleDateString()} • Weekend Practice Session
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
                variant={conversation.status === "analyzed" || conversation.status === "completed" ? "default" : "secondary"}
                className={conversation.status === "analyzed" || conversation.status === "completed" ? "bg-sage-100 text-sage-700" : ""}
              >
                {conversation.status === "analyzed" || conversation.status === "completed" ? "Analysis Complete" : conversation.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Review Summary */}
        {review ? (
          <div className="space-y-6">
            {/* Overall Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-sage-500" />
                  <span>Overall Assessment</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-warm-brown-700 leading-relaxed">
                  {review.summary}
                </p>
              </CardContent>
            </Card>

            {/* Transcript with Inline Feedback */}
            {transcript?.content && improvements && improvements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Transcript with Interactive Feedback</CardTitle>
                  <p className="text-sm text-warm-brown-600">
                    Click on highlighted sections to see detailed feedback
                  </p>
                </CardHeader>
                <CardContent>
                  <InlineHighlighter 
                    content={transcript.content}
                    improvements={improvements}
                    className="text-warm-brown-700 leading-relaxed"
                  />
                </CardContent>
              </Card>
            )}

            {/* Improvement Summary Cards */}
            {improvements && improvements.length > 0 && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Strengths */}
                {positiveImprovements.length > 0 && (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-green-800">
                        <TrendingUp className="w-5 h-5" />
                        <span>What You Did Well</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {positiveImprovements.map((improvement) => (
                          <div key={improvement.id} className="p-3 bg-white rounded-lg border border-green-200">
                            <div className="flex items-center justify-between mb-2">
                              {improvement.category && (
                                <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                                  {improvement.category}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-green-800">
                              {improvement.feedbackText}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Areas for Improvement */}
                {improvementSuggestions.length > 0 && (
                  <Card className="border-coral-200 bg-coral-50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-coral-800">
                        <CheckCircle className="w-5 h-5" />
                        <span>Areas to Improve</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {improvementSuggestions.map((improvement) => (
                          <div key={improvement.id} className="p-3 bg-white rounded-lg border border-coral-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {improvement.category && (
                                  <Badge variant="outline" className="text-xs text-coral-700 border-coral-300">
                                    {improvement.category}
                                  </Badge>
                                )}
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    improvement.priority === "high" 
                                      ? "border-red-500 text-red-700" 
                                      : improvement.priority === "medium"
                                      ? "border-yellow-500 text-yellow-700"
                                      : "border-blue-500 text-blue-700"
                                  }`}
                                >
                                  {improvement.priority}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-coral-800">
                              {improvement.feedbackText}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Highlights and Feedback */}
            {highlights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Conversation Highlights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {highlights.map((highlight, index) => (
                      <div 
                        key={index} 
                        className={`p-4 rounded-lg border-l-4 ${
                          highlight.type === "positive" 
                            ? "bg-sage-50 border-sage-500" 
                            : highlight.type === "improvement"
                            ? "bg-coral-50 border-coral-500"
                            : "bg-warm-brown-50 border-warm-brown-400"
                        }`}
                      >
                        <blockquote className="text-warm-brown-800 font-medium mb-2 italic">
                          "{highlight.text}"
                        </blockquote>
                        <p className="text-warm-brown-600 text-sm">
                          <span className={`font-medium ${
                            highlight.type === "positive" 
                              ? "text-sage-600" 
                              : highlight.type === "improvement"
                              ? "text-coral-600"
                              : "text-warm-brown-600"
                          }`}>
                            {highlight.type === "positive" 
                              ? "Great moment:" 
                              : highlight.type === "improvement"
                              ? "Try this:"
                              : "Note:"}
                          </span> {highlight.feedback}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Strengths */}
              {strengths.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-sage-700">
                      <TrendingUp className="w-5 h-5" />
                      <span>Your Strengths</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {strengths.map((strength, index) => (
                        <div key={index} className="space-y-2">
                          <h4 className="font-medium text-warm-brown-800">
                            {strength.category}
                          </h4>
                          <p className="text-sm text-warm-brown-600">
                            {strength.description}
                          </p>
                          {strength.examples && strength.examples.length > 0 && (
                            <ul className="text-xs text-warm-brown-500 list-disc list-inside">
                              {strength.examples.map((example, i) => (
                                <li key={i}>{example}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-coral-700">
                      <CheckCircle className="w-5 h-5" />
                      <span>Improvement Areas</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {suggestions.map((suggestion, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-warm-brown-800">
                              {suggestion.category}
                            </h4>
                            <Badge 
                              variant="outline"
                              className={`text-xs ${
                                suggestion.priority === "high" 
                                  ? "border-coral-500 text-coral-700" 
                                  : suggestion.priority === "medium"
                                  ? "border-warm-brown-500 text-warm-brown-700"
                                  : "border-sage-500 text-sage-700"
                              }`}
                            >
                              {suggestion.priority} priority
                            </Badge>
                          </div>
                          <p className="text-sm text-warm-brown-600">
                            {suggestion.suggestion}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Action Items */}
            <Card className="bg-coral-50 border-coral-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-warm-brown-800 mb-4">
                  Ready for Your Next Session?
                </h3>
                <p className="text-warm-brown-600 mb-4">
                  Practice makes perfect! Use the insights from this review to improve your next conversation.
                </p>
                <div className="flex space-x-4">
                  <Link href="/conversation">
                    <Button className="bg-coral-500 hover:bg-coral-600 text-white">
                      Start Another Session
                    </Button>
                  </Link>
                  <Link href="/history">
                    <Button variant="outline" className="border-coral-300 text-coral-700">
                      View All Sessions
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // No review available yet
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="w-12 h-12 text-warm-brown-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-warm-brown-800 mb-2">
                Analysis in Progress
              </h2>
              <p className="text-warm-brown-600 mb-4">
                Your conversation is being analyzed. Please check back in a few moments for detailed feedback.
              </p>
              <Link href="/dashboard">
                <Button>Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
