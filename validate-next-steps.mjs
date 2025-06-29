// Test Next Steps JSON format handling with mock data
import { generateNextSteps } from './server/services/nextStepsGenerator.ts';

async function testJsonFormatHandling() {
  console.log('Testing Next Steps JSON format handling...');
  
  // Mock the exact Braintrust response format you provided
  const mockBraintrustResponse = {
    "steps": [
      {
        "step": "Reflect on your recent conversations and identify moments where you gave brief or generic responses. Practice elaborating on your experiences and sharing specific details, as this helps others connect with you and makes interactions more engaging."
      },
      {
        "step": "Before your next conversation, prepare a few open-ended questions and personal anecdotes related to common topics (e.g., work, hobbies, recent events). This preparation will help you steer conversations beyond surface-level exchanges."
      },
      {
        "step": "Focus on active listening and genuine curiosity. When someone shares something, respond with follow-up questions or comments that show you are interested and attentive."
      }
    ]
  };
  
  console.log('Mock response format:', JSON.stringify(mockBraintrustResponse, null, 2));
  
  // Test the parsing logic directly
  if (mockBraintrustResponse.steps && Array.isArray(mockBraintrustResponse.steps)) {
    const validatedSteps = mockBraintrustResponse.steps.map((stepObj, index) => {
      if (stepObj && typeof stepObj === 'object' && typeof stepObj.step === 'string') {
        return { step: stepObj.step };
      } else {
        throw new Error(`Step ${index} invalid format: expected {step: string}, got ${JSON.stringify(stepObj)}`);
      }
    });
    
    console.log('✅ JSON parsing successful!');
    console.log(`Processed ${validatedSteps.length} steps`);
    validatedSteps.forEach((step, i) => {
      console.log(`${i + 1}. ${step.step.substring(0, 80)}...`);
    });
  }
}

testJsonFormatHandling();