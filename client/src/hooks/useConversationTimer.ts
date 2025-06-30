import { useState, useEffect, useRef, useCallback } from 'react';

interface UseConversationTimerProps {
  durationMs: number;
  onTimerExpired: () => void;
  isActive: boolean; // Timer only runs when conversation is active
}

interface ConversationTimerState {
  timeRemainingMs: number;
  isExpired: boolean;
  formattedTime: string;
}

export function useConversationTimer({
  durationMs,
  onTimerExpired,
  isActive,
}: UseConversationTimerProps): ConversationTimerState {
  const [timeRemainingMs, setTimeRemainingMs] = useState(durationMs);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasExpiredRef = useRef(false);

  // Format time as "4:32 remaining"
  const formatTime = useCallback((ms: number): string => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')} remaining`;
  }, []);

  // Reset timer when isActive changes from false to true
  useEffect(() => {
    if (isActive && !startTimeRef.current) {
      // Starting new timer
      startTimeRef.current = Date.now();
      setTimeRemainingMs(durationMs);
      setIsExpired(false);
      hasExpiredRef.current = false;
    } else if (!isActive) {
      // Reset timer state when not active
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startTimeRef.current = null;
      setTimeRemainingMs(durationMs);
      setIsExpired(false);
      hasExpiredRef.current = false;
    }
  }, [isActive, durationMs]);

  // Timer update effect
  useEffect(() => {
    if (!isActive || !startTimeRef.current) {
      return;
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Start new interval
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - (startTimeRef.current || now);
      const remaining = Math.max(0, durationMs - elapsed);

      setTimeRemainingMs(remaining);

      // Check if timer expired
      if (remaining <= 0 && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        setIsExpired(true);
        
        // Clear interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        // Call expiration callback
        onTimerExpired();
      }
    }, 100); // Update every 100ms for smooth countdown

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, durationMs, onTimerExpired]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    timeRemainingMs,
    isExpired,
    formattedTime: formatTime(timeRemainingMs),
  };
}