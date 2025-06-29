import type { Request, Response } from "express";
import { storage } from "../storage";
import { insertNextStepsSchema } from "@shared/schema";

export async function getNextSteps(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid next steps ID" });
    }

    const nextSteps = await storage.getNextSteps(id);
    if (!nextSteps) {
      return res.status(404).json({ message: "Next steps not found" });
    }

    res.json(nextSteps);
  } catch (error) {
    console.error("Error fetching next steps:", error);
    res.status(500).json({ message: "Failed to get next steps" });
  }
}

export async function getNextStepsByConversationId(req: Request, res: Response) {
  try {
    const conversationId = parseInt(req.params.conversationId);
    if (isNaN(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    const nextSteps = await storage.getNextStepsByConversationId(conversationId);
    if (!nextSteps) {
      return res.status(404).json({ message: "Next steps not found for conversation" });
    }

    res.json(nextSteps);
  } catch (error) {
    console.error("Error fetching next steps by conversation:", error);
    res.status(500).json({ message: "Failed to get next steps" });
  }
}

export async function createNextSteps(req: Request, res: Response) {
  try {
    const validatedData = insertNextStepsSchema.parse(req.body);
    const nextSteps = await storage.createNextSteps(validatedData);
    res.status(201).json(nextSteps);
  } catch (error) {
    console.error("Error creating next steps:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid next steps data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create next steps" });
  }
}

export async function updateNextSteps(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid next steps ID" });
    }

    const nextSteps = await storage.updateNextSteps(id, req.body);
    if (!nextSteps) {
      return res.status(404).json({ message: "Next steps not found" });
    }

    res.json(nextSteps);
  } catch (error) {
    console.error("Error updating next steps:", error);
    res.status(500).json({ message: "Failed to update next steps" });
  }
}