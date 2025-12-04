import type { Request, Response } from 'express';
import * as appInsights from 'applicationinsights';
import { searchKnowledge } from '../services/knowledge.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.warn('⚠️ OPENROUTER_API_KEY not set - AI chat will not work');
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  stream?: boolean;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * AI Chat endpoint with streaming support
 * POST /api/chat
 * Body: { messages: ChatMessage[], model?: string, stream?: boolean }
 */
export async function handleChat(req: Request, res: Response) {
  const startTime = Date.now();
  
  try {
    const { messages, model = 'openai/gpt-3.5-turbo', stream = true }: ChatRequest = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    // Get the last user message for RAG search
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    let contextMessages = [...messages];

    // Perform RAG search if there's a user query
    if (lastUserMessage) {
      try {
        const knowledgeResults = await searchKnowledge(lastUserMessage.content, 3);
        
        if (knowledgeResults.length > 0) {
          // Add context from knowledge base as a system message
          const contextText = knowledgeResults
            .map((r, i) => `[Knowledge ${i + 1}] (relevance: ${r.score.toFixed(2)})\n${r.text}`)
            .join('\n\n');
          
          const systemContext: ChatMessage = {
            role: 'system',
            content: `You are a helpful AI assistant with access to a knowledge base. Use the following relevant information to help answer the user's question. If the information is not relevant, you can provide a general response.\n\n${contextText}`
          };
          
          // Insert context before the last user message
          contextMessages = [systemContext, ...messages];
          
          console.log(`📚 RAG: Found ${knowledgeResults.length} relevant documents`);
        }
      } catch (ragError) {
        console.error('⚠️ RAG search failed, continuing without context:', ragError);
        // Continue without RAG context - don't fail the whole request
      }
    }

    // Track custom event for AI chat request
    appInsights.defaultClient?.trackEvent({
      name: 'AIChatRequest',
      properties: {
        messageCount: messages.length,
        model: model,
        streaming: stream,
        ragEnabled: contextMessages.length > messages.length
      }
    });

    if (stream) {
      // Set headers for Server-Sent Events (SSE)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Make streaming request to OpenRouter
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3001',
          'X-Title': 'MindX Week 3 AI Chat'
        },
        body: JSON.stringify({
          model: model,
          messages: contextMessages,
          stream: true
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('OpenRouter API error:', error);
        res.write(`data: ${JSON.stringify({ error: 'AI API error', details: error })}\n\n`);
        res.end();
        
        // Track error
        appInsights.defaultClient?.trackException({
          exception: new Error(`OpenRouter API error: ${JSON.stringify(error)}`)
        });
        return;
      }

      // Stream the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                res.write(`data: [DONE]\n\n`);
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                
                if (content) {
                  fullResponse += content;
                  res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
              } catch (e) {
                // Skip invalid JSON chunks
              }
            }
          }
        }
      }

      res.end();

      // Track metrics
      const duration = Date.now() - startTime;
      appInsights.defaultClient?.trackMetric({
        name: 'AIChatStreamDuration',
        value: duration
      });

      appInsights.defaultClient?.trackEvent({
        name: 'AIChatCompleted',
        properties: {
          model: model,
          responseLength: fullResponse.length,
          duration: duration
        }
      });

    } else {
      // Non-streaming response
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3001',
          'X-Title': 'MindX Week 3 AI Chat'
        },
        body: JSON.stringify({
          model: model,
          messages: contextMessages,
          stream: false
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('OpenRouter API error:', error);
        
        appInsights.defaultClient?.trackException({
          exception: new Error(`OpenRouter API error: ${JSON.stringify(error)}`)
        });
        
        return res.status(response.status).json({ error: 'AI API error', details: error });
      }

      const data = await response.json() as OpenRouterResponse;
      const duration = Date.now() - startTime;

      // Track metrics
      appInsights.defaultClient?.trackMetric({
        name: 'AIChatDuration',
        value: duration
      });

      appInsights.defaultClient?.trackEvent({
        name: 'AIChatCompleted',
        properties: {
          model: model,
          tokensUsed: data.usage?.total_tokens,
          duration: duration
        }
      });

      res.json(data);
    }

  } catch (error) {
    console.error('Chat endpoint error:', error);
    
    appInsights.defaultClient?.trackException({
      exception: error as Error
    });

    res.status(500).json({ error: 'Internal server error' });
  }
}
