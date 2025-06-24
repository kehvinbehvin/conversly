import { TranscriptData } from './fileStore.js';

export interface CloudStorageConfig {
  provider: 'replit' | 'local';
  replit?: {
    bucketId: string;
  };
}

export interface ICloudStorage {
  saveTranscript(data: TranscriptData): Promise<string>;
  getTranscript(elevenlabsId: string): Promise<TranscriptData | null>;
  listTranscripts(): Promise<string[]>;
  deleteTranscript(elevenlabsId: string): Promise<boolean>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}

export class ReplitStorage implements ICloudStorage {
  private bucketId: string;

  constructor(config: CloudStorageConfig['replit']) {
    if (!config) {
      throw new Error('Replit configuration is required for ReplitStorage');
    }
    this.bucketId = config.bucketId;
  }

  private getKey(elevenlabsId: string): string {
    return `transcripts/transcript_${elevenlabsId}.json`;
  }

  async saveTranscript(data: TranscriptData): Promise<string> {
    const key = this.getKey(data.elevenlabsId);
    
    try {
      const response = await fetch(`https://storage.googleapis.com/storage/v1/b/${this.bucketId}/o?uploadType=media&name=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data, null, 2),
      });

      if (!response.ok) {
        throw new Error(`Failed to save to Replit storage: ${response.status} ${response.statusText}`);
      }

      console.log(`☁️ Transcript saved to Replit storage: ${this.bucketId}/${key}`);
      return `replit://${this.bucketId}/${key}`;
    } catch (error) {
      console.error('Failed to save transcript to Replit storage:', error);
      throw error;
    }
  }

  async getTranscript(elevenlabsId: string): Promise<TranscriptData | null> {
    const key = this.getKey(elevenlabsId);
    
    try {
      const response = await fetch(`https://storage.googleapis.com/storage/v1/b/${this.bucketId}/o/${encodeURIComponent(key)}?alt=media`);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to get from Replit storage: ${response.status} ${response.statusText}`);
      }

      const content = await response.text();
      return JSON.parse(content);
    } catch (error: any) {
      if (error.message?.includes('404')) {
        return null;
      }
      console.error('Failed to get transcript from Replit storage:', error);
      throw error;
    }
  }

  async listTranscripts(): Promise<string[]> {
    try {
      const response = await fetch(`https://storage.googleapis.com/storage/v1/b/${this.bucketId}/o?prefix=transcripts/`);
      
      if (!response.ok) {
        throw new Error(`Failed to list from Replit storage: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.items) {
        return [];
      }

      return data.items
        .filter((item: any) => item.name?.endsWith('.json'))
        .map((item: any) => item.name)
        .sort((a: string, b: string) => b.localeCompare(a)); // Sort by newest first
    } catch (error) {
      console.error('Failed to list transcripts from Replit storage:', error);
      return [];
    }
  }

  async deleteTranscript(elevenlabsId: string): Promise<boolean> {
    const key = this.getKey(elevenlabsId);
    
    try {
      const response = await fetch(`https://storage.googleapis.com/storage/v1/b/${this.bucketId}/o/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });

      if (response.status === 404) {
        return false; // Already deleted or doesn't exist
      }

      if (!response.ok) {
        throw new Error(`Failed to delete from Replit storage: ${response.status} ${response.statusText}`);
      }

      console.log(`🗑️ Transcript deleted from Replit storage: ${this.bucketId}/${key}`);
      return true;
    } catch (error) {
      console.error('Failed to delete transcript from Replit storage:', error);
      return false;
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // For Replit storage, we can return the direct URL as it's already accessible
    // In a production environment, you might want to implement proper signed URLs
    return `https://storage.googleapis.com/storage/v1/b/${this.bucketId}/o/${encodeURIComponent(key)}?alt=media`;
  }
}

// Factory function to create storage instance based on config
export function createCloudStorage(config: CloudStorageConfig): ICloudStorage {
  switch (config.provider) {
    case 'replit':
      return new ReplitStorage(config.replit);
    case 'local':
      // Return local file storage wrapped to match interface
      return new LocalStorageWrapper();
    default:
      throw new Error(`Unsupported storage provider: ${config.provider}`);
  }
}

// Local storage wrapper to match cloud storage interface
class LocalStorageWrapper implements ICloudStorage {
  private fileStore: any;

  constructor() {
    // Import FileStore dynamically to avoid circular dependency issues
    import('./fileStore.js').then(module => {
      this.fileStore = new module.FileStore();
    });
  }

  private getFileStore() {
    if (!this.fileStore) {
      // Fallback synchronous creation
      const fs = require('fs');
      const path = require('path');
      
      return {
        async saveTranscript(data: TranscriptData): Promise<string> {
          const baseDir = './data/transcripts';
          await fs.promises.mkdir(baseDir, { recursive: true });
          const filename = `transcript_${data.elevenlabsId}.json`;
          const filePath = path.join(baseDir, filename);
          await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
          return filePath;
        },
        async getTranscript(elevenlabsId: string): Promise<TranscriptData | null> {
          const baseDir = './data/transcripts';
          try {
            const files = await fs.promises.readdir(baseDir);
            const transcriptFile = files.find((file: string) => file.includes(elevenlabsId));
            if (!transcriptFile) return null;
            const filePath = path.join(baseDir, transcriptFile);
            const content = await fs.promises.readFile(filePath, 'utf8');
            return JSON.parse(content);
          } catch {
            return null;
          }
        },
        async listTranscripts(): Promise<string[]> {
          const baseDir = './data/transcripts';
          try {
            await fs.promises.mkdir(baseDir, { recursive: true });
            const files = await fs.promises.readdir(baseDir);
            return files.filter((file: string) => file.endsWith('.json'));
          } catch {
            return [];
          }
        },
        async deleteTranscript(elevenlabsId: string): Promise<boolean> {
          const baseDir = './data/transcripts';
          try {
            const files = await fs.promises.readdir(baseDir);
            const transcriptFile = files.find((file: string) => file.includes(elevenlabsId));
            if (!transcriptFile) return false;
            const filePath = path.join(baseDir, transcriptFile);
            await fs.promises.unlink(filePath);
            return true;
          } catch {
            return false;
          }
        }
      };
    }
    return this.fileStore;
  }

  async saveTranscript(data: TranscriptData): Promise<string> {
    const store = this.getFileStore();
    return store.saveTranscript(data);
  }

  async getTranscript(elevenlabsId: string): Promise<TranscriptData | null> {
    const store = this.getFileStore();
    return store.getTranscript(elevenlabsId);
  }

  async listTranscripts(): Promise<string[]> {
    const store = this.getFileStore();
    return store.listTranscripts();
  }

  async deleteTranscript(elevenlabsId: string): Promise<boolean> {
    const store = this.getFileStore();
    return store.deleteTranscript(elevenlabsId);
  }

  async getSignedUrl(key: string): Promise<string> {
    throw new Error('Signed URLs not supported for local storage');
  }
}

// Default configuration - reads from environment variables
export function getStorageConfig(): CloudStorageConfig {
  const provider = (process.env.STORAGE_PROVIDER as 'replit' | 'local') || 'replit';
  
  if (provider === 'replit') {
    const bucketId = process.env.REPLIT_DB_URL ? 
      'replit-objstore-988cc690-5963-48b8-b852-b976020113c7' : // Use default bucket from .replit
      process.env.REPLIT_OBJECT_STORAGE_BUCKET_ID;
    
    if (!bucketId) {
      console.warn('Replit object storage bucket ID not found, falling back to local storage');
      return { provider: 'local' };
    }

    return {
      provider: 'replit',
      replit: {
        bucketId,
      }
    };
  }

  return { provider: 'local' };
}

// Export configured storage instance
export const cloudStorage = createCloudStorage(getStorageConfig());