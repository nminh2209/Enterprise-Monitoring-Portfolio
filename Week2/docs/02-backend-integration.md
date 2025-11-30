# 2. Backend Integration (Node.js/Express)

**Section:** Application Insights SDK integration for backend API  
**Focus:** Server-side telemetry and custom event tracking

---

## 📦 Dependencies

### Package Installation

```json
{
  "dependencies": {
    "applicationinsights": "^2.9.5"
  }
}
```

**Note:** We use v2.9.5 instead of v3.x due to compatibility issues with Alpine Linux containers. See [Troubleshooting Guide](./10-troubleshooting.md#crypto-error-fix) for details.

### Install Command

```bash
cd week1-api
npm install applicationinsights@2.9.5
```

---

## ⚙️ Implementation

### Initialization (CRITICAL ORDER)

**File:** `week1-api/src/index.ts`

**⚠️ IMPORTANT:** Application Insights MUST be initialized FIRST, before any other imports.

```typescript
// Initialize Application Insights FIRST before any other imports
import * as appInsights from 'applicationinsights';

// Setup Application Insights with instrumentation key
const APPINSIGHTS_INSTRUMENTATIONKEY = process.env.APPINSIGHTS_INSTRUMENTATIONKEY || 
  'f97d9fcc-bf08-46d9-985c-458c6fa4ce7a';

if (APPINSIGHTS_INSTRUMENTATIONKEY) {
  appInsights.setup(APPINSIGHTS_INSTRUMENTATIONKEY)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true)
    .setUseDiskRetryCaching(true)
    .setSendLiveMetrics(true)
    .start();
  
  console.log('✅ Application Insights initialized');
}

// NOW import other modules
import express from 'express';
import cors from 'cors';
// ... rest of your imports
```

### Configuration Options Explained

| Option | Purpose | Value |
|--------|---------|-------|
| `setAutoDependencyCorrelation(true)` | Links related telemetry together | Enabled |
| `setAutoCollectRequests(true)` | Track all HTTP requests | Enabled |
| `setAutoCollectPerformance(true, true)` | Collect performance counters | Enabled (extended) |
| `setAutoCollectExceptions(true)` | Capture unhandled exceptions | Enabled |
| `setAutoCollectDependencies(true)` | Track external calls | Enabled |
| `setAutoCollectConsole(true)` | Capture console.log() | Enabled |
| `setUseDiskRetryCaching(true)` | Retry failed sends | Enabled |
| `setSendLiveMetrics(true)` | Enable Live Metrics Stream | Enabled |

---

## 🎯 Custom Event Tracking

### 1. Track User Login Success

```typescript
// After successful authentication
const telemetryClient = appInsights.defaultClient;

if (telemetryClient) {
  telemetryClient.trackEvent({
    name: 'UserLogin',
    properties: {
      userId: userInfo.sub,
      email: userInfo.email,
      username: userInfo.preferred_username,
      authMethod: 'OpenID',
    },
  });
}
```

**What it tracks:**
- Event name: `UserLogin`
- User identifier (sub)
- Email address
- Username
- Authentication method

### 2. Track Authentication Failures

```typescript
// In catch block of auth callback
if (telemetryClient) {
  telemetryClient.trackException({
    exception: error instanceof Error ? error : new Error(String(error)),
    properties: {
      endpoint: '/auth/callback',
      errorType: 'AuthenticationFailure',
    },
  });
}
```

**What it tracks:**
- Exception details with stack trace
- Endpoint where error occurred
- Error classification

### 3. Track User Logout

```typescript
// On logout endpoint
if (telemetryClient) {
  telemetryClient.trackEvent({
    name: 'UserLogout',
    properties: {
      userId: user?.sub,
      username: user?.preferred_username,
    },
  });
}
```

### 4. Track Custom Metrics (Health Checks)

```typescript
// Health endpoint
app.get('/health', (req, res) => {
  const telemetryClient = appInsights.defaultClient;
  
  if (telemetryClient) {
    telemetryClient.trackMetric({
      name: 'HealthCheckRequests',
      value: 1,
    });
  }
  
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'week1-api',
    appInsights: APPINSIGHTS_INSTRUMENTATIONKEY ? 'enabled' : 'disabled'
  });
});
```

---

## 📊 Automatic Telemetry Collected

### HTTP Requests

**What's collected automatically:**
- Request URL and method
- Response status code
- Response time (duration)
- Client IP address
- User agent
- Request headers (configurable)

**Example query:**
```kusto
requests
| where timestamp > ago(1h)
| project timestamp, name, url, duration, resultCode
| order by duration desc
```

### Dependencies

**External calls tracked:**
- HTTP/HTTPS requests to external services
- Database queries (if using supported drivers)
- Redis operations
- Message queue operations

**Example:**
- MindX OpenID authentication calls
- Any API calls your backend makes

### Exceptions

**Automatically captured:**
- Unhandled exceptions
- Promise rejections
- Runtime errors

**Includes:**
- Stack trace
- Exception type
- Error message
- Request context

### Performance Counters

**Metrics collected:**
- Process CPU percentage
- Process memory usage
- Available memory
- Request rate
- Request duration

---

## 🔍 Query Examples

### All Login Events (Last Hour)

```kusto
customEvents
| where name == "UserLogin"
| where timestamp > ago(1h)
| project timestamp, 
          userId = customDimensions.userId,
          email = customDimensions.email,
          username = customDimensions.username
| order by timestamp desc
```

### Authentication Failures

```kusto
exceptions
| where customDimensions.errorType == "AuthenticationFailure"
| project timestamp, 
          message, 
          endpoint = customDimensions.endpoint
| order by timestamp desc
```

### Slowest API Endpoints

```kusto
requests
| where timestamp > ago(24h)
| summarize 
    avgDuration = avg(duration),
    count = count()
    by name
| order by avgDuration desc
| take 10
```

### Health Check Frequency

```kusto
customMetrics
| where name == "HealthCheckRequests"
| summarize sum(value) by bin(timestamp, 5m)
| render timechart
```

---

## ✅ Verification

### 1. Check Initialization Logs

```bash
kubectl logs deployment/week1-api-deployment --tail=20
```

**Expected output:**
```
✅ Application Insights initialized
✅ OpenID Connect client initialized
🚀 Week 1 API server is running on port 3000
```

### 2. Test Health Endpoint

```bash
curl https://mindx-minhnh.135.171.192.18.nip.io/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-30T...",
  "service": "week1-api",
  "appInsights": "enabled"
}
```

### 3. Verify Telemetry in Azure Portal

1. Go to Application Insights → Monitoring → Logs
2. Run query:
   ```kusto
   requests
   | where timestamp > ago(10m)
   | where name contains "health"
   | take 10
   ```
3. Should see recent health check requests

---

## 🎓 Best Practices

### 1. Initialize Early
✅ **DO:** Initialize App Insights before any other imports  
❌ **DON'T:** Import App Insights in the middle of your file

### 2. Use Environment Variables
✅ **DO:** Use `process.env.APPINSIGHTS_INSTRUMENTATIONKEY`  
❌ **DON'T:** Hardcode keys in production

### 3. Add Context to Events
✅ **DO:** Include relevant properties with events  
❌ **DON'T:** Track events without context

```typescript
// Good
telemetryClient.trackEvent({
  name: 'UserLogin',
  properties: {
    userId: user.id,
    method: 'OpenID',
    source: 'web'
  }
});

// Bad
telemetryClient.trackEvent({ name: 'Login' });
```

### 4. Handle Errors Gracefully
```typescript
try {
  // Your code
} catch (error) {
  if (telemetryClient) {
    telemetryClient.trackException({
      exception: error instanceof Error ? error : new Error(String(error)),
      properties: { context: 'additional info' }
    });
  }
  throw error; // Re-throw if needed
}
```

---

## 📝 Code Checklist

- [x] applicationinsights package installed (v2.9.5)
- [x] Initialized FIRST before other imports
- [x] Auto-collection enabled for requests, dependencies, exceptions
- [x] Live Metrics enabled
- [x] Custom events for login/logout implemented
- [x] Exception tracking in catch blocks
- [x] Health check includes appInsights status
- [x] Environment variable for instrumentation key

---

## 🔗 Next Steps

- **Frontend Integration** → [Frontend Integration Guide](./03-frontend-integration.md)
- **View Metrics** → [Azure Portal Access Guide](./05-azure-portal-access.md)
- **Troubleshooting** → [Troubleshooting Guide](./10-troubleshooting.md)

---

**Next:** [Frontend Integration →](./03-frontend-integration.md)

[← Back to Index](./README.md) | [← Previous: Overview](./01-overview-setup.md)
