import fs from 'fs/promises';
import path from 'path';

export interface TranscriptData {
  conversationId: string;
  elevenlabsId: string;
  transcript: any;
  metadata: any;
  analysis?: any;
  timestamp: number;
}

export class FileStore {
  private baseDir: string;

  constructor(baseDir: string = './data/transcripts') {
    this.baseDir = baseDir;
  }

  async ensureDirectory() {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create transcript directory:', error);
    }
  }

  async saveTranscript(data: TranscriptData): Promise<string> {
    await this.ensureDirectory();
    
    // Use consistent filename without timestamp to prevent duplicates
    const filename = `transcript_${data.elevenlabsId}.json`;
    const filePath = path.join(this.baseDir, filename);
    
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`📁 Transcript saved to: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('Failed to save transcript:', error);
      throw error;
    }
  }

  async getTranscript(elevenlabsId: string): Promise<TranscriptData | null> {
    await this.ensureDirectory();
    
    try {
      const files = await fs.readdir(this.baseDir);
      const transcriptFile = files.find(file => file.includes(elevenlabsId));
      
      if (!transcriptFile) {
        return null;
      }
      
      const filePath = path.join(this.baseDir, transcriptFile);
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to read transcript:', error);
      return null;
    }
  }

  async listTranscripts(): Promise<string[]> {
    await this.ensureDirectory();
    
    try {
      const files = await fs.readdir(this.baseDir);
      return files.filter(file => file.endsWith('.json'));
    } catch (error) {
      console.error('Failed to list transcripts:', error);
      return [];
    }
  }

  async deleteTranscript(elevenlabsId: string): Promise<boolean> {
    await this.ensureDirectory();
    
    try {
      const files = await fs.readdir(this.baseDir);
      const transcriptFile = files.find(file => file.includes(elevenlabsId));
      
      if (!transcriptFile) {
        return false;
      }
      
      const filePath = path.join(this.baseDir, transcriptFile);
      await fs.unlink(filePath);
      console.log(`🗑️ Transcript deleted: ${filePath}`);
      return true;
    } catch (error) {
      console.error('Failed to delete transcript:', error);
      return false;
    }
  }
}

export const fileStore = new FileStore();