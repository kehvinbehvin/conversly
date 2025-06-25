import { cn } from "@/lib/utils";
import { User, Bot, MessageSquare } from "lucide-react";
import type { TranscriptWithReview } from "@shared/schema";

interface ChatMessageProps {
  message: TranscriptWithReview;
  timestamp?: string;
}

export default function ChatMessage({ message, timestamp }: ChatMessageProps) {
  // Add null check for message
  if (!message) {
    return null;
  }
  
  const isAgent = message.role === "agent";
  const hasReview = message.review && typeof message.review === 'string' && message.review.trim() !== "";

  return (
    <div className="space-y-3 w-full">
      {/* Main conversation message */}
      <div className={cn(
        "flex w-full",
        isAgent ? "justify-start" : "justify-end"
      )}>
        <div className={cn(
          "flex items-start space-x-3 max-w-[70%] sm:max-w-[80%] md:max-w-[70%] lg:max-w-[60%]",
          isAgent ? "flex-row" : "flex-row-reverse space-x-reverse"
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
            "px-4 py-3 rounded-lg shadow-sm",
            isAgent 
              ? "bg-sage-50 text-sage-800 rounded-tl-none border border-sage-200" 
              : "bg-coral-500 text-white rounded-tr-none"
          )}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.message || 'No message content'}
            </p>
            {timestamp && (
              <p className={cn(
                "text-xs mt-2 opacity-75",
                isAgent ? "text-sage-500" : "text-coral-100"
              )}>
                {timestamp}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Review message (if exists) - Always align right */}
      {hasReview && (
        <div className="flex justify-end w-full">
          <div className="flex items-start space-x-3 max-w-[75%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[65%] flex-row-reverse space-x-reverse">
            {/* Review icon */}
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-warm-brown-100 text-warm-brown-600 flex items-center justify-center">
              <MessageSquare className="w-3 h-3" />
            </div>

            {/* Review bubble */}
            <div className="px-3 py-2 rounded-lg bg-warm-brown-50 border border-warm-brown-200 rounded-tr-none shadow-sm">
              <p className="text-xs font-medium text-warm-brown-600 mb-1">
                Review
              </p>
              <p className="text-sm text-warm-brown-700 leading-relaxed break-words">
                {message.review}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}