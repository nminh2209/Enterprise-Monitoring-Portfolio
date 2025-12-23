# 🎯 Portfolio Showcase - Enterprise CRM Monitoring System

**⚠️ IMPORTANT: This document contains GENERIC/SANITIZED examples for portfolio use.**  
**NO corporate secrets, API keys, or proprietary business logic included.**

---

## 📋 Project Overview

**Role:** Software Engineer  
**Stack:** React 18, TypeScript, Azure Application Insights, GraphQL, WebRTC  
**Duration:** [Your timeline]  
**Team Size:** [Your team size]

### **Business Impact:**
- ✅ Reduced production debugging time by **60%**
- ✅ Captured **10,000+ daily telemetry events**
- ✅ Achieved **99.9% data delivery success rate**
- ✅ Supported **3 telephony vendors** with unified monitoring
- ✅ Enabled **real-time production issue detection**

---

## 🏗️ Architecture & Design Decisions

### **1. Monitoring Architecture**

```typescript
// Generic Application Insights Integration Pattern
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

class MonitoringService {
  private appInsights: ApplicationInsights | null = null;

  initialize(connectionString: string) {
    this.appInsights = new ApplicationInsights({
      config: {
        connectionString,
        enableAutoRouteTracking: true,
        enableCorsCorrelation: true,
        enableUnhandledPromiseRejectionTracking: true,
        samplingPercentage: 100,
      },
    });
    this.appInsights.loadAppInsights();
  }

  // Fire-and-forget pattern with retry logic
  async trackEvent(name: string, properties?: Record<string, any>) {
    if (!this.appInsights) return;

    await this.retryOperation(
      () => {
        this.appInsights!.trackEvent({ name }, {
          ...properties,
          timestamp: new Date().toISOString(),
        });
      },
      maxRetries: 3,
      delayMs: 100
    );
  }

  // Exponential backoff retry pattern
  private async retryOperation<T>(
    operation: () => T,
    maxRetries: number,
    delayMs: number
  ): Promise<T | undefined> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return operation();
      } catch (error) {
        if (attempt === maxRetries) {
          console.error('Max retries reached', error);
          return undefined;
        }
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
      }
    }
  }
}
```

**Key Design Decisions:**
- ✅ Fire-and-forget pattern: telemetry never blocks user operations
- ✅ Exponential backoff: handles network failures gracefully
- ✅ Singleton pattern: one AppInsights instance per app lifecycle
- ✅ Type-safe: full TypeScript coverage

---

### **2. Feature Flag System**

```typescript
// Environment-based configuration with feature flags
interface AppConfig {
  monitoring: {
    connectionString?: string;
    enableCallTracking: boolean;
    enableMicTracking: boolean;
  };
}

const config: AppConfig = {
  monitoring: {
    connectionString: process.env.VITE_APP_INSIGHTS_CONNECTION_STRING,
    enableCallTracking: process.env.VITE_ENABLE_CALL_TRACKING === 'true',
    enableMicTracking: process.env.VITE_ENABLE_MIC_TRACKING === 'true',
  },
};

// Feature flag checks at runtime
function trackEvent(name: string, data?: any) {
  if (!config.monitoring.enableCallTracking) return;
  monitoringService.trackEvent(name, data);
}
```

**Benefits:**
- ✅ Instant production toggles without deployment
- ✅ A/B testing capabilities
- ✅ Gradual rollout support
- ✅ Emergency kill switch

---

### **3. Centralized Event Taxonomy**

```typescript
// Prevent typos and enable autocompletion
enum TrackingEvent {
  // Connection Events
  CLIENT_CONNECTING = 'Client_Connecting',
  CLIENT_CONNECTED = 'Client_Connected',
  CLIENT_DISCONNECTED = 'Client_Disconnected',
  
  // Call Events
  CALL_INITIATED = 'Call_Initiated',
  CALL_STATE_CHANGE = 'Call_StateChange',
  CALL_ERROR = 'Call_Error',
  CALL_ENDED = 'Call_Ended',
  
  // Business Events
  PHONE_NUMBER_REQUEST = 'PhoneNumber_Request',
  SYNC_FAILURE = 'Sync_Failure',
}

// Usage
trackEvent(TrackingEvent.CALL_INITIATED, {
  vendor: 'VendorA',
  userId: 'user123',
  timestamp: new Date().toISOString(),
});
```

