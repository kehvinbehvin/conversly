import { TranscriptData } from './fileStore.js';
import { ReplitObjectStorage, type ReplitObjectStorageConfig } from './replitObjectStorage.js';

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

// Hybrid storage class that tries Replit Object Storage first, falls back to local
export class ReplitStorageWithFallback implements ICloudStorage {
  private replitStorage: ReplitObjectStorage | null = null;
  private localStorage: LocalStorageWrapper;

  constructor(config: CloudStorageConfig['replit']) {
    this.localStorage = new LocalStorageWrapper();
    
    if (config?.bucketId) {
      try {
        this.replitStorage = new ReplitObjectStorage({
          bucketId: config.bucketId
        });
      } catch (error) {
        console.warn('Failed to initialize Replit Object Storage, using local storage:', error);
      }
    }
  }

  async saveTranscript(data: TranscriptData): Promise<string> {
    // Try Replit Object Storage first
    if (this.replitStorage) {
      try {
        return await this.replitStorage.saveTranscript(data);
      } catch (error) {
        console.warn('Replit Object Storage failed, falling back to local storage:', error);
      }
    }
    
    // Fallback to local storage
    return await this.localStorage.saveTranscript(data);
  }

  async getTranscript(elevenlabsId: string): Promise<TranscriptData | null> {
    // Try Replit Object Storage first
    if (this.replitStorage) {
      try {
        const result = await this.replitStorage.getTranscript(elevenlabsId);
        if (result) return result;
      } catch (error) {
        console.warn('Replit Object Storage failed, trying local storage:', error);
      }
    }
    
    // Fallback to local storage
    return await this.localStorage.getTranscript(elevenlabsId);
  }

  async listTranscripts(): Promise<string[]> {
    // Try Replit Object Storage first
    if (this.replitStorage) {
      try {
        const replitFiles = await this.replitStorage.listTranscripts();
        if (replitFiles.length > 0) return replitFiles;
      } catch (error) {
        console.warn('Replit Object Storage failed, trying local storage:', error);
      }
    }
    
    // Fallback to local storage
    return await this.localStorage.listTranscripts();
  }

  async deleteTranscript(elevenlabsId: string): Promise<boolean> {
    let deleted = false;
    
    // Try to delete from Replit Object Storage
    if (this.replitStorage) {
      try {
        deleted = await this.replitStorage.deleteTranscript(elevenlabsId);
      } catch (error) {
        console.warn('Failed to delete from Replit Object Storage:', error);
      }
    }
    
    // Also try to delete from local storage
    try {
      const localDeleted = await this.localStorage.deleteTranscript(elevenlabsId);
      deleted = deleted || localDeleted;
    } catch (error) {
      console.warn('Failed to delete from local storage:', error);
    }
    
    return deleted;
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (this.replitStorage) {
      try {
        return await this.replitStorage.getSignedUrl(key, expiresIn);
      } catch (error) {
        console.warn('Failed to get signed URL from Replit Object Storage:', error);
      }
    }
    
    throw new Error('Signed URLs not supported for local storage');
  }
}

// Factory function to create storage instance based on config
export function createCloudStorage(config: CloudStorageConfig): ICloudStorage {
  switch (config.provider) {
    case 'replit':
      return new ReplitStorageWithFallback(config.replit);
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
      // Fallback synchronous creation using dynamic import
      const fs = eval('require')('fs');
      const path = eval('require')('path');
      
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