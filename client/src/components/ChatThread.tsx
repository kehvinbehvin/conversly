import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Clock } from "lucide-react";
import ChatMessage from "./ChatMessage";
import type { TranscriptWithReview } from "@shared/schema";

interface ChatThreadProps {
  messages: TranscriptWithReview[];
  className?: string;
}

export default function ChatThread({ messages, className }: ChatThreadProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const formatTimestamp = (timeInSecs: number | undefined) => {
    if (typeof timeInSecs !== 'number' || isNaN(timeInSecs)) {
      return '0:00';
    }
    const minutes = Math.floor(timeInSecs / 60);
    const seconds = Math.floor(timeInSecs % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-warm-brown-600" />
            <span>Conversation Thread</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-warm-brown-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-warm-brown-300" />
            <p>No conversation messages available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-warm-brown-600" />
            <span className="text-lg">Conversation Thread</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-warm-brown-500">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">{messages.length} messages</span>
            <span className="sm:hidden">{messages.length}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-96 overflow-y-auto px-4 sm:px-6 pb-6" ref={scrollAreaRef}>
          <div className="space-y-4 sm:space-y-6">
            {messages.map((message, index) => {
              if (!message || typeof message !== 'object') {
                return null;
              }
              return (
                <ChatMessage
                  key={`message-${index}`}
                  message={message}
                  timestamp={formatTimestamp(message.time_in_call_secs)}
                />
              );
            })}
            <div ref={bottomRef} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}