import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { FeedbackForm } from "./FeedbackForm";
import { trackFeedbackModalOpened } from "@/lib/gtm";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: number;
}

export function FeedbackModal({ isOpen, onClose, conversationId }: FeedbackModalProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Track modal opening
  useEffect(() => {
    if (isOpen) {
      trackFeedbackModalOpened('review_page');
      console.log('FeedbackModal: Opening with conversationId =', conversationId);
    }
  }, [isOpen, conversationId]);



  const handleSubmissionChange = (submitted: boolean) => {
    setIsSubmitted(submitted);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full max-w-none max-h-none m-0 rounded-none sm:w-auto sm:h-auto sm:max-w-2xl sm:max-h-[90vh] sm:m-auto sm:rounded-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Feedback Form</DialogTitle>
          <div className="flex justify-end">
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
        <FeedbackForm conversationId={conversationId} onSubmissionChange={handleSubmissionChange} />
      </DialogContent>
    </Dialog>
  );
}