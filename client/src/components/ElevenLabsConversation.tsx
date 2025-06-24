import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useConversation } from "@elevenlabs/react";
import { apiRequest } from "@/lib/queryClient";

interface ElevenLabsConversationProps {
  agentId: string;
  onConversationStart?: (conversationId: string) => void;
  onConversationEnd?: (conversationId: string) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

export default function ElevenLabsConversation({
  agentId,
  onConversationStart,
  onConversationEnd,
  onError,
  disabled = false,
}: ElevenLabsConversationProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  const conversation = useConversation({
    debug: true, // Enable debug mode for more detailed logs
    onConnect: (props: { conversationId: string }) => {
      console.log("✅ Connected to ElevenLabs conversation:", props);
      setIsConnecting(false);
      setCurrentConversationId(props.conversationId);
      // Call parent callback immediately since connection is stable
      onConversationStart?.(props.conversationId);
    },
    onDisconnect: (details: any) => {
      console.log("❌ Disconnected from ElevenLabs conversation:", details);
      
      setIsConnecting(false);
      setSignedUrl(null);
      
      // Clean up audio resources when disconnected
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      }
      if (audioContext) {
        audioContext.close();
        setAudioContext(null);
      }
      
      // Always end the conversation when disconnected - UI should reflect reality
      const conversationId = details?.conversationId || currentConversationId;
      if (conversationId) {
        onConversationEnd?.(conversationId);
      }
      setCurrentConversationId(null);
    },
    onError: (error: string) => {
      console.error("🔥 ElevenLabs conversation error:", error);
      setIsConnecting(false);
      setSignedUrl(null);

      // Clean up audio resources on error
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
        setAudioStream(null);
      }
      if (audioContext) {
        audioContext.close();
        setAudioContext(null);
      }

      onError?.(new Error(error));
    },
    onMessage: (props: { message: string; source: string }) => {
      console.log("📝 ElevenLabs message:", props);
    },
    onModeChange: (mode: any) => {
      console.log("🔄 Mode changed:", mode);
    },
    onStatusChange: (status: any) => {
      console.log("📊 Status changed:", status);
    },
  });

  const initializeAudioContext = async (): Promise<boolean> => {
    try {
      // Create and resume audio context - keep it alive for the conversation
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        if (ctx.state === "suspended") {
          await ctx.resume();
          console.log("Audio context resumed");
        }
        console.log("Audio context state:", ctx.state);
        setAudioContext(ctx); // Store instead of closing immediately
      }
      return true;
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
      return false;
    }
  };

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Keep the stream alive for the entire conversation duration
      setAudioStream(stream);
      console.log("✅ Microphone permission granted and stream active");
      return true;
    } catch (error) {
      console.error("❌ Microphone permission denied:", error);
      return false;
    }
  };

  const startConversation = async () => {
    if (disabled || isConnecting) return;

    setIsConnecting(true);
    try {
      console.log("🎤 Requesting microphone permission...");
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        throw new Error(
          "Microphone permission is required for voice conversations. Please allow microphone access and try again.",
        );
      }

      console.log("🔊 Initializing audio context...");
      const audioInitialized = await initializeAudioContext();
      if (!audioInitialized) {
        console.warn(
          "⚠️ Audio context initialization failed, but continuing...",
        );
      }

      console.log("🌐 Generating signed URL...");
      const response = await apiRequest("POST", "/api/elevenlabs/signed-url", {
        agentId: agentId,
      });
      const data = await response.json();

      if (!data.signedUrl) {
        throw new Error("Failed to get signed URL");
      }

      console.log("📝 Received signed URL:", data.signedUrl);
      console.log("📊 Signed URL analysis:");
      console.log("- Length:", data.signedUrl.length);
      console.log("- Contains agent ID:", data.signedUrl.includes(agentId));
      console.log("- URL domain:", new URL(data.signedUrl).hostname);

      setSignedUrl(data.signedUrl);

      console.log("🚀 Starting conversation session...");
      const convoId = await conversation.startSession({
        signedUrl: data.signedUrl,
      });

      console.log("✅ Conversation started with ID:", convoId);
    } catch (error) {
      console.error("❌ Failed to start conversation:", error);
      setIsConnecting(false);
      setSignedUrl(null);
      onError?.(error as Error);
    }
  };

  const endConversation = async () => {
    try {
      console.log("🛑 Manually ending conversation...");
      if (conversation.status === "connected") {
        await conversation.endSession();
      }

      // Clean up audio resources
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
        setAudioStream(null);
      }
      if (audioContext) {
        audioContext.close();
        setAudioContext(null);
      }

      setSignedUrl(null);
      setIsConnecting(false);
    } catch (error) {
      console.error("❌ Failed to end conversation:", error);
    }
  };

  const isConnected = conversation.status === "connected";
  const isLoading = isConnecting || conversation.status === "connecting";

  // Log status changes for debugging
  useEffect(() => {
    console.log("📊 Conversation status:", conversation.status);
  }, [conversation.status]);

  return (
    <div className="flex flex-col items-center space-y-6">
      {!isConnected ? (
        <div className="text-center space-y-4">
          <Button
            onClick={startConversation}
            disabled={disabled || isLoading}
            size="lg"
            className="bg-coral-500 hover:bg-coral-600 text-white min-w-[200px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Start Voice Conversation
              </>
            )}
          </Button>

          <p className="text-xs text-warm-brown-500 max-w-sm">
            This will request microphone access to enable voice conversation
            with the AI coach.
          </p>

          {/* Debug info */}
          <div className="text-xs text-gray-400 mt-2">
            Status: {conversation.status}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-coral-500 rounded-full flex items-center justify-center mb-3 animate-pulse">
              <Mic className="h-8 w-8 text-white" />
            </div>
            <p className="text-sage-700 font-medium text-lg">
              Voice conversation active
            </p>
            <p className="text-sage-600 text-sm">
              Practice discussing your weekend plans
            </p>
          </div>

          <Button
            onClick={endConversation}
            variant="outline"
            size="lg"
            className="border-coral-300 text-coral-600 hover:bg-coral-50"
          >
            <MicOff className="mr-2 h-4 w-4" />
            End Conversation
          </Button>
        </div>
      )}
    </div>
  );
}
