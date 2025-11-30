# 8. Deployment Guide

**Section:** Docker build, ACR push, and Kubernetes deployment  
**Focus:** Getting metrics-enabled code to production

---

## 🎯 Overview

**Deployment Flow:**

```
Local Code Changes
    ↓
Docker Build (with App Insights + GA4)
    ↓
Push to Azure Container Registry
    ↓
Update Kubernetes Deployment
    ↓
Verify in Live Metrics
```

**Services to Deploy:**

1. **Backend API** - Application Insights SDK integrated
2. **Frontend** - Application Insights React Plugin + GA4

---

## 🔧 Backend Deployment

### 1. Build Docker Image

**Navigate to backend:**

```bash
cd week1-api
```

**Build with version tag:**

```bash
docker build -t week1-api:v16-appinsights-fixed .
```

**What this includes:**
- ✅ `applicationinsights@2.9.5` (downgraded from v3.12.1)
- ✅ Instrumentation key initialization
- ✅ Custom event tracking (UserLogin, UserLogout, HealthCheckRequests)
- ✅ Automatic telemetry collection

**Build output:**
```
[+] Building 45.2s (12/12) FINISHED
 => [internal] load build definition from Dockerfile
 => [internal] load .dockerignore
 => [internal] load metadata for docker.io/library/node:18-alpine
 => [1/6] FROM node:18-alpine
 => [2/6] WORKDIR /app
 => [3/6] COPY package*.json ./
 => [4/6] RUN npm install --production
 => [5/6] COPY . .
 => [6/6] EXPOSE 5000
 => exporting to image
 => => naming to docker.io/library/week1-api:v16-appinsights-fixed
```

### 2. Tag for ACR

```bash
docker tag week1-api:v16-appinsights-fixed mindxweek1.azurecr.io/week1-api:v16-appinsights-fixed
```

**Verify tag:**

```bash
docker images | findstr week1-api
```

**Expected:**
```
mindxweek1.azurecr.io/week1-api   v16-appinsights-fixed   abc123def456   2 minutes ago   250MB
week1-api                          v16-appinsights-fixed   abc123def456   2 minutes ago   250MB
```

### 3. Push to ACR

**Login to ACR:**

```bash
az acr login --name mindxweek1
```

**Push image:**

```bash
docker push mindxweek1.azurecr.io/week1-api:v16-appinsights-fixed
```

**Output:**
```
The push refers to repository [mindxweek1.azurecr.io/week1-api]
v16-appinsights-fixed: digest: sha256:abc123... size: 1234
```

**Verify in ACR:**

```bash
az acr repository show-tags --name mindxweek1 --repository week1-api --output table
```

**Expected:**
```
Result
-----------------------
v16-appinsights-fixed
v15
v14
```

### 4. Update Kubernetes Deployment

**File:** `api-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  labels:
    app: api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: mindxweek1.azurecr.io/week1-api:v16-appinsights-fixed  # ← Updated version
        ports:
        - containerPort: 5000
        env:
        - name: FRONTEND_URL
          value: "http://20.6.98.102"
        - name: APPINSIGHTS_INSTRUMENTATIONKEY
          value: "f97d9fcc-bf08-46d9-985c-458c6fa4ce7a"  # App Insights key
```

**Apply deployment:**

```bash
kubectl apply -f api-deployment.yaml
```

**Output:**
```
deployment.apps/api configured
```

**Watch rollout:**

```bash
kubectl rollout status deployment/api
```

**Expected:**
```
Waiting for deployment "api" rollout to finish: 1 out of 2 new replicas have been updated...
Waiting for deployment "api" rollout to finish: 1 old replicas are pending termination...
deployment "api" successfully rolled out
```

### 5. Verify Backend Deployment

**Check pods:**

```bash
kubectl get pods -l app=api
```

**Expected:**
```
NAME                  READY   STATUS    RESTARTS   AGE
api-7d9f8c5b4-abc12   1/1     Running   0          2m
api-7d9f8c5b4-def34   1/1     Running   0          1m
```

**Check pod logs:**

```bash
kubectl logs -l app=api --tail=20
```

**Expected output:**
```
Server running on port 5000
✅ Application Insights initialized
Instrumentation Key: f97d9fcc-bf08-46d9-985c-458c6fa4ce7a
```

**Test health endpoint:**

```bash
curl http://20.6.98.102/api/health
```

