import { Request, Response } from "express";
import { storage } from "../storage";
import { insertReviewSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { generateNextSteps } from "../services/nextStepsGenerator";

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

    // Generate next steps automatically after review creation
    try {
      // Extract reviews from transcriptWithReviews for Next Steps generation
      const reviewObjects = result.data.transcriptWithReviews
        .filter(item => item.review !== null)
        .map((item, index) => ({
          index: item.index,
          review: item.review as string,
          category: "improvement" // Default category for API-created reviews
        }));

      const nextStepsResponse = await generateNextSteps({
        reviews: reviewObjects,
        summary: result.data.summary
      });

      // Create next steps record if generation was successful
      if (nextStepsResponse.steps.length > 0) {
        await storage.createNextSteps({
          conversationId: result.data.conversationId,
          steps: nextStepsResponse,
        });
        console.log("✅ Next steps generated and saved automatically");
      }
    } catch (nextStepsError) {
      console.error("❌ Next steps generation failed:", nextStepsError);
      // Continue without next steps - review creation is not interrupted
    }

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