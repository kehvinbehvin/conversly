import { useState, useEffect, useRef } from 'react';

interface SpeakingDetectionOptions {
  conversation: any; // ElevenLabs conversation object
  isConnected: boolean;
  pollingInterval?: number;
}

interface SpeakingStatus {
  isAgentSpeaking: boolean;
  isUserSpeaking: boolean;
}

export function useSpeakingDetection({
  conversation,
  isConnected,
  pollingInterval = 200
}: SpeakingDetectionOptions): SpeakingStatus {
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isConnected || !conversation) {
      setIsAgentSpeaking(false);
      setIsUserSpeaking(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start polling for both agent and user speaking status
    intervalRef.current = setInterval(() => {
      try {
        // Agent speaking detection (existing ElevenLabs SDK)
        const agentSpeaking = conversation.isSpeaking || false;
        setIsAgentSpeaking(agentSpeaking);

        // User speaking detection using microphone input analysis
        let userSpeaking = false;
        
        if (conversation.getInputVolume && conversation.getInputByteFrequencyData) {
          const volume = conversation.getInputVolume();
          const freqData = conversation.getInputByteFrequencyData();
          
          if (volume !== undefined && freqData) {
            // Volume threshold check (0.1 = threshold from requirements)
            const hasVolume = volume > 0.1;
            
            // Voice frequency analysis (slice 2-10 for voice range)
            const voiceEnergy = freqData.slice(2, 10).reduce((sum: number, val: number) => sum + val, 0);
            const hasVoiceFrequency = voiceEnergy > 100;
            
            // User is speaking if both volume and voice frequency detected
            userSpeaking = hasVolume && hasVoiceFrequency;
            
            // Debug logging for tuning (as suggested in requirements)
            if (hasVolume || hasVoiceFrequency) {
              console.log('🎤 User audio analysis:', {
                volume: volume.toFixed(3),
                voiceEnergy,
                totalFreqEnergy: freqData.reduce((a: number, b: number) => a + b, 0),
                isUserSpeaking: userSpeaking
              });
            }
          }
        }
        
        setIsUserSpeaking(userSpeaking);

      } catch (error) {
        // Default to false positive (better to detect noise than miss speech)
        console.warn('Audio analysis error:', error);
        setIsUserSpeaking(false);
      }
    }, pollingInterval);

    // Cleanup interval on unmount or dependency changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isConnected, conversation, pollingInterval]);

  return {
    isAgentSpeaking,
    isUserSpeaking
  };
}