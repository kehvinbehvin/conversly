import { invoke } from 'braintrust';

async function testBraintrust() {
  const testData = {
    reviews: [
      {
        index: 0,
        review: 'Good greeting but needs follow-up engagement',
        category: 'improvement'
      }
    ],
    summary: 'Testing next steps generation'
  };

  console.log('Testing Braintrust invoke directly...');
  try {
    const result = await invoke({
      projectName: 'Yappy-first-project',
      slug: 'take-action-f00e',
      input: testData
    });
    
    console.log('Success! Response type:', typeof result);
    console.log('Response content:', JSON.stringify(result, null, 2));
    
    // Test what the configuration expects vs actual format
    if (result && typeof result === 'object' && result.steps) {
      console.log('Steps array type:', typeof result.steps);
      console.log('Steps array length:', Array.isArray(result.steps) ? result.steps.length : 'not array');
      if (Array.isArray(result.steps)) {
        result.steps.forEach((step, i) => {
          console.log(`Step ${i} type:`, typeof step, 'value:', step);
        });
      }
    }
  } catch (error) {
    console.error('Braintrust invoke failed:', error.message);
    console.error('Error details:', error);
  }
}

testBraintrust();