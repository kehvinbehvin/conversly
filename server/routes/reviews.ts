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
      const validationError = fromZodError(result.error);
      return res.status(400).json({ error: validationError.message });
    }

    const reviewData = result.data;

    // Create the review
    const review = await storage.createReview(reviewData);

    // Generate next steps if we have review data
    if (result.data.transcriptWithReviews && Array.isArray(result.data.transcriptWithReviews)) {
      try {
        const improvementReviews = result.data.transcriptWithReviews
          .filter((item: any) => item.review && typeof item.review === 'string')
          .map((item: any, index: number) => ({
            index,
            review: item.review,
            category: 'improvement'
          }));

        if (improvementReviews.length > 0) {
          const nextStepsInput = {
            reviews: improvementReviews,
            summary: reviewData.summary || 'Conversation analysis'
          };

          const nextStepsResponse = await generateNextSteps(nextStepsInput);
          
          // Create next steps record
          await storage.createNextSteps({
            conversationId: reviewData.conversationId,
            steps: nextStepsResponse,
          });
          console.log("✅ Next steps generated and saved successfully");
        }
      } catch (nextStepsError) {
        console.error("❌ Next steps generation failed:", {
          error: nextStepsError instanceof Error ? nextStepsError.message : String(nextStepsError),
          stack: nextStepsError instanceof Error ? nextStepsError.stack : undefined,
          reviewsCount: result.data.transcriptWithReviews?.length || 0,
          summaryLength: result.data.summary?.length || 0
        });
        // Continue without next steps - conversation flow is not interrupted
      }
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

    const result = insertReviewSchema.partial().safeParse(req.body);
    if (!result.success) {
      const validationError = fromZodError(result.error);
      return res.status(400).json({ error: validationError.message });
    }

    const updatedReview = await storage.updateReview(id, result.data);
    if (!updatedReview) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json(updatedReview);
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}