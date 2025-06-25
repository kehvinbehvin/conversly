import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Improvement } from '@shared/schema';

interface InlineHighlighterProps {
  content: string;
  improvements: Improvement[];
  className?: string;
}

interface HighlightSpan {
  start: number;
  end: number;
  improvement: Improvement;
}

export default function InlineHighlighter({ 
  content, 
  improvements, 
  className 
}: InlineHighlighterProps) {
  const [focusedImprovement, setFocusedImprovement] = useState<number | null>(null);

  // Create highlight spans from improvements
  const highlightSpans = useMemo(() => {
    return improvements
      .filter(imp => imp.transcriptSectionStart < content.length && imp.transcriptSectionEnd <= content.length)
      .map(improvement => ({
        start: improvement.transcriptSectionStart,
        end: improvement.transcriptSectionEnd,
        improvement
      }))
      .sort((a, b) => a.start - b.start);
  }, [improvements, content]);

  // Render content with inline highlighting
  const renderHighlightedContent = () => {
    if (highlightSpans.length === 0) {
      return <span>{content}</span>;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    highlightSpans.forEach((span, index) => {
      // Add text before highlight
      if (span.start > lastIndex) {
        parts.push(
          <span key={`text-${index}`}>
            {content.slice(lastIndex, span.start)}
          </span>
        );
      }

      // Add highlighted text
      const isPositive = span.improvement.improvementType === 'positive';
      const isImprovement = span.improvement.improvementType === 'improvement';
      const isFocused = focusedImprovement === span.improvement.id;

      parts.push(
        <span
          key={`highlight-${span.improvement.id}`}
          className={cn(
            "px-1 py-0.5 rounded cursor-pointer transition-all duration-200",
            isPositive && "bg-green-100 hover:bg-green-200 border-b-2 border-green-300",
            isImprovement && "bg-yellow-100 hover:bg-yellow-200 border-b-2 border-yellow-400",
            span.improvement.improvementType === 'neutral' && "bg-blue-100 hover:bg-blue-200 border-b-2 border-blue-300",
            isFocused && "ring-2 ring-offset-1 ring-blue-400"
          )}
          onClick={() => setFocusedImprovement(
            focusedImprovement === span.improvement.id ? null : span.improvement.id
          )}
          onMouseEnter={() => setFocusedImprovement(span.improvement.id)}
          onMouseLeave={() => setFocusedImprovement(null)}
          title={span.improvement.feedbackText}
        >
          {content.slice(span.start, span.end)}
        </span>
      );

      lastIndex = span.end;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key="text-end">
          {content.slice(lastIndex)}
        </span>
      );
    }

    return <>{parts}</>;
  };

  // Get the currently focused improvement
  const focusedImprovementData = improvements.find(imp => imp.id === focusedImprovement);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main content with highlighting */}
      <div className="prose max-w-none">
        <div className="text-warm-brown-700 leading-relaxed whitespace-pre-wrap">
          {renderHighlightedContent()}
        </div>
      </div>

      {/* Focused improvement details */}
      {focusedImprovementData && (
        <Card className="border-l-4 border-l-blue-400 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={focusedImprovementData.improvementType === 'positive' ? 'default' : 'secondary'}
                  className={cn(
                    focusedImprovementData.improvementType === 'positive' && "bg-green-100 text-green-700",
                    focusedImprovementData.improvementType === 'improvement' && "bg-yellow-100 text-yellow-700",
                    focusedImprovementData.improvementType === 'neutral' && "bg-blue-100 text-blue-700"
                  )}
                >
                  {focusedImprovementData.improvementType}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {focusedImprovementData.priority}
                </Badge>
                {focusedImprovementData.category && (
                  <Badge variant="outline" className="text-xs">
                    {focusedImprovementData.category}
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-sm text-warm-brown-700">
              {focusedImprovementData.feedbackText}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex items-center space-x-4 text-xs text-warm-brown-600">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
          <span>Strengths</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-yellow-100 border border-yellow-400 rounded"></div>
          <span>Improvements</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
          <span>Neutral</span>
        </div>
      </div>
    </div>
  );
}