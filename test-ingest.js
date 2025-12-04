// Test script to ingest sample knowledge into the RAG system
// Usage: node test-ingest.js [token]

const fs = require('fs');

const API_URL = process.env.API_URL || 'https://mindx-minhnh.135.171.192.18.nip.io/api';
const token = process.argv[2];

if (!token) {
  console.error('❌ Error: JWT token required');
  console.log('Usage: node test-ingest.js <your-jwt-token>');
  console.log('\nGet your token by:');
  console.log('1. Login at https://mindx-minhnh.135.171.192.18.nip.io');
  console.log('2. Open browser DevTools > Application > Local Storage');
  console.log('3. Copy the "token" value');
  process.exit(1);
}

async function ingestKnowledge() {
  try {
    // Read sample knowledge file
    const knowledgeData = fs.readFileSync('./sample-knowledge.json', 'utf8');
    const knowledge = JSON.parse(knowledgeData);

    console.log(`📚 Ingesting ${knowledge.documents.length} documents...`);

    const response = await fetch(`${API_URL}/ingest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(knowledge),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Ingestion failed:', error);
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Ingestion successful!');
    console.log(result);

    console.log('\n🧪 Test RAG by asking questions like:');
    console.log('- "What is MindX?"');
    console.log('- "What are the objectives of Week 3?"');
    console.log('- "How does RAG work?"');
    console.log('- "What is Qdrant used for?"');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

ingestKnowledge();
