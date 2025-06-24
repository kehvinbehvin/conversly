import { Client } from '@replit/object-storage';
import { TranscriptData } from './fileStore.js';

export interface ReplitObjectStorageConfig {
  bucketId: string;
}

export class ReplitObjectStorage {
  private client: Client;
  private bucketId: string;

  constructor(config: ReplitObjectStorageConfig) {
    this.bucketId = config.bucketId;
    // Initialize Replit Object Storage client - it automatically handles authentication
    // using the environment credentials provided by Replit
    this.client = new Client();
  }

  private getKey(elevenlabsId: string): string {
    return `transcripts/transcript_${elevenlabsId}.json`;
  }

  async saveTranscript(data: TranscriptData): Promise<string> {
    const key = this.getKey(data.elevenlabsId);
    
    try {
      // Use Replit Object Storage client with proper authentication
      await this.client.uploadFromText(
        this.bucketId,
        key,
        JSON.stringify(data, null, 2),
        {
          contentType: 'application/json',
          metadata: {
            conversationId: data.conversationId,
            elevenlabsId: data.elevenlabsId,
            timestamp: data.timestamp.toString(),
          }
        }
      );

      console.log(`☁️ Transcript saved to Replit Object Storage: ${this.bucketId}/${key}`);
      return `replit://${this.bucketId}/${key}`;
    } catch (error) {
      console.error('Failed to save transcript to Replit Object Storage:', error);
      throw error;
    }
  }

  async getTranscript(elevenlabsId: string): Promise<TranscriptData | null> {
    const key = this.getKey(elevenlabsId);
    
    try {
      const content = await this.client.downloadAsText(this.bucketId, key);
      
      // Log the actual content for debugging
      console.log('Downloaded content type:', typeof content);
      console.log('Downloaded content:', content);
      
      // Handle case where content might be an object instead of string
      if (typeof content === 'object' && content !== null) {
        return content as TranscriptData;
      }
      
      if (typeof content === 'string') {
        return JSON.parse(content);
      }
      
      throw new Error(`Unexpected content type: ${typeof content}`);
    } catch (error: any) {
      if (error.message?.includes('not found') || error.message?.includes('404') || error.statusCode === 404) {
        return null;
      }
      console.error('Failed to get transcript from Replit Object Storage:', error);
      return null;
    }
  }

  async listTranscripts(): Promise<string[]> {
    try {
      const result = await this.client.list(this.bucketId, {
        prefix: 'transcripts/',
      });
      
      // Handle the actual response format from Replit Object Storage
      if (result && typeof result === 'object') {
        // Check if it has a 'value' property (actual format)
        if (result.value && Array.isArray(result.value)) {
          // Filter for objects that contain transcript files
          const transcriptKeys: string[] = [];
          for (const item of result.value) {
            if (item.name && item.name.includes('transcript_')) {
              // Try to list files within this bucket/folder
              try {
                const innerResult = await this.client.list(item.name, {
                  prefix: 'transcripts/',
                });
                if (innerResult && innerResult.value && Array.isArray(innerResult.value)) {
                  for (const file of innerResult.value) {
                    if (file.name && file.name.endsWith('.json')) {
                      transcriptKeys.push(file.name);
                    }
                  }
                }
              } catch (innerError) {
                console.log('Could not list inner files for:', item.name);
              }
            }
          }
          return transcriptKeys.sort((a: string, b: string) => b.localeCompare(a));
        }
        
        // Handle if it's a direct array of objects
        if (Array.isArray(result.objects)) {
          return result.objects
            .filter((obj: any) => obj.key?.endsWith('.json') && obj.key?.includes('transcript_'))
            .map((obj: any) => obj.key)
            .sort((a: string, b: string) => b.localeCompare(a));
        }
      }
      
      // Handle if result is directly an array
      if (Array.isArray(result)) {
        return result
          .filter((obj: any) => obj.key?.endsWith('.json') && obj.key?.includes('transcript_'))
          .map((obj: any) => obj.key)
          .sort((a: string, b: string) => b.localeCompare(a));
      }
      
      console.warn('Unexpected list result format:', typeof result, result);
      return [];
    } catch (error) {
      console.error('Failed to list transcripts from Replit Object Storage:', error);
      return [];
    }
  }

  async deleteTranscript(elevenlabsId: string): Promise<boolean> {
    const key = this.getKey(elevenlabsId);
    
    try {
      await this.client.delete(this.bucketId, key);
      console.log(`🗑️ Transcript deleted from Replit Object Storage: ${this.bucketId}/${key}`);
      return true;
    } catch (error: any) {
      if (error.message?.includes('not found') || error.message?.includes('404') || error.statusCode === 404) {
        return false; // Already deleted or doesn't exist
      }
      console.error('Failed to delete transcript from Replit Object Storage:', error);
      return false;
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      // Generate a signed URL for the object
      return await this.client.getDownloadUrl(this.bucketId, key, {
        expiresIn,
      });
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      throw error;
    }
  }
}