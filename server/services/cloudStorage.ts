import { TranscriptData } from './fileStore.js';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface CloudStorageConfig {
  provider: 'local';
}

export interface ICloudStorage {
  saveTranscript(data: TranscriptData): Promise<string>;
  getTranscript(elevenlabsId: string): Promise<TranscriptData | null>;
  listTranscripts(): Promise<string[]>;
  deleteTranscript(elevenlabsId: string): Promise<boolean>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}

class LocalStorageWrapper implements ICloudStorage {

  async saveTranscript(data: TranscriptData): Promise<string> {
    const baseDir = './data/transcripts';
    await fs.mkdir(baseDir, { recursive: true });
    const filename = `transcript_${data.elevenlabsId}.json`;
    const filePath = join(baseDir, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    return filePath;
  }

  async getTranscript(elevenlabsId: string): Promise<TranscriptData | null> {
    const baseDir = './data/transcripts';
    try {
      const files = await fs.readdir(baseDir);
      const transcriptFile = files.find((file: string) => file.includes(elevenlabsId));
      if (transcriptFile) {
        const filePath = join(baseDir, transcriptFile);
        const content = await fs.readFile(filePath, 'utf8');
        return JSON.parse(content);
      }
      return null;
    } catch {
      return null;
    }
  }

  async listTranscripts(): Promise<string[]> {
    const baseDir = './data/transcripts';
    try {
      await fs.mkdir(baseDir, { recursive: true });
      const files = await fs.readdir(baseDir);
      return files.filter((file: string) => file.endsWith('.json')).sort().reverse();
    } catch {
      return [];
    }
  }

  async deleteTranscript(elevenlabsId: string): Promise<boolean> {
    const baseDir = './data/transcripts';
    try {
      const files = await fs.readdir(baseDir);
      const transcriptFile = files.find((file: string) => file.includes(elevenlabsId));
      if (transcriptFile) {
        const filePath = join(baseDir, transcriptFile);
        await fs.unlink(filePath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async getSignedUrl(key: string): Promise<string> {
    return `local://${key}`;
  }
}

export function createCloudStorage(config: CloudStorageConfig): ICloudStorage {
  return new LocalStorageWrapper();
}

export function getStorageConfig(): CloudStorageConfig {
  return {
    provider: 'local'
  };
}

export const cloudStorage = createCloudStorage(getStorageConfig());