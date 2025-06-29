import { createReviewWithTranscripts } from './server/services/reviewAnalyzer.js';

const transcriptData = [
  {
    index: 0,
    role: "user",
    message: "Hello! How are you doing today?",
    time_in_call_secs: 1.5
  },
  {
    index: 1,
    role: "agent", 
    message: "I am doing well, thank you for asking! What brings you here?",
    time_in_call_secs: 3.2
  },
  {
    index: 2,
    role: "user",
    message: "Just wanted to chat.",
    time_in_call_secs: 5.1
  },
  {
    index: 3,
    role: "agent",
    message: "That sounds great! What kind of things do you like to chat about?",
    time_in_call_secs: 7.8
  },
  {
    index: 4,
    role: "user",
    message: "I don't know really.",
    time_in_call_secs: 10.2
  }
];

console.log('Testing complete review + next steps workflow with conversation 313...');
try {
  const result = await createReviewWithTranscripts(313, transcriptData);
  console.log('Review creation result:', result ? 'SUCCESS' : 'FAILED');
  if (result) {
    console.log('Review ID:', result.id);
    console.log('Summary:', result.summary);
    console.log('Rating:', result.overallRating);
  }
} catch (error) {
  console.error('Workflow test failed:', error.message);
  console.error('Full error:', error);
}