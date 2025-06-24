import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, BarChart3, Clock, TrendingUp, Star } from "lucide-react";
import type { ConversationWithReview } from "@shared/schema";

export default function Dashboard() {
  const { data: conversations, isLoading } = useQuery<ConversationWithReview[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const recentConversations = conversations?.slice(0, 3) || [];
  const completedConversations = conversations?.filter(c => c.status === "analyzed") || [];
  const averageRating = completedConversations.length > 0 
    ? completedConversations.reduce((sum, c) => sum + (c.review?.overallRating || 0), 0) / completedConversations.length
    : 0;

  return (
    <div className="min-h-screen bg-warm-brown-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-warm-brown-800 mb-2">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
          </h1>
          <p className="text-warm-brown-600">
            Ready to practice and improve your conversation skills?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-coral-100 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-coral-500" />
                </div>
                <div>
                  <p className="text-sm text-warm-brown-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-warm-brown-800">
                    {conversations?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-sage-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-sage-500" />
                </div>
                <div>
                  <p className="text-sm text-warm-brown-600">Completed</p>
                  <p className="text-2xl font-bold text-warm-brown-800">
                    {completedConversations.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-warm-brown-200 rounded-lg">
                  <Star className="w-6 h-6 text-warm-brown-600" />
                </div>
                <div>
                  <p className="text-sm text-warm-brown-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-warm-brown-800">
                    {averageRating > 0 ? averageRating.toFixed(1) : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-coral-100 rounded-lg">
                  <Clock className="w-6 h-6 text-coral-500" />
                </div>
                <div>
                  <p className="text-sm text-warm-brown-600">Practice Time</p>
                  <p className="text-2xl font-bold text-warm-brown-800">
                    {(conversations?.length || 0) * 5}m
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-warm-brown-800">Quick Actions</CardTitle>
                <CardDescription>Start practicing or review your progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/conversation">
                  <Button className="w-full bg-coral-500 hover:bg-coral-600 text-white">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Start New Conversation
                  </Button>
                </Link>
                
                <Link href="/history">
                  <Button variant="outline" className="w-full border-warm-brown-200 text-warm-brown-700 hover:bg-warm-brown-50">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View All Sessions
                  </Button>
                </Link>

                <div className="pt-4 border-t border-warm-brown-200">
                  <h4 className="font-medium text-warm-brown-800 mb-2">Today's Focus</h4>
                  <p className="text-sm text-warm-brown-600">
                    Practice active listening and asking follow-up questions to keep conversations flowing naturally.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Conversations */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-warm-brown-800">Recent Conversations</CardTitle>
                <CardDescription>Your latest practice sessions and feedback</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 border border-warm-brown-200 rounded-lg">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                ) : recentConversations.length > 0 ? (
                  <div className="space-y-4">
                    {recentConversations.map((conversation) => (
                      <Link 
                        key={conversation.id} 
                        href={`/conversation/${conversation.id}`}
                        className="block hover:bg-warm-brown-50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-4 p-4 border border-warm-brown-200 rounded-lg">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-coral-100 rounded-full flex items-center justify-center">
                              <MessageCircle className="w-5 h-5 text-coral-500" />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-warm-brown-800">
                              Weekend Conversation Practice
                            </p>
                            <p className="text-sm text-warm-brown-500">
                              {new Date(conversation.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {conversation.review?.overallRating && (
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-coral-500 fill-current" />
                                <span className="text-sm font-medium text-warm-brown-700">
                                  {conversation.review.overallRating}
                                </span>
                              </div>
                            )}
                            <Badge 
                              variant={conversation.status === "analyzed" ? "default" : "secondary"}
                              className={conversation.status === "analyzed" ? "bg-sage-100 text-sage-700" : ""}
                            >
                              {conversation.status === "analyzed" ? "Reviewed" : conversation.status}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-warm-brown-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-warm-brown-800 mb-2">
                      No conversations yet
                    </h3>
                    <p className="text-warm-brown-600 mb-4">
                      Start your first practice session to begin improving your conversation skills.
                    </p>
                    <Link href="/conversation">
                      <Button className="bg-coral-500 hover:bg-coral-600 text-white">
                        Start Your First Conversation
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Progress Insights */}
        {completedConversations.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-warm-brown-800">Progress Insights</CardTitle>
              <CardDescription>See how you're improving over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-sage-500" />
                  </div>
                  <h4 className="font-medium text-warm-brown-800 mb-2">Improving Trend</h4>
                  <p className="text-sm text-warm-brown-600">
                    Your conversation ratings show consistent improvement over time.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-coral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-coral-500" />
                  </div>
                  <h4 className="font-medium text-warm-brown-800 mb-2">Active Engagement</h4>
                  <p className="text-sm text-warm-brown-600">
                    You're consistently engaging in meaningful conversations.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-warm-brown-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-warm-brown-600" />
                  </div>
                  <h4 className="font-medium text-warm-brown-800 mb-2">Quality Focus</h4>
                  <p className="text-sm text-warm-brown-600">
                    Your conversations demonstrate strong storytelling and detail sharing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
