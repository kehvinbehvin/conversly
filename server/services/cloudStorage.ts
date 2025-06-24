import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { TranscriptData } from './fileStore.js';

export interface CloudStorageConfig {
  provider: 'aws' | 'local';
  aws?: {
    region: string;
    bucketName: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  };
}

export interface ICloudStorage {
  saveTranscript(data: TranscriptData): Promise<string>;
  getTranscript(elevenlabsId: string): Promise<TranscriptData | null>;
  listTranscripts(): Promise<string[]>;
  deleteTranscript(elevenlabsId: string): Promise<boolean>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}

export class S3Storage implements ICloudStorage {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(config: CloudStorageConfig['aws']) {
    if (!config) {
      throw new Error('AWS configuration is required for S3Storage');
    }

    this.bucketName = config.bucketName;
    
    // Initialize S3 client with credentials from environment or config
    this.s3Client = new S3Client({
      region: config.region,
      credentials: config.accessKeyId && config.secretAccessKey ? {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      } : undefined, // Use default credential chain if not provided
    });
  }

  private getKey(elevenlabsId: string): string {
    return `transcripts/transcript_${elevenlabsId}.json`;
  }

  async saveTranscript(data: TranscriptData): Promise<string> {
    const key = this.getKey(data.elevenlabsId);
    
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: JSON.stringify(data, null, 2),
        ContentType: 'application/json',
        Metadata: {
          conversationId: data.conversationId,
          elevenlabsId: data.elevenlabsId,
          timestamp: data.timestamp.toString(),
        }
      });

      await this.s3Client.send(command);
      console.log(`☁️ Transcript saved to S3: s3://${this.bucketName}/${key}`);
      return `s3://${this.bucketName}/${key}`;
    } catch (error) {
      console.error('Failed to save transcript to S3:', error);
      throw error;
    }
  }

  async getTranscript(elevenlabsId: string): Promise<TranscriptData | null> {
    const key = this.getKey(elevenlabsId);
    
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        return null;
      }

      const content = await response.Body.transformToString();
      return JSON.parse(content);
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        return null;
      }
      console.error('Failed to get transcript from S3:', error);
      throw error;
    }
  }

  async listTranscripts(): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: 'transcripts/',
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Contents) {
        return [];
      }

      return response.Contents
        .filter(obj => obj.Key?.endsWith('.json'))
        .map(obj => obj.Key!)
        .sort((a, b) => b.localeCompare(a)); // Sort by newest first
    } catch (error) {
      console.error('Failed to list transcripts from S3:', error);
      return [];
    }
  }

  async deleteTranscript(elevenlabsId: string): Promise<boolean> {
    const key = this.getKey(elevenlabsId);
    
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      console.log(`🗑️ Transcript deleted from S3: s3://${this.bucketName}/${key}`);
      return true;
    } catch (error) {
      console.error('Failed to delete transcript from S3:', error);
      return false;
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      throw error;
    }
  }
}

// Factory function to create storage instance based on config
export function createCloudStorage(config: CloudStorageConfig): ICloudStorage {
  switch (config.provider) {
    case 'aws':
      return new S3Storage(config.aws);
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
  const provider = (process.env.STORAGE_PROVIDER as 'aws' | 'local') || 'local';
  
  if (provider === 'aws') {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const region = process.env.AWS_REGION || 'us-east-1';
    
    if (!bucketName) {
      console.warn('AWS_S3_BUCKET_NAME not set, falling back to local storage');
      return { provider: 'local' };
    }

    return {
      provider: 'aws',
      aws: {
        region,
        bucketName,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    };
  }

  return { provider: 'local' };
}

// Export configured storage instance
export const cloudStorage = createCloudStorage(getStorageConfig());