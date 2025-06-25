import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, X } from "lucide-react";
import { Link } from "wouter";

interface ConversationEndModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string | null;
}

export default function ConversationEndModal({ 
  isOpen, 
  onClose, 
  conversationId 
}: ConversationEndModalProps) {
  const [showCTA, setShowCTA] = useState(false);

  // Poll for conversation existence using conversationId from ElevenLabs
  const { data: conversations } = useQuery<ConversationWithReview[]>({
    queryKey: ['/api/conversations'],
    enabled: !!conversationId && isOpen && !showCTA,
    refetchInterval: 1000, // Poll every second
    retry: true,
  });

  // Find conversation by ElevenLabs ID
  const conversation = conversations?.find((conv) => 
    conv.elevenlabsConversationId === conversationId
  );

  // Switch to CTA only when conversation is complete with review
  useEffect(() => {
    if (conversation && conversation.status === 'completed' && conversation.review && !showCTA) {
      setShowCTA(true);
    }
  }, [conversation, showCTA]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowCTA(false);
    }
  }, [isOpen]);

  if (!conversationId) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-warm-brown-800">
              Conversation Complete
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-6">
          {!showCTA ? (
            // Processing State
            <>
              <div className="flex items-center justify-center w-16 h-16 bg-sage-100 rounded-full">
                <Loader2 className="w-8 h-8 text-sage-600 animate-spin" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium text-warm-brown-800">
                  Processing conversation...
                </h3>
                <p className="text-sm text-warm-brown-600">
                  We're saving your conversation and preparing your review.
                </p>
              </div>
            </>
          ) : (
            // Ready State
            <>
              <div className="flex items-center justify-center w-16 h-16 bg-sage-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-sage-600" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium text-warm-brown-800">
                  Ready for Review!
                </h3>
                <p className="text-sm text-warm-brown-600">
                  Your conversation has been saved. View the chat thread and track your review progress.
                </p>
              </div>
              
              <div className="flex flex-col w-full space-y-3">
                <Link href={`/conversation/${conversation?.id}`}>
                  <Button 
                    className="w-full bg-coral-500 hover:bg-coral-600 text-white"
                    onClick={onClose}
                  >
                    View Conversation
                  </Button>
                </Link>
                
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="w-full"
                >
                  Continue on Dashboard
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}