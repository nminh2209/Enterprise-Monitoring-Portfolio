// Test OpenRouter API connection
// Replace YOUR_API_KEY with your actual key

const OPENROUTER_API_KEY = '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';

async function testOpenRouter() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'MindX Week 3 Test'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Say hello!' }
        ]
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ OpenRouter API working!');
      console.log('Response:', data.choices[0].message.content);
      console.log('\nUsage:', data.usage);
    } else {
      console.error('❌ API Error:', data);
    }
  } catch (error) {
    console.error('❌ Connection Error:', error);
  }
}

testOpenRouter();
