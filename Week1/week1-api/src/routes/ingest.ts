import { Request, Response } from 'express';
import { ingestDocuments, initializeCollection } from '../services/knowledge.js';

interface IngestRequest {
  documents: Array<{
    id?: string;
    text: string;
    metadata?: Record<string, any>;
  }>;
}

export async function handleIngest(req: Request, res: Response): Promise<void> {
  try {
    const { documents } = req.body as IngestRequest;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      res.status(400).json({ 
        error: 'Invalid request', 
        message: 'Documents array is required and must not be empty' 
      });
      return;
    }

    // Ensure collection exists
    await initializeCollection();

    // Ingest documents
    await ingestDocuments(documents);

    res.json({
      success: true,
      message: `Successfully ingested ${documents.length} documents`,
      count: documents.length,
    });
  } catch (error) {
    console.error('Document ingestion error:', error);
    res.status(500).json({
      error: 'Ingestion failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
