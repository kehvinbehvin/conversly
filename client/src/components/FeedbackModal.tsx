import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { FeedbackForm } from "./FeedbackForm";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-heading-2 text-warm-brown-800">
              Share Your Feedback
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
          <p className="text-body-md text-warm-brown-600 text-left mt-2">
            Help us improve Conversly by sharing your thoughts, suggestions, or any issues you encountered. 
            Your feedback helps us create a better conversation practice experience.
          </p>
        </DialogHeader>
        
        <div className="mt-6">
          <FeedbackForm onSuccess={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}