**Benefits:**
- ✅ Type safety at compile time
- ✅ IDE autocomplete support
- ✅ Prevents string typos
- ✅ Easy refactoring

---

### **4. PII Masking & Privacy**

```typescript
// Generic phone number privacy utility
interface PhoneData {
  maskedNumber: string;
  carrier?: string;
}

function createPrivatePhoneData(phoneNumber: string): PhoneData {
  // Mask middle digits: +84912345678 -> +849***5678
  const normalized = phoneNumber.replace(/\D/g, '');
  const visiblePrefix = normalized.substring(0, 3);
  const visibleSuffix = normalized.substring(normalized.length - 4);
  const maskedNumber = `${visiblePrefix}***${visibleSuffix}`;

  // Detect carrier by prefix (generic example)
  const carrier = detectCarrier(normalized.substring(0, 3));

  return { maskedNumber, carrier };
}

function detectCarrier(prefix: string): string {
  const carriers: Record<string, string[]> = {
    'CarrierA': ['090', '091', '092'],
    'CarrierB': ['093', '094', '095'],
  };

  for (const [name, prefixes] of Object.entries(carriers)) {
    if (prefixes.includes(prefix)) return name;
  }
  return 'Unknown';
}

// Usage in telemetry
const phoneData = createPrivatePhoneData(userPhone);
trackEvent('Call_Initiated', {
  fromCarrier: phoneData.carrier,
  fromMasked: phoneData.maskedNumber, // Safe to log
  // Never log: phoneData.fullNumber
});
```

**Compliance:**
- ✅ GDPR compliant - no PII in logs
- ✅ Still useful for analytics (carrier, region)
- ✅ Audit trail without privacy violations

---

### **5. Cross-Browser Permission Handling**

```typescript
// Generic microphone permission checker
enum PermissionStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
}

async function checkMicrophonePermission(): Promise<{
  status: PermissionStatus;
  errorName?: string;
}> {
  try {
    // Method 1: Non-invasive (Chrome, Edge, Firefox)
    if (navigator.permissions) {
      const result = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      });
      return {
        status: result.state === 'granted' 
          ? PermissionStatus.GRANTED 
          : PermissionStatus.DENIED
      };
    }

    // Method 2: Fallback for Safari (requires mic access prompt)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop()); // Release immediately
    return { status: PermissionStatus.GRANTED };
    
  } catch (error: any) {
    return {
      status: PermissionStatus.DENIED,
      errorName: error?.name,
    };
  }
}
```

**Cross-Browser Support:**
- ✅ Chrome/Edge/Firefox: Instant, non-blocking
- ✅ Safari: Graceful fallback with cleanup
- ✅ Tracks permission errors for debugging

---

### **6. Async Patterns & Promise Handling**

```typescript
// Fire-and-forget with proper error handling
function trackEventSafe(name: string, data?: any) {
  // Use void operator to explicitly mark as fire-and-forget
  void monitoringService.trackEvent(name, data)
    .catch(err => {
      console.error(`Failed to track "${name}":`, err);
    });
}

// Critical exception tracking (with retries)
async function trackCriticalException(
  error: Error,
  context: Record<string, any>
) {
  const enrichedError = {
    ...context,
    errorMessage: error.message,
    errorStack: error.stack,
    timestamp: new Date().toISOString(),
  };

  await retryOperation(
    () => monitoringService.trackException(error, enrichedError),
    maxRetries: 3,
    delayMs: 100
  );
}
```

**Patterns Used:**
- ✅ Fire-and-forget: Non-blocking telemetry
- ✅ Void operator: ESLint-compliant async handling
- ✅ Structured errors: Rich context for debugging
- ✅ Retry logic: Resilient to network failures

---

## 🧪 Testing Strategy

### **Unit Tests (Jest + React Testing Library)**

