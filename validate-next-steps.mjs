import { invoke } from 'braintrust';

async function validateNextSteps() {
  const testData = {
    reviews: [
      {
        index: 0,
        review: 'Good greeting but could use more engaging follow-up questions',
        category: 'improvement'
      }
    ],
    summary: 'Testing next steps generation with updated configuration'
  };

  console.log('Testing Braintrust Next Steps Generation...');
  console.log('Input data:', JSON.stringify(testData, null, 2));
  
  try {
    const result = await invoke({
      projectName: 'Yappy-first-project',
      slug: 'take-action-f00e',
      input: testData
    });
    
    console.log('\n✅ SUCCESS!');
    console.log('Response type:', typeof result);
    console.log('Full response:', JSON.stringify(result, null, 2));
    
    // Analyze the structure
    if (result && typeof result === 'object' && result.steps) {
      console.log('\nSteps analysis:');
      console.log('Steps type:', typeof result.steps);
      console.log('Steps is array:', Array.isArray(result.steps));
      
      if (Array.isArray(result.steps)) {
        console.log('Steps count:', result.steps.length);
        result.steps.forEach((step, i) => {
          console.log(`Step ${i}:`, typeof step, JSON.stringify(step));
        });
      }
    }
  } catch (error) {
    console.error('❌ FAILED:', error.message);
  }
}

validateNextSteps();