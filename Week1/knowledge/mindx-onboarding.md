# MindX Engineer Onboarding - Sample Knowledge Base

This is sample documentation for testing the RAG (Retrieval-Augmented Generation) system in Week 3.

## Week 1: Full-Stack Authentication Application

In Week 1, students build a complete authentication system using:
- **Frontend**: React 18 with TypeScript
- **Backend**: Node.js with Express and TypeScript
- **Authentication**: OpenID Connect with MindX SSO
- **Deployment**: Azure Kubernetes Service (AKS) with HTTPS using Let's Encrypt
- **Container Registry**: Azure Container Registry (ACR)

The application includes user login, JWT token management, and protected routes.

## Week 2: Metrics and Monitoring

Week 2 focuses on observability:
- **Azure Application Insights**: Server-side monitoring with custom events and metrics
- **Google Analytics 4 (GA4)**: Client-side analytics for user behavior tracking
- **Custom Metrics**: API response times, error rates, and user sessions
- **Dashboards**: Real-time monitoring in Azure Portal

Students learn to track application health and user engagement.

## Week 3: AI Application with Domain Knowledge

Week 3 introduces AI capabilities:
- **AI Chat Integration**: OpenRouter API with GPT-3.5-turbo model
- **Vector Database**: Qdrant for semantic search and knowledge retrieval
- **RAG (Retrieval-Augmented Generation)**: Combining knowledge base with AI responses
- **MCP Tools**: Model Context Protocol for tool calling and external integrations
- **Streaming Responses**: Server-Sent Events (SSE) for real-time chat

The goal is to build an AI assistant with domain-specific knowledge about the onboarding program.

## Architecture Overview

The complete system architecture includes:
1. **Frontend (React)**: User interface with chat component
2. **Backend API (Node.js)**: REST API with AI endpoints
3. **Vector Database (Qdrant)**: Semantic search for knowledge retrieval
4. **AI Provider (OpenRouter)**: LLM access for chat completions
5. **Monitoring (App Insights + GA4)**: Full observability stack
6. **Kubernetes (AKS)**: Container orchestration and deployment

## Technology Stack

- **Languages**: TypeScript, JavaScript
- **Frontend**: React 18, Vite
- **Backend**: Node.js, Express
- **AI/ML**: OpenRouter API, Qdrant vector database
- **Cloud**: Azure (AKS, ACR, App Insights)
- **DevOps**: Docker, Kubernetes, kubectl
- **Monitoring**: Azure App Insights, Google Analytics 4

## Learning Objectives

By completing the 3-week program, students will:
1. Build production-ready full-stack applications
2. Implement secure authentication with OpenID Connect
3. Deploy containerized applications to Kubernetes
4. Set up comprehensive monitoring and analytics
5. Integrate AI capabilities with RAG and vector search
6. Use MCP for tool calling and external integrations
7. Apply DevOps best practices

This onboarding program prepares engineers for modern full-stack and AI-powered application development.
