import { cn } from "@/lib/utils";
import { User, Bot, MessageSquare } from "lucide-react";
import type { TranscriptWithReview } from "@shared/schema";

interface ChatMessageProps {
  message: TranscriptWithReview;
  timestamp?: string;
}

export default function ChatMessage({ message, timestamp }: ChatMessageProps) {
  const isAgent = message.role === "agent";
  const hasReview = message.review && message.review.trim() !== "";

  return (
    <div className="space-y-3">
      {/* Main conversation message */}
      <div className={cn(
        "flex items-start space-x-3",
        isAgent ? "justify-start" : "justify-end flex-row-reverse space-x-reverse"
      )}>
        {/* Avatar */}
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isAgent 
            ? "bg-sage-100 text-sage-600" 
            : "bg-coral-100 text-coral-600"
        )}>
          {isAgent ? (
            <Bot className="w-4 h-4" />
          ) : (
            <User className="w-4 h-4" />
          )}
        </div>

        {/* Message bubble */}
        <div className={cn(
          "max-w-sm px-4 py-2 rounded-lg",
          isAgent 
            ? "bg-sage-50 text-sage-800 rounded-tl-none border border-sage-200" 
            : "bg-coral-500 text-white rounded-tr-none"
        )}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.message}
          </p>
          {timestamp && (
            <p className={cn(
              "text-xs mt-1",
              isAgent ? "text-sage-500" : "text-coral-100"
            )}>
              {timestamp}
            </p>
          )}
        </div>
      </div>

      {/* Review message (if exists) */}
      {hasReview && (
        <div className="flex items-start space-x-3 ml-11">
          {/* Review icon */}
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-warm-brown-100 text-warm-brown-600 flex items-center justify-center">
            <MessageSquare className="w-3 h-3" />
          </div>

          {/* Review bubble */}
          <div className="max-w-md px-3 py-2 rounded-lg bg-warm-brown-50 border border-warm-brown-200 rounded-tl-none">
            <p className="text-xs font-medium text-warm-brown-600 mb-1">
              Review
            </p>
            <p className="text-sm text-warm-brown-700 leading-relaxed">
              {message.review}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}