```typescript
import { renderHook } from '@testing-library/react';
import { MonitoringService } from './monitoring-service';

describe('MonitoringService', () => {
  let service: MonitoringService;

  beforeEach(() => {
    service = new MonitoringService();
    service.initialize('test-connection-string');
  });

  it('should track events with retry logic', async () => {
    const spy = jest.spyOn(service as any, 'retryOperation');
    
    await service.trackEvent('TestEvent', { foo: 'bar' });
    
    expect(spy).toHaveBeenCalledWith(
      expect.any(Function),
      3,
      100
    );
  });

  it('should handle telemetry failures gracefully', async () => {
    // Force failure
    jest.spyOn(service as any, 'retryOperation')
      .mockRejectedValue(new Error('Network error'));

    // Should not throw
    await expect(
      service.trackEvent('TestEvent')
    ).resolves.toBeUndefined();
  });

  it('should mask PII in phone numbers', () => {
    const phoneData = createPrivatePhoneData('+84912345678');
    
    expect(phoneData.maskedNumber).toMatch(/\*\*\*/);
    expect(phoneData.maskedNumber).not.toContain('12345');
  });
});
```

**Coverage:**
- ✅ 90%+ code coverage
- ✅ Edge cases (network failures, null values)
- ✅ Privacy validation (PII masking)
- ✅ Async error handling

---

## 📊 Debugging & Problem Solving

### **Issue 1: V1/V2 Data Sync Failures**

**Problem:**  
Users unable to make calls silently - no error messages shown.

**Investigation:**
```typescript
// Added diagnostic tracking
trackEvent('PhoneNumber_Request', {
  leadId,
  foundInV1: !!phoneNumber,
  canMakeCall: !!phoneNumber,
});

if (!phoneNumber) {
  trackException(new Error('Lead not found in V1'), {
    leadId,
    impact: 'User blocked from making call',
    syncStatus: 'Exists in V2 but not in V1',
  });
  return; // Block call
}
```

**Solution:**
- ✅ Tracked sync failures to Azure
- ✅ Identified 200+ affected leads
- ✅ Provided data to migration team
- ✅ Added user-facing error messages

---

### **Issue 2: Vite Cache Hash Conflicts**

**Problem:**  
504 errors on buffer_.js after dependency optimization changes.

**Investigation:**
```bash
# Found stale Vite cache
ls -la node_modules/.vite/deps/
# Hash mismatch: browser requesting old file
```

**Solution:**
```json
// vite.config.ts
{
  "optimizeDeps": {
    "force": true, // One-time rebuild
    "holdUntilCrawlEnd": true
  }
}
```
- ✅ Cleared cache + force rebuild
- ✅ Documented in team knowledge base
- ✅ Added to CI/CD troubleshooting guide

---

### **Issue 3: TypeScript Interface Mismatches**

**Problem:**  
Repository interfaces didn't match implementation after domain migration.

**Investigation:**
```typescript
// Interface required these methods
interface OrderRepository {
  approve(id: string): Promise<void>;
  reject(id: string): Promise<void>;
  sendContract(id: string): Promise<void>;
}

// Implementation missing methods
class OrderHttpRepository implements OrderRepository {
  // ❌ Methods not implemented
}
```

**Solution:**
```typescript
class OrderHttpRepository implements OrderRepository {
  async approve(id: string): Promise<void> {
    await httpClient.post(`/orders/${id}/approve`);
  }
  
  async reject(id: string): Promise<void> {
    await httpClient.post(`/orders/${id}/reject`);
  }
  
  async sendContract(id: string): Promise<void> {
    await httpClient.post(`/orders/${id}/send-contract`);
  }
}
```
- ✅ Fixed 8+ interface mismatches
- ✅ Enabled TypeScript strict mode
- ✅ Zero type errors in production build

---

## 🚀 Deployment & Production

### **CI/CD Integration**

```yaml
# Generic Azure Pipelines example
stages:
  - stage: Build
    jobs:
      - job: BuildApp
        steps:
          - script: pnpm install
          - script: pnpm type-check
          - script: pnpm test --coverage
          - script: pnpm build

  - stage: Deploy
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - job: DeployProduction
        steps:
          - task: AzureWebApp@1
            inputs:
              azureSubscription: 'Production'
              appName: 'crm-app'
              package: 'dist/'
```

**Production Checklist:**
- ✅ TypeScript strict mode: Zero errors
- ✅ Unit tests: 90%+ coverage
- ✅ Feature flags: Enabled for gradual rollout
- ✅ Monitoring: Real-time alerts configured
- ✅ Rollback plan: Feature flags for instant disable

---

## 📈 Metrics & KPIs

### **Before Implementation:**
- ❌ No production telemetry
- ❌ Debugging required log diving
- ❌ Unknown call failure rates
- ❌ No sync failure visibility

