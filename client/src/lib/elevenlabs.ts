export interface ElevenLabsWidgetConfig {
  agentId: string;
  onConversationEnd?: (conversationId: string) => void;
  onError?: (error: Error) => void;
}

declare global {
  interface Window {
    ElevenLabs?: {
      initialize: (config: any) => void;
      startConversation: () => Promise<string>;
      endConversation: () => void;
    };
  }
}

export class ElevenLabsService {
  private static instance: ElevenLabsService;
  private isInitialized = false;
  private currentConversationId: string | null = null;

  static getInstance(): ElevenLabsService {
    if (!ElevenLabsService.instance) {
      ElevenLabsService.instance = new ElevenLabsService();
    }
    return ElevenLabsService.instance;
  }

  async initialize(config: ElevenLabsWidgetConfig): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load ElevenLabs SDK
      await this.loadSDK();
      
      // Initialize the widget
      if (window.ElevenLabs) {
        window.ElevenLabs.initialize({
          agentId: config.agentId,
          onConversationEnd: (conversationId: string) => {
            this.currentConversationId = null;
            config.onConversationEnd?.(conversationId);
          },
          onError: config.onError
        });
        
        this.isInitialized = true;
      }
    } catch (error) {
      console.error("Failed to initialize ElevenLabs:", error);
      throw error;
    }
  }

  private async loadSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.ElevenLabs) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://elevenlabs.io/conversational-ai/widget.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load ElevenLabs SDK'));
      document.head.appendChild(script);
    });
  }

  async startConversation(): Promise<string> {
    if (!this.isInitialized || !window.ElevenLabs) {
      throw new Error("ElevenLabs not initialized");
    }

    try {
      this.currentConversationId = await window.ElevenLabs.startConversation();
      return this.currentConversationId;
    } catch (error) {
      console.error("Failed to start conversation:", error);
      throw error;
    }
  }

  endConversation(): void {
    if (window.ElevenLabs && this.currentConversationId) {
      window.ElevenLabs.endConversation();
      this.currentConversationId = null;
    }
  }

  getCurrentConversationId(): string | null {
    return this.currentConversationId;
  }

  // Mock implementation for development/testing
  async mockStartConversation(): Promise<string> {
    const mockId = `mock_${Date.now()}`;
    this.currentConversationId = mockId;
    
    // Simulate a 5-minute conversation
    setTimeout(() => {
      this.simulateConversationEnd(mockId);
    }, 300000); // 5 minutes
    
    return mockId;
  }

  private simulateConversationEnd(conversationId: string): void {
    // Simulate webhook call to our backend
    fetch('/api/webhook/elevenlabs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        transcript: `AI Coach: Hi! I'm excited to practice with you today. How was your weekend? I'd love to hear about what you did.

User: It was really good! I went hiking with some friends on Saturday. We found this amazing trail that I'd never been on before. It was about a 5-mile loop through the mountains, and the views were incredible.

AI Coach: That sounds wonderful! What made this trail special compared to others you've hiked?

User: Well, it had these really unique rock formations that looked almost like natural sculptures. And there were these little waterfalls every mile or so. My friend Sarah, who's been hiking for years, said she'd never seen anything quite like it. We ended up taking so many photos.

AI Coach: It sounds like you had a great group dynamic too. How did everyone handle the 5-mile distance?

User: Actually, that was one of the best parts. We had people with different fitness levels, but everyone was really supportive. When someone needed a break, we all just enjoyed the scenery together. No one felt rushed or left behind.

AI Coach: That's fantastic - it really shows how much the company you keep can enhance an experience. Did you do anything else over the weekend?

User: Sunday was more low-key. I caught up on some reading and did meal prep for the week. Oh, and I video called my parents to tell them about the hike. They loved hearing about it.

AI Coach: It sounds like you had a perfect balance of adventure and relaxation. Thank you for sharing - your enthusiasm really came through!`,
        audio_url: "https://example.com/mock-audio.mp3"
      })
    });
    
    this.currentConversationId = null;
  }
}

export const elevenLabsService = ElevenLabsService.getInstance();