**Expected:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T14:30:00.000Z",
  "appInsights": "enabled"
}
```

---

## 🌐 Frontend Deployment

### 1. Build Docker Image

**Navigate to frontend:**

```bash
cd week1-frontend
```

**Build with version tag:**

```bash
docker build -t week1-frontend:v11-ga4 .
```

**What this includes:**
- ✅ Application Insights React Plugin (@microsoft/applicationinsights-react-js@19.3.8)
- ✅ Google Analytics 4 (G-YYPL2F80CX)
- ✅ Custom event tracking in AuthContext
- ✅ Page view tracking
- ✅ Built with `--legacy-peer-deps` for React version compatibility

**Build output:**
```
[+] Building 120.5s (14/14) FINISHED
 => [builder 1/6] FROM node:18-alpine
 => [builder 2/6] WORKDIR /app
 => [builder 3/6] COPY package*.json ./
 => [builder 4/6] RUN npm install --legacy-peer-deps
 => [builder 5/6] COPY . .
 => [builder 6/6] RUN npm run build
 => [production 1/3] FROM nginx:alpine
 => [production 2/3] COPY --from=builder /app/build /usr/share/nginx/html
 => [production 3/3] COPY nginx.conf /etc/nginx/conf.d/default.conf
 => exporting to image
 => => naming to docker.io/library/week1-frontend:v11-ga4
```

### 2. Tag for ACR

```bash
docker tag week1-frontend:v11-ga4 mindxweek1.azurecr.io/week1-frontend:v11-ga4
```

### 3. Push to ACR

```bash
docker push mindxweek1.azurecr.io/week1-frontend:v11-ga4
```

**Verify:**

```bash
az acr repository show-tags --name mindxweek1 --repository week1-frontend --output table
```

**Expected:**
```
Result
-------
v11-ga4
v10
v9
```

### 4. Update Kubernetes Deployment

**File:** `frontend-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  labels:
    app: frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: mindxweek1.azurecr.io/week1-frontend:v11-ga4  # ← Updated version
        ports:
        - containerPort: 80
```

**Apply deployment:**

```bash
kubectl apply -f frontend-deployment.yaml
kubectl rollout status deployment/frontend
```

### 5. Verify Frontend Deployment

**Check pods:**

```bash
kubectl get pods -l app=frontend
```

**Expected:**
```
NAME                       READY   STATUS    RESTARTS   AGE
frontend-6b8d7f9c4-abc12   1/1     Running   0          2m
frontend-6b8d7f9c4-def34   1/1     Running   0          1m
```

**Test in browser:**

```
Open: http://20.6.98.102
```

**Check browser console (F12):**
```
Application Insights initialized in React
```

**Check Network tab:**
- Filter: `dc.services` (App Insights)
- Filter: `google-analytics` (GA4)

Both should show 200 OK requests.

---

## 🔍 Verify Full Integration

### 1. Check Application Map

**Steps:**

1. Go to Azure Portal → mindx-week1-insights → Application Map
2. Wait 2-3 minutes for data

**Expected:**
```
┌─────────────┐
│   2 inst    │  ← Backend instances
│  846.4 µs   │
│   100% ✓    │
└─────────────┘
```

### 2. Check Live Metrics

**Steps:**

1. Go to Live Metrics
2. Generate traffic:
   ```bash
   curl http://20.6.98.102/api/health
   ```

**Expected:**
```
Incoming Requests: 1 req/sec
Server Response Time: < 50ms
```

### 3. Test Custom Events

**Steps:**

1. Open `http://20.6.98.102`
2. Click "Login" button
3. Wait 2 minutes
4. Go to Logs → Run query:
   ```kusto
   customEvents
   | where name == "LoginAttempt"
   | where timestamp > ago(10m)
   ```

**Expected:**
```
1 row returned
```

### 4. Test GA4

**Steps:**

1. Open `http://20.6.98.102`
2. Navigate to different pages
3. Go to GA4 → Realtime

**Expected:**
```
Users active now: 1
Events:
  - page_view: 3
  - session_start: 1
```

---

## 🚀 Deployment Best Practices

### 1. Use Version Tags

✅ **DO:**
```bash
docker build -t week1-api:v16-appinsights-fixed .
```

❌ **DON'T:**
```bash
docker build -t week1-api:latest .
```

**Why?**
- Easy rollback to specific version
- Clear deployment history
- Avoid cache issues with `:latest`

### 2. Incremental Rollout

**Strategy:**

```yaml
spec:
  replicas: 4
  strategy:
    rollingUpdate:
      maxSurge: 1        # Add 1 new pod at a time
      maxUnavailable: 1  # Keep at least 3 pods running
```

**How it works:**
1. Start: 4 pods on old version
2. Step 1: Create 1 new pod (5 total)
3. Step 2: Terminate 1 old pod (4 total)
4. Repeat until all 4 pods are new version

**Zero downtime!**

### 3. Health Checks

**Liveness probe:**

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 5000
  initialDelaySeconds: 10
  periodSeconds: 10
```

**Readiness probe:**

```yaml
readinessProbe:
  httpGet:
    path: /api/health
    port: 5000
  initialDelaySeconds: 5
  periodSeconds: 5
