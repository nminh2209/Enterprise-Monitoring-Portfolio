# Week 1 MindX API

A simple Node.js/TypeScript Express API for MindX Engineer Onboarding Week 1.

## Features

- Health check endpoint (`/health`)
- Hello world endpoints (`/` and `/hello/:name`)
- TypeScript support
- Production-ready build configuration

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Development mode:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Run production build:
   ```bash
   npm start
   ```

## API Endpoints

- `GET /health` - Health check
- `GET /` - Hello world
- `GET /hello/:name` - Personalized hello message

## Docker

Build the Docker image:
```bash
docker build -t week1-api .
```

Run the container:
```bash
docker run -p 3000:3000 week1-api
```

## 🚀 Azure Deployment (Week 1 Tasks 1.1-1.5 Completed)

This API has been successfully deployed to Azure Cloud following MindX Week 1 requirements:

### ✅ Completed Tasks

**Task 1.1: Create Simple API**
- ✅ Node.js/TypeScript Express server with proper TypeScript configuration
- ✅ Health check endpoint (`/health`) returning JSON status
- ✅ Hello world endpoints (`/` and `/hello/:name`)
- ✅ Production-ready build scripts and dependencies

**Task 1.2: Containerize the API**
- ✅ Multi-stage Dockerfile for optimized image size
- ✅ Docker image built and tested locally
- ✅ Security features: Non-root user, health checks, proper base image
- ✅ Container runs successfully on port 3000

**Task 1.3: Set Up Azure Container Registry**
- ✅ Azure Container Registry created: `mindxweek1minhnhacr.azurecr.io`
- ✅ Admin access enabled for deployment
- ✅ Docker login configured for ACR access

**Task 1.4: Build and Push Container Image to ACR**
- ✅ Docker image tagged for ACR: `mindxweek1minhnhacr.azurecr.io/week1-api:v1`
- ✅ Image successfully pushed to Azure Container Registry
- ✅ Repository and tags verified in ACR

**Task 1.5: Deploy API to Azure Web App**
- ✅ Azure Web App created: `mindx-week1-api`
- ✅ App Service plan configured with Linux/B1 SKU
- ✅ Container deployment from ACR configured
- ✅ Web App restarted and deployment verified

### 🌐 Live Deployment

**Production URL**: https://mindx-week1-api.azurewebsites.net

**Verified Endpoints**:
- Health Check: `https://mindx-week1-api.azurewebsites.net/health`
- Hello World: `https://mindx-week1-api.azurewebsites.net/`
- Personalized Hello: `https://mindx-week1-api.azurewebsites.net/hello/YourName`

### 🛠️ Infrastructure Details

- **Resource Group**: `mindx-minhnh-rg`
- **Container Registry**: `mindxweek1minhnhacr.azurecr.io`
- **Web App**: `mindx-week1-api`
- **App Service Plan**: `mindx-week1-plan` (Linux B1)
- **Image**: `mindxweek1minhnhacr.azurecr.io/week1-api:v1`
- **SSL**: Automatic HTTPS enabled by Azure

### 📋 Next Steps

- **Task 1.6**: Verify API deployment (✅ Completed - all endpoints tested)
- **Task 1.7**: Repository setup with Git
- **Step 2**: Deploy to Azure Kubernetes Service (AKS)
- **Step 3-6**: Complete full-stack application with React frontend, authentication, and custom domain

This deployment demonstrates core DevOps practices: containerization, container registries, and cloud deployment with Infrastructure as Code principles.