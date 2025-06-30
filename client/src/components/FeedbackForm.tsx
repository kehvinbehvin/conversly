import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Loader2 } from "lucide-react";

interface FeedbackFormData {
  name: string;
  email: string;
  feedback: string;
}

interface FeedbackFormProps {
  conversationId?: number;
  onSuccess?: () => void;
  onSubmissionChange?: (submitted: boolean) => void;
}

export function FeedbackForm({ conversationId, onSuccess, onSubmissionChange }: FeedbackFormProps) {
  const [formData, setFormData] = useState<FeedbackFormData>({
    name: "",
    email: "",
    feedback: "",
  });
  
  const [errors, setErrors] = useState<Partial<FeedbackFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<FeedbackFormData> = {};

    // At least one field must be filled
    if (!formData.name.trim() && !formData.email.trim() && !formData.feedback.trim()) {
      newErrors.feedback = "Please fill in at least one field";
      setErrors(newErrors);
      return false;
    }

    // Character limits
    if (formData.name.length > 200) {
      newErrors.name = "Name must be 200 characters or less";
    }

    if (formData.email.length > 200) {
      newErrors.email = "Email must be 200 characters or less";
    }

    if (formData.feedback.length > 3000) {
      newErrors.feedback = "Feedback must be 3000 characters or less";
    }

    // Email validation (basic client-side check)
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const requestData = {
        name: formData.name.trim() || undefined,
        email: formData.email.trim() || undefined,
        feedback: formData.feedback.trim() || undefined,
        conversationId: conversationId || undefined,
      };

      await apiRequest("POST", "/api/feedback", requestData);

      // Clear form and show success state
      setFormData({ name: "", email: "", feedback: "" });
      setIsSubmitted(true);
      
      // Notify parent component about submission state
      if (onSubmissionChange) {
        onSubmissionChange(true);
      }
      
      // Call onSuccess callback if provided (for modal close)
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      setErrors({ 
        feedback: "Failed to submit feedback. Please try again." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FeedbackFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmitAnother = () => {
    setIsSubmitted(false);
    setFormData({ name: "", email: "", feedback: "" });
    setErrors({});
    
    // Notify parent component that we're back to form state
    if (onSubmissionChange) {
      onSubmissionChange(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center space-x-3">
          <CheckCircle className="w-8 h-8 text-coral-600" />
          <h3 className="text-heading-2 text-warm-brown-800">
            Thank you for your feedback
          </h3>
        </div>
        <p className="text-body text-warm-brown-600">
          We appreciate you taking the time to share your thoughts with us.
        </p>
        <Button
          onClick={handleSubmitAnother}
          className="bg-coral-600 hover:bg-coral-700 text-white px-6 py-2"
        >
          Submit another feedback
        </Button>
      </div>
    );
  }

  return (
    <Card className="max-w-md mx-auto md:max-w-lg">
      <CardHeader>
        <div>
          <h2 className="text-heading-1 text-warm-brown-800 mb-4">
            Share Your Feedback
          </h2>
          <p className="text-body-lg text-warm-brown-600 max-w-2xl mx-auto">
            Help us improve Conversly by sharing your thoughts, suggestions, or any issues you encountered. 
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="px-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-warm-brown-700">
                Name (optional)
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Your name"
                className="w-full border-warm-brown-200 focus:border-coral-500 focus:ring-coral-500"
                maxLength={200}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-warm-brown-700">
                Email (optional)
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="your.email@example.com"
                className="w-full border-warm-brown-200 focus:border-coral-500 focus:ring-coral-500"
                maxLength={200}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Feedback Field */}
            <div className="space-y-2">
              <Label htmlFor="feedback" className="text-warm-brown-700">
                Feedback (optional)
              </Label>
              <Textarea
                id="feedback"
                value={formData.feedback}
                onChange={(e) => handleInputChange("feedback", e.target.value)}
                placeholder="Share your thoughts, suggestions, or any issues you encountered..."
                className="w-full min-h-[120px] border-warm-brown-200 focus:border-coral-500 focus:ring-coral-500 resize-none"
                maxLength={3000}
              />
              <div className="flex justify-between items-center">
                <div>
                  {errors.feedback && (
                    <p className="text-sm text-red-600">{errors.feedback}</p>
                  )}
                </div>
                <p className="text-xs text-warm-brown-500">
                  {formData.feedback.length}/3000
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-coral-600 hover:bg-coral-700 text-white py-3 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting...</span>
              </div>
            ) : (
              "Submit Feedback"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}