```

**Why?**
- Kubernetes only routes traffic to healthy pods
- Automatic pod restart if unhealthy
- Deployment fails fast if new version broken

### 4. Monitor During Deployment

**Open in separate windows:**

1. **Live Metrics** - Watch real-time telemetry
2. **kubectl logs** - Watch pod startup
3. **Application Map** - Verify instance count

**Watch for:**
- ❌ Exception rate spike
- ❌ Response time increase
- ❌ Pods crash-looping
- ✅ Smooth traffic migration

### 5. Rollback Plan

**If deployment fails:**

```bash
# Quick rollback to previous version
kubectl rollout undo deployment/api

# Or rollback to specific revision
kubectl rollout history deployment/api
kubectl rollout undo deployment/api --to-revision=2
```

**Verify rollback:**

```bash
kubectl rollout status deployment/api
kubectl get pods -l app=api
```

---

## 🛠️ Troubleshooting Deployments

### Pods Not Starting

**Symptoms:**
```
NAME                  READY   STATUS             RESTARTS   AGE
api-abc123-def456     0/1     CrashLoopBackOff   3          2m
```

**Debug:**

```bash
# Check pod logs
kubectl logs api-abc123-def456

# Describe pod for events
kubectl describe pod api-abc123-def456
```

**Common causes:**
- Missing environment variables
- Wrong image tag
- Application code errors
- Insufficient memory/CPU

### Image Pull Errors

**Symptoms:**
```
Status: ImagePullBackOff
```

**Debug:**

```bash
kubectl describe pod api-abc123-def456
```

**Look for:**
```
Events:
  Failed to pull image: unauthorized: authentication required
```

**Fix:**

```bash
# Re-login to ACR
az acr login --name mindxweek1

# Verify image exists
az acr repository show-tags --name mindxweek1 --repository week1-api
```

### No Telemetry Data

**Symptoms:**
- Live Metrics shows no data
- Logs queries return 0 results

**Debug:**

1. **Check environment variable:**
   ```bash
   kubectl describe deployment api | findstr APPINSIGHTS
   ```
   Expected: `APPINSIGHTS_INSTRUMENTATIONKEY=f97d9fcc-bf08-46d9-985c-458c6fa4ce7a`

2. **Check pod logs:**
   ```bash
   kubectl logs -l app=api | findstr "Application Insights"
   ```
   Expected: `✅ Application Insights initialized`

3. **Test from inside pod:**
   ```bash
   kubectl exec -it api-abc123-def456 -- curl http://localhost:5000/api/health
   ```

4. **Check firewall:**
   - Pods need outbound access to `dc.services.visualstudio.com`

---

## ✅ Deployment Checklist

### Backend (API)

- [x] Built Docker image with App Insights SDK v2.9.5
- [x] Tagged with version: v16-appinsights-fixed
- [x] Pushed to ACR: mindxweek1.azurecr.io/week1-api:v16-appinsights-fixed
- [x] Updated api-deployment.yaml with new image
- [x] Applied deployment: `kubectl apply -f api-deployment.yaml`
- [x] Verified rollout: `kubectl rollout status deployment/api`
- [x] Checked pod logs: "Application Insights initialized"
- [x] Tested health endpoint: appInsights: "enabled"
- [x] Verified in Live Metrics: Telemetry flowing

### Frontend

- [x] Built Docker image with App Insights + GA4
- [x] Tagged with version: v11-ga4
- [x] Pushed to ACR: mindxweek1.azurecr.io/week1-frontend:v11-ga4
- [x] Updated frontend-deployment.yaml with new image
- [x] Applied deployment: `kubectl apply -f frontend-deployment.yaml`
- [x] Verified rollout: `kubectl rollout status deployment/frontend`
- [x] Tested in browser: Console shows "Application Insights initialized"
- [x] Verified Network tab: App Insights + GA4 requests successful
- [x] Checked GA4 Realtime: Events flowing

### Integration

- [x] Application Map shows 2 backend instances
- [x] Live Metrics shows incoming requests
- [x] Custom events (LoginAttempt) visible in Logs
- [x] GA4 Realtime shows page views
- [x] Alerts configured and monitoring
- [x] No errors in pod logs
- [x] Response times < 1000ms

---

## 🔗 Next Steps

- **Test Everything** → [Testing Verification Guide](./09-testing-verification.md)
- **Troubleshoot Issues** → [Troubleshooting Guide](./10-troubleshooting.md)
- **Understand Metrics** → [Metrics Interpretation Guide](./06-metrics-interpretation.md)

---

**Next:** [Testing Verification →](./09-testing-verification.md)

[← Back to Index](./README.md) | [← Previous: Google Analytics Setup](./07-google-analytics-setup.md)
