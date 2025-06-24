import { TranscriptData } from './fileStore.js';

export interface ReplitObjectStorageConfig {
  bucketId: string;
}

export class ReplitObjectStorage {
  private bucketId: string;

  constructor(config: ReplitObjectStorageConfig) {
    this.bucketId = config.bucketId;
  }

  private getKey(elevenlabsId: string): string {
    return `transcripts/transcript_${elevenlabsId}.json`;
  }

  async saveTranscript(data: TranscriptData): Promise<string> {
    const key = this.getKey(data.elevenlabsId);
    
    try {
      // Use Replit's built-in object storage without external authentication
      const response = await fetch(`https://kv.replit.com/${this.bucketId}/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data, null, 2),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save to Replit Object Storage: ${response.status} ${response.statusText} - ${errorText}`);
      }

      console.log(`☁️ Transcript saved to Replit Object Storage: ${this.bucketId}/${key}`);
      return `replit://${this.bucketId}/${key}`;
    } catch (error) {
      console.error('Failed to save transcript to Replit Object Storage:', error);
      // Fall back to local storage if cloud storage fails
      throw error;
    }
  }

  async getTranscript(elevenlabsId: string): Promise<TranscriptData | null> {
    const key = this.getKey(elevenlabsId);
    
    try {
      const response = await fetch(`https://kv.replit.com/${this.bucketId}/${encodeURIComponent(key)}`);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to get from Replit Object Storage: ${response.status} ${response.statusText}`);
      }

      const content = await response.text();
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to get transcript from Replit Object Storage:', error);
      return null;
    }
  }

  async listTranscripts(): Promise<string[]> {
    try {
      const response = await fetch(`https://kv.replit.com/${this.bucketId}?prefix=transcripts/`);
      
      if (!response.ok) {
        throw new Error(`Failed to list from Replit Object Storage: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.keys) {
        return [];
      }

      return data.keys
        .filter((key: string) => key.endsWith('.json'))
        .sort((a: string, b: string) => b.localeCompare(a)); // Sort by newest first
    } catch (error) {
      console.error('Failed to list transcripts from Replit Object Storage:', error);
      return [];
    }
  }

  async deleteTranscript(elevenlabsId: string): Promise<boolean> {
    const key = this.getKey(elevenlabsId);
    
    try {
      const response = await fetch(`https://kv.replit.com/${this.bucketId}/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });

      if (response.status === 404) {
        return false; // Already deleted or doesn't exist
      }

      if (!response.ok) {
        throw new Error(`Failed to delete from Replit Object Storage: ${response.status} ${response.statusText}`);
      }

      console.log(`🗑️ Transcript deleted from Replit Object Storage: ${this.bucketId}/${key}`);
      return true;
    } catch (error) {
      console.error('Failed to delete transcript from Replit Object Storage:', error);
      return false;
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // Return the Replit KV store URL
    return `https://kv.replit.com/${this.bucketId}/${encodeURIComponent(key)}`;
  }
}