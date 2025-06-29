import type { NextSteps, Step } from "@shared/schema";

interface NextStepsSectionProps {
  nextSteps?: NextSteps | null;
}

export default function NextStepsSection({ nextSteps }: NextStepsSectionProps) {
  // Parse steps data from jsonb field
  let stepsArray: Step[] = [];
  
  if (nextSteps?.steps) {
    try {
      if (typeof nextSteps.steps === 'string') {
        const parsed = JSON.parse(nextSteps.steps);
        stepsArray = parsed.steps || [];
      } else if (typeof nextSteps.steps === 'object' && (nextSteps.steps as any).steps) {
        stepsArray = (nextSteps.steps as any).steps;
      } else if (Array.isArray(nextSteps.steps)) {
        stepsArray = nextSteps.steps;
      }
    } catch (error) {
      console.error('Error parsing next steps data:', error);
      return null;
    }
  }

  if (!stepsArray || stepsArray.length === 0) {
    return null;
  }

  return (
    <div>
      <h4 className="text-body-large font-semibold text-warm-brown-800 mb-2">
        Next Steps
      </h4>
      <div className="text-body text-warm-brown-700 bg-coral-50 p-4 rounded-xl border border-coral-200 shadow-sm">
        <ol className="space-y-3">
          {stepsArray.map((stepItem: Step, index: number) => (
            <li key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                <span className="inline-flex items-center justify-center w-6 h-6 text-sm font-semibold text-coral-700 bg-coral-100 rounded-full">
                  {index + 1}
                </span>
              </div>
              <span className="text-warm-brown-700 leading-relaxed">
                {stepItem.step}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}