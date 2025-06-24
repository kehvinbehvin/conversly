import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Star, Clock, Search, Calendar, BarChart3 } from "lucide-react";
import type { ConversationWithReview } from "@shared/schema";

export default function History() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: conversations, isLoading, refetch } = useQuery<ConversationWithReview[]>({
    queryKey: ["/api/conversations"],
    refetchInterval: 5000, // Refetch every 5 seconds to pick up new conversations
  });

  // Force refetch when component mounts to ensure fresh data
  useEffect(() => {
    refetch();
  }, [refetch]);

  const filteredConversations = conversations?.filter(conversation => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const date = new Date(conversation.createdAt).toLocaleDateString().toLowerCase();
    const status = conversation.status.toLowerCase();
    return date.includes(searchLower) || status.includes(searchLower);
  }) || [];

  const completedConversations = conversations?.filter(c => c.status === "analyzed") || [];
  const averageRating = completedConversations.length > 0 
    ? completedConversations.reduce((sum, c) => sum + (c.review?.overallRating || 0), 0) / completedConversations.length
    : 0;

  return (
    <div className="min-h-screen bg-warm-brown-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-warm-brown-800 mb-2">
            Conversation History
          </h1>
          <p className="text-warm-brown-600">
            Track your progress and review past conversation sessions
          </p>
        </div>

        {/* Stats Overview */}
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

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-warm-brown-400" />
                <Input
                  placeholder="Search by date or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex space-x-2">
                <Link href="/conversation">
                  <Button className="bg-coral-500 hover:bg-coral-600 text-white">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    New Session
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversations List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>All Sessions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border border-warm-brown-200 rounded-lg">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                ))}
              </div>
            ) : filteredConversations.length > 0 ? (
              <div className="space-y-4">
                {filteredConversations.map((conversation) => (
                  <div 
                    key={conversation.id} 
                    className="flex items-center space-x-4 p-4 border border-warm-brown-200 rounded-lg hover:bg-warm-brown-50 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-coral-100 rounded-lg flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-coral-500" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-warm-brown-800 mb-1">
                        Weekend Conversation Practice
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-warm-brown-500">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(conversation.createdAt).toLocaleDateString()}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>5 min session</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {conversation.review?.overallRating && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-coral-500 fill-current" />
                          <span className="text-sm font-medium text-warm-brown-700">
                            {conversation.review.overallRating}/5
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
                    
                    <div className="flex-shrink-0">
                      {conversation.status === "analyzed" ? (
                        <Link href={`/conversation/${conversation.id}`}>
                          <Button variant="outline" size="sm">
                            View Review
                          </Button>
                        </Link>
                      ) : (
                        <Button variant="outline" size="sm" disabled>
                          Processing...
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                {searchTerm ? (
                  <>
                    <Search className="w-12 h-12 text-warm-brown-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-warm-brown-800 mb-2">
                      No conversations found
                    </h3>
                    <p className="text-warm-brown-600 mb-4">
                      Try adjusting your search terms or clear the search to see all conversations.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setSearchTerm("")}
                    >
                      Clear Search
                    </Button>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-12 h-12 text-warm-brown-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-warm-brown-800 mb-2">
                      No conversations yet
                    </h3>
                    <p className="text-warm-brown-600 mb-4">
                      Start your first practice session to begin building your conversation history.
                    </p>
                    <Link href="/conversation">
                      <Button className="bg-coral-500 hover:bg-coral-600 text-white">
                        Start Your First Conversation
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats Footer */}
        {conversations && conversations.length > 0 && (
          <div className="mt-8 text-center text-warm-brown-500">
            <p>
              You've completed {conversations.length} conversation session{conversations.length !== 1 ? 's' : ''} 
              {' '}and practiced for a total of {conversations.length * 5} minutes. Keep it up!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
