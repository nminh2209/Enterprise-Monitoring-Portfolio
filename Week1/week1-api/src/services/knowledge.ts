import { QdrantClient } from '@qdrant/js-client-rest';

const QDRANT_URL = process.env.QDRANT_URL || 'http://qdrant:6333';
const COLLECTION_NAME = 'knowledge_base';

// Initialize Qdrant client
const qdrantClient = new QdrantClient({ url: QDRANT_URL });

interface Document {
  id?: string;
  text: string;
  metadata?: Record<string, any>;
}

// Create embeddings using OpenRouter (text-embedding-3-small model)
async function createEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.statusText}`);
  }

  const data = await response.json() as { data: Array<{ embedding: number[] }> };
  return data.data[0].embedding;
}

// Initialize collection in Qdrant
export async function initializeCollection(): Promise<void> {
  try {
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME);

    if (!exists) {
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 1536, // text-embedding-3-small dimension
          distance: 'Cosine',
        },
      });
      console.log(`✅ Created Qdrant collection: ${COLLECTION_NAME}`);
    } else {
      console.log(`✅ Qdrant collection already exists: ${COLLECTION_NAME}`);
    }
  } catch (error) {
    console.error('❌ Failed to initialize Qdrant collection:', error);
    throw error;
  }
}

// Ingest documents into the knowledge base
export async function ingestDocuments(documents: Document[]): Promise<void> {
  try {
    const points = await Promise.all(
      documents.map(async (doc, index) => {
        const embedding = await createEmbedding(doc.text);
        return {
          id: doc.id || Date.now() + index, // Use timestamp + index as unsigned integer
          vector: embedding,
          payload: {
            text: doc.text,
            ...doc.metadata,
          },
        };
      })
    );

    await qdrantClient.upsert(COLLECTION_NAME, {
      wait: true,
      points,
    });

    console.log(`✅ Ingested ${documents.length} documents into knowledge base`);
  } catch (error) {
    console.error('❌ Failed to ingest documents:', error);
    throw error;
  }
}

// Search knowledge base using RAG
export async function searchKnowledge(
  query: string,
  limit: number = 3
): Promise<Array<{ text: string; score: number; metadata?: any }>> {
  try {
    const queryEmbedding = await createEmbedding(query);

    const searchResult = await qdrantClient.search(COLLECTION_NAME, {
      vector: queryEmbedding,
      limit,
      with_payload: true,
    });

    return searchResult.map(result => ({
      text: (result.payload?.text as string) || '',
      score: result.score,
      metadata: result.payload,
    }));
  } catch (error) {
    console.error('❌ Knowledge search failed:', error);
    return [];
  }
}

// Health check for Qdrant connection
export async function checkQdrantHealth(): Promise<boolean> {
  try {
    await qdrantClient.getCollections();
    return true;
  } catch (error) {
    console.error('❌ Qdrant health check failed:', error);
    return false;
  }
}
