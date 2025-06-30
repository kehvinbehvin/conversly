import { useState, useEffect } from "react";

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
  isConnected,
}: SpeakingDetectionOptions): SpeakingStatus {
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  useEffect(() => {
    if (!isConnected || !conversation) {
      setIsAgentSpeaking(false);
      setIsUserSpeaking(false);
      return;
    }

    let interval: NodeJS.Timeout;

    const pollMicActivity = async () => {
      try {
        // Agent speaking status
        setIsAgentSpeaking(conversation.isSpeaking || false);

        // User speaking detection
        const volume = await conversation.getInputVolume?.();
        const freqData = await conversation.getInputByteFrequencyData?.();

        if (typeof volume === "number" && freqData && freqData.length) {
          const hasVolume = volume > 0.1;
          const voiceBinStart = 2; // adjust based on FFT and sampleRate
          const voiceBinEnd = 10;
          const voiceEnergy = freqData
            .slice(voiceBinStart, voiceBinEnd)
            .reduce((sum: number, val: number) => sum + val, 0);

          const hasVoice = voiceEnergy > 100;
          setIsUserSpeaking(hasVolume && hasVoice);
        } else {
          setIsUserSpeaking(false);
        }
      } catch (err) {
        console.warn("⚠️ Mic activity polling error:", err);
        setIsUserSpeaking(false);
      }
    };

    interval = setInterval(pollMicActivity, 100);

    return () => {
      clearInterval(interval);
    };
  }, [isConnected, conversation]);

  return {
    isAgentSpeaking,
    isUserSpeaking,
  };
}
