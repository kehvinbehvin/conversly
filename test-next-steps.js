import { generateNextSteps } from './server/services/nextStepsGenerator.js';

async function testNextStepsGeneration() {
  const testReviewData = {
    reviews: [
      {
        index: 0,
        review: 'Great opening with enthusiasm and genuine interest',
        category: 'complement'
      },
      {
        index: 2,
        review: 'Missed opportunity to ask follow-up questions or share something about yourself. This response lacks curiosity and engagement.',
        category: 'improvement'
      },
      {
        index: 4,
        review: 'Very brief response without elaboration. Consider sharing specific details about your interests or goals to keep the conversation flowing.',
        category: 'improvement'
      }
    ],
    summary: 'The user demonstrated good conversation opening but struggled with follow-up questions and maintaining engagement throughout the dialogue.'
  };

  try {
    console.log('🔄 Testing Next Steps generation with updated Braintrust configuration...');
    const result = await generateNextSteps(testReviewData);
    console.log('✅ Next Steps Generation Test Result:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Next Steps Generation Failed:');
    console.error('Error message:', error.message);
    console.error('Full error:', error);
  }
}

testNextStepsGeneration();