import { Request, Response } from "express";
import { storage } from "../storage";
import { insertTranscriptSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

// GET /api/transcripts/:id
export async function getTranscript(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid transcript ID" });
    }

    const transcript = await storage.getTranscript(id);
    if (!transcript) {
      return res.status(404).json({ error: "Transcript not found" });
    }

    res.json(transcript);
  } catch (error) {
    console.error("Error fetching transcript:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /api/transcripts
export async function createTranscript(req: Request, res: Response) {
  try {
    const result = insertTranscriptSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        error: "Invalid transcript data",
        details: fromZodError(result.error).toString()
      });
    }

    const transcript = await storage.createTranscript(result.data);
    res.status(201).json(transcript);
  } catch (error) {
    console.error("Error creating transcript:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// PATCH /api/transcripts/:id
export async function updateTranscript(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid transcript ID" });
    }

    const transcript = await storage.updateTranscript(id, req.body);
    if (!transcript) {
      return res.status(404).json({ error: "Transcript not found" });
    }

    res.json(transcript);
  } catch (error) {
    console.error("Error updating transcript:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}