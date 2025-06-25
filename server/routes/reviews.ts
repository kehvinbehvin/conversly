import { Request, Response } from "express";
import { storage } from "../storage";
import { insertReviewSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

// GET /api/reviews/:id
export async function getReview(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid review ID" });
    }

    const review = await storage.getReview(id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json(review);
  } catch (error) {
    console.error("Error fetching review:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /api/conversations/:conversationId/review
export async function getReviewByConversationId(req: Request, res: Response) {
  try {
    const conversationId = parseInt(req.params.conversationId);
    if (isNaN(conversationId)) {
      return res.status(400).json({ error: "Invalid conversation ID" });
    }

    const review = await storage.getReviewByConversationId(conversationId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json(review);
  } catch (error) {
    console.error("Error fetching review:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /api/reviews
export async function createReview(req: Request, res: Response) {
  try {
    const result = insertReviewSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        error: "Invalid review data",
        details: fromZodError(result.error).toString()
      });
    }

    const review = await storage.createReview(result.data);
    res.status(201).json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// PATCH /api/reviews/:id
export async function updateReview(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid review ID" });
    }

    const review = await storage.updateReview(id, req.body);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json(review);
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}