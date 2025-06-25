import { Request, Response } from "express";
import { storage } from "../storage";
import { insertImprovementSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

// GET /api/improvements/:id
export async function getImprovement(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid improvement ID" });
    }

    const improvement = await storage.getImprovement(id);
    if (!improvement) {
      return res.status(404).json({ error: "Improvement not found" });
    }

    res.json(improvement);
  } catch (error) {
    console.error("Error fetching improvement:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /api/reviews/:reviewId/improvements
export async function getImprovementsByReviewId(req: Request, res: Response) {
  try {
    const reviewId = parseInt(req.params.reviewId);
    if (isNaN(reviewId)) {
      return res.status(400).json({ error: "Invalid review ID" });
    }

    const improvements = await storage.getImprovementsByReviewId(reviewId);
    res.json(improvements);
  } catch (error) {
    console.error("Error fetching improvements:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /api/improvements
export async function createImprovement(req: Request, res: Response) {
  try {
    const result = insertImprovementSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        error: "Invalid improvement data",
        details: fromZodError(result.error).toString()
      });
    }

    const improvement = await storage.createImprovement(result.data);
    res.status(201).json(improvement);
  } catch (error) {
    console.error("Error creating improvement:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// PATCH /api/improvements/:id
export async function updateImprovement(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid improvement ID" });
    }

    const improvement = await storage.updateImprovement(id, req.body);
    if (!improvement) {
      return res.status(404).json({ error: "Improvement not found" });
    }

    res.json(improvement);
  } catch (error) {
    console.error("Error updating improvement:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// DELETE /api/improvements/:id
export async function deleteImprovement(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid improvement ID" });
    }

    const deleted = await storage.deleteImprovement(id);
    if (!deleted) {
      return res.status(404).json({ error: "Improvement not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting improvement:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}