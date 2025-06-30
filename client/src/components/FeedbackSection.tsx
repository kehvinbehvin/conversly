import { FeedbackForm } from "./FeedbackForm";

export function FeedbackSection() {
  return (
    <section 
      id="feedback" 
      className="min-h-[600px] bg-warm-brown-50 py-16 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        
        
        <div className="flex justify-center">
          <FeedbackForm />
        </div>
      </div>
    </section>
  );
}