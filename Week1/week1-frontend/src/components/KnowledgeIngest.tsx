import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './KnowledgeIngest.css';

interface Document {
  id?: string;
  text: string;
  metadata?: Record<string, any>;
}

interface KnowledgeIngestProps {
  apiUrl: string;
}

const KnowledgeIngest: React.FC<KnowledgeIngestProps> = ({ apiUrl }) => {
  const { token } = useAuth();
  const [documentText, setDocumentText] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!documentText.trim()) {
      setMessage({ type: 'error', text: 'Please enter document text' });
      return;
    }

    if (!token) {
      setMessage({ type: 'error', text: 'Not authenticated' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const documents: Document[] = [{
        text: documentText.trim(),
        metadata: category ? { category } : {}
      }];

      console.log('🔍 Ingest - apiUrl prop:', apiUrl);
      console.log('🔍 Ingest - Full fetch URL:', `${apiUrl}/ingest`);

      const response = await fetch(`${apiUrl}/ingest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ documents })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ingestion failed');
      }

      const result = await response.json();
      setMessage({ 
        type: 'success', 
        text: `✅ Successfully added to knowledge base! (${result.count} document${result.count > 1 ? 's' : ''})` 
      });
      setDocumentText('');
      setCategory('');
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to ingest document' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="knowledge-ingest">
      <h3>📚 Add Knowledge</h3>
      <form onSubmit={handleIngest}>
        <div className="form-group">
          <label htmlFor="category">Category (optional)</label>
          <input
            id="category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., company, product, faq"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="documentText">Document Text *</label>
          <textarea
            id="documentText"
            value={documentText}
            onChange={(e) => setDocumentText(e.target.value)}
            placeholder="Enter knowledge to add to the AI's knowledge base..."
            rows={6}
            disabled={loading}
            required
          />
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <button type="submit" disabled={loading || !documentText.trim()}>
          {loading ? 'Adding...' : 'Add to Knowledge Base'}
        </button>
      </form>
    </div>
  );
};

export default KnowledgeIngest;
