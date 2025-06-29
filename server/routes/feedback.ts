import { Request, Response } from "express";
import { storage } from "../storage";
import { insertFeedbackSchema } from "@shared/schema";
import DOMPurify from 'dompurify';
import validator from 'validator';
import { JSDOM } from 'jsdom';

// Initialize DOMPurify for server-side sanitization
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

interface FeedbackRequestBody {
  name?: string;
  email?: string;
  feedback?: string;
  conversationId?: number;
}

export async function createFeedback(req: Request, res: Response) {
  try {
    const { name, email, feedback: feedbackText, conversationId }: FeedbackRequestBody = req.body;

    // Validation: At least one field must be provided
    if (!name && !email && !feedbackText) {
      return res.status(400).json({ 
        error: "At least one field (name, email, or feedback) must be provided" 
      });
    }

    // Character limits validation
    if (name && name.length > 200) {
      return res.status(400).json({ 
        error: "Name must be 200 characters or less" 
      });
    }

    if (email && email.length > 200) {
      return res.status(400).json({ 
        error: "Email must be 200 characters or less" 
      });
    }

    if (feedbackText && feedbackText.length > 3000) {
      return res.status(400).json({ 
        error: "Feedback must be 3000 characters or less" 
      });
    }

    // Email validation
    if (email && !validator.isEmail(email)) {
      return res.status(400).json({ 
        error: "Please provide a valid email address" 
      });
    }

    // Sanitize inputs to prevent XSS
    const sanitizedData = {
      name: name ? purify.sanitize(name.trim()) : null,
      email: email ? purify.sanitize(email.trim()) : null,
      feedback: feedbackText ? purify.sanitize(feedbackText.trim()) : null,
      conversationId: conversationId || null,
    };

    // Additional malicious content detection
    const suspiciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
    ];

    const allText = [sanitizedData.name, sanitizedData.email, sanitizedData.feedback]
      .filter(Boolean)
      .join(' ');

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(allText)) {
        return res.status(400).json({ 
          error: "Content contains potentially malicious code and cannot be processed" 
        });
      }
    }

    // Validate schema
    const parseResult = insertFeedbackSchema.safeParse(sanitizedData);
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: "Invalid data format",
        details: parseResult.error.errors 
      });
    }

    // Verify conversation exists if conversationId provided
    if (conversationId) {
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(400).json({ 
          error: "Invalid conversation ID" 
        });
      }
    }

    // Create feedback
    const createdFeedback = await storage.createFeedback(sanitizedData);

    return res.status(201).json({
      message: "Feedback submitted successfully",
      feedback: {
        id: createdFeedback.id,
        createdAt: createdFeedback.createdAt,
      }
    });

  } catch (error) {
    console.error("Error creating feedback:", error);
    return res.status(500).json({ 
      error: "Failed to submit feedback. Please try again." 
    });
  }
}

export async function getFeedback(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid feedback ID" });
    }

    const feedback = await storage.getFeedback(id);
    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    return res.json(feedback);
  } catch (error) {
    console.error("Error retrieving feedback:", error);
    return res.status(500).json({ error: "Failed to retrieve feedback" });
  }
}