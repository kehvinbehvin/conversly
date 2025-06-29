import { useState, useEffect } from 'react';

interface SpeakingDetectionOptions {
  conversation: any; // ElevenLabs conversation object
  isConnected: boolean;
}

interface SpeakingStatus {
  isAgentSpeaking: boolean;
  isUserSpeaking: boolean;
}

export function useSpeakingDetection({
  conversation,
  isConnected
}: SpeakingDetectionOptions): SpeakingStatus {
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  // Test if polling is required by examining SDK behavior
  useEffect(() => {
    if (!isConnected || !conversation) {
      setIsAgentSpeaking(false);
      setIsUserSpeaking(false);
      return;
    }

    // Test the SDK methods to understand their behavior
    console.log('🔍 Testing ElevenLabs SDK methods availability:');
    console.log('- getInputVolume available:', typeof conversation.getInputVolume);
    console.log('- getInputByteFrequencyData available:', typeof conversation.getInputByteFrequencyData);
    console.log('- isSpeaking available:', typeof conversation.isSpeaking);
    
    if (conversation.getInputVolume) {
      console.log('- Current input volume:', conversation.getInputVolume());
    }
    
    if (conversation.getInputByteFrequencyData) {
      const freqData = conversation.getInputByteFrequencyData();
      console.log('- Frequency data type:', freqData?.constructor?.name);
      console.log('- Frequency data length:', freqData?.length);
    }

  }, [isConnected, conversation]);

  // For now, use existing agent speaking detection
  // We'll determine user speaking approach after validating SDK behavior
  useEffect(() => {
    if (isConnected && conversation) {
      setIsAgentSpeaking(conversation.isSpeaking || false);
      
      // Temporary user speaking detection logic (to be refined)
      if (conversation.getInputVolume && conversation.getInputByteFrequencyData) {
        try {
          const volume = conversation.getInputVolume();
          const freqData = conversation.getInputByteFrequencyData();
          
          if (volume !== undefined && freqData) {
            const hasVolume = volume > 0.1;
            const voiceEnergy = freqData.slice(2, 10).reduce((sum: number, val: number) => sum + val, 0);
            const hasVoiceFrequency = voiceEnergy > 100;
            
            setIsUserSpeaking(hasVolume && hasVoiceFrequency);
          }
        } catch (error) {
          console.warn('Audio analysis error:', error);
          setIsUserSpeaking(false);
        }
      }
    }
  });

  return {
    isAgentSpeaking,
    isUserSpeaking
  };
}