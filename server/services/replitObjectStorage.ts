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
      // Use the Replit Object Storage environment variable for authentication
      const token = process.env.REPLIT_OBJECT_STORAGE_TOKEN;
      
      if (!token) {
        throw new Error('REPLIT_OBJECT_STORAGE_TOKEN not found');
      }

      const response = await fetch(`https://objectstorage.replit.com/upload/${this.bucketId}/${key}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
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
      const token = process.env.REPLIT_OBJECT_STORAGE_TOKEN;
      
      if (!token) {
        return null;
      }

      const response = await fetch(`https://objectstorage.replit.com/download/${this.bucketId}/${key}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
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
      const token = process.env.REPLIT_OBJECT_STORAGE_TOKEN;
      
      if (!token) {
        return [];
      }

      const response = await fetch(`https://objectstorage.replit.com/list/${this.bucketId}/transcripts/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to list from Replit Object Storage: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.files) {
        return [];
      }

      return data.files
        .filter((file: string) => file.endsWith('.json'))
        .sort((a: string, b: string) => b.localeCompare(a)); // Sort by newest first
    } catch (error) {
      console.error('Failed to list transcripts from Replit Object Storage:', error);
      return [];
    }
  }

  async deleteTranscript(elevenlabsId: string): Promise<boolean> {
    const key = this.getKey(elevenlabsId);
    
    try {
      const token = process.env.REPLIT_OBJECT_STORAGE_TOKEN;
      
      if (!token) {
        return false;
      }

      const response = await fetch(`https://objectstorage.replit.com/delete/${this.bucketId}/${key}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
    // For now, return a direct download URL
    // In production, you would implement proper signed URLs
    return `https://objectstorage.replit.com/download/${this.bucketId}/${key}`;
  }
}