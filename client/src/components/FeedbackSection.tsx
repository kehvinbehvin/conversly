import { FeedbackForm } from "./FeedbackForm";

export function FeedbackSection() {
  return (
    <section 
      id="feedback" 
      className="min-h-[600px] bg-warm-brown-50 py-16 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-heading-1 text-warm-brown-800 mb-4">
            Share Your Feedback
          </h2>
          <p className="text-body-lg text-warm-brown-600 max-w-2xl mx-auto">
            Help us improve Conversly by sharing your thoughts, suggestions, or any issues you encountered. 
            Your feedback helps us create a better conversation practice experience.
          </p>
        </div>
        
        <div className="flex justify-center">
          <FeedbackForm />
        </div>
      </div>
    </section>
  );
}