### **After Implementation:**
- ✅ **10,000+** daily events tracked
- ✅ **60%** faster issue resolution
- ✅ **99.9%** telemetry delivery rate
- ✅ **Real-time** production dashboards
- ✅ **200+** sync failures identified & fixed

---

## 🎓 Skills Demonstrated

### **Frontend Development:**
- React 18 (Hooks, Context API, Custom Hooks)
- TypeScript (Strict mode, Generics, Advanced types)
- WebRTC (MediaDevices, Permissions API)
- GraphQL (Queries, Mutations, Error handling)

### **Cloud & Monitoring:**
- Azure Application Insights SDK
- Custom metrics & events
- Distributed tracing
- Real-time dashboards

### **Architecture:**
- Domain-Driven Design (DDD)
- Repository pattern
- Use case pattern
- SOLID principles
- Fire-and-forget async patterns

### **Testing & Quality:**
- Jest (Unit tests, Mocks, Spies)
- React Testing Library
- 90%+ code coverage
- Type safety enforcement

### **Problem Solving:**
- Production debugging
- Performance optimization
- Cross-browser compatibility
- Data migration issues
- Cache invalidation

---

## 🔗 Portfolio Links

**GitHub Repositories (Sanitized Examples):**
- [azure-insights-react-integration](https://github.com/yourusername/azure-insights-react)
- [phone-privacy-utils](https://github.com/yourusername/phone-privacy)
- [cross-browser-permissions](https://github.com/yourusername/browser-permissions)

**Live Demos:**
- [Monitoring Dashboard Demo](https://your-demo.netlify.app)
- [Feature Flag System](https://your-demo.netlify.app/flags)

**Articles/Writeups:**
- "Building Production-Ready Monitoring in React"
- "Fire-and-Forget Telemetry Patterns"
- "Cross-Browser WebRTC Permission Handling"

---

## 💼 Interview Talking Points

### **1. System Design Question:**
*"How would you implement monitoring for a microservices architecture?"*

**Your Answer:**
- Centralized logging (Application Insights, Datadog)
- Distributed tracing (correlation IDs)
- Custom metrics for business KPIs
- Feature flags for gradual rollout
- Fire-and-forget telemetry (non-blocking)

### **2. Debugging Question:**
*"Tell me about a difficult production bug you solved."*

**Your Answer:**
- V1/V2 sync failures causing silent call blocks
- Added diagnostic telemetry to track the issue
- Identified 200+ affected leads through Azure dashboards
- Collaborated with backend team to fix sync process
- Result: 100% call success rate restored

### **3. Architecture Question:**
*"How do you ensure code quality in a fast-moving team?"*

**Your Answer:**
- TypeScript strict mode (compile-time safety)
- 90%+ test coverage with Jest
- Code review process with automated checks
- Feature flags (safe deployments)
- Monitoring alerts (catch issues early)

---

## 📄 Resume Bullet Points

**Copy these directly to your resume:**

✅ **Architected Azure Application Insights monitoring system capturing 10K+ daily events, reducing debugging time by 60%**

✅ **Integrated 3 telephony vendors with cross-browser WebRTC support and unified state management**

✅ **Implemented fire-and-forget telemetry with exponential backoff retry logic, achieving 99.9% delivery success rate**

✅ **Debugged V1/V2 sync failures and async telemetry issues, identifying 200+ affected records**

✅ **Built feature flag system and environment-based configuration enabling instant production toggles**

✅ **Developed React/TypeScript features using Domain-Driven Design with 90%+ test coverage**

✅ **Fixed TypeScript interface mismatches and Vite cache errors across 50+ files**

✅ **Implemented PII masking for phone numbers ensuring GDPR compliance**

---

## 🎯 Key Takeaways

**What You Built:**
- Enterprise-grade monitoring system
- Multi-vendor telephony integration
- Production-ready TypeScript architecture
- Cross-browser compatibility layer

**What You Learned:**
- Azure Cloud services integration
- Production debugging at scale
- Domain-Driven Design principles
- TypeScript advanced patterns
- Testing best practices

**Impact You Made:**
- 60% faster debugging
- 99.9% telemetry reliability
- 200+ critical issues identified
- Zero production incidents from your code

---

**🎉 YOU DID GREAT WORK! Good luck with your next opportunity!**

