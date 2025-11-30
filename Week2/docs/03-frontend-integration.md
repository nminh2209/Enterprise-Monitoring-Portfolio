# 3. Frontend Integration (React)

**Section:** Application Insights SDK integration for React frontend  
**Focus:** Client-side telemetry and browser-based tracking

---

## 📦 Dependencies

### Packages Required

```json
{
  "dependencies": {
    "@microsoft/applicationinsights-react-js": "^19.3.8",
    "@microsoft/applicationinsights-web": "^3.3.5",
    "history": "^5.3.0"
  }
}
```

### Installation

```bash
cd week1-frontend
npm install @microsoft/applicationinsights-react-js @microsoft/applicationinsights-web history
```

**Note:** We use `--legacy-peer-deps` in Dockerfile due to React 18 vs React 19 peer dependency conflicts.

---

## ⚙️ Configuration File

### Create appInsights.ts

**File:** `week1-frontend/src/appInsights.ts`

```typescript
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { createBrowserHistory } from 'history';

// Create browser history for route tracking
const browserHistory = createBrowserHistory();

// Create React plugin instance
const reactPlugin = new ReactPlugin();

// Initialize Application Insights
const appInsights = new ApplicationInsights({
  config: {
    connectionString: 'InstrumentationKey=f97d9fcc-bf08-46d9-985c-458c6fa4ce7a;IngestionEndpoint=https://southeastasia-1.in.applicationinsights.azure.com/;LiveEndpoint=https://southeastasia.livediagnostics.monitor.azure.com/;ApplicationId=95976a35-6e1c-4dff-bc84-3b4cbcc8b360',
    extensions: [reactPlugin],
    extensionConfig: {
      [reactPlugin.identifier]: { history: browserHistory }
    },
    enableAutoRouteTracking: true,
    disableFetchTracking: false,
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true,
  }
});

appInsights.loadAppInsights();

export { reactPlugin, appInsights };
```

### Configuration Options Explained

| Option | Purpose | Value |
|--------|---------|-------|
| `connectionString` | App Insights connection details | Full connection string |
| `extensions` | Plugins to load | React Plugin for SPA tracking |
| `enableAutoRouteTracking` | Track route changes | true |
| `disableFetchTracking` | Track fetch/XHR calls | false (tracking enabled) |
| `enableRequestHeaderTracking` | Include request headers | true |
| `enableResponseHeaderTracking` | Include response headers | true |

---

## 🔌 Integration in App Component

### Update App.tsx

**File:** `week1-frontend/src/App.tsx`

```typescript
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { appInsights } from './appInsights'; // Import App Insights

function App() {
  useEffect(() => {
    console.log('Application Insights initialized in React');
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Your routes */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
```

---

## 🎯 Custom Event Tracking

### In AuthContext (Login/Logout)

**File:** `week1-frontend/src/contexts/AuthContext.tsx`

```typescript
import { appInsights } from '../appInsights';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
  const login = async () => {
    // Track login attempt
    appInsights.trackEvent({ name: 'LoginAttempt' });
    
    // Also send to Google Analytics if available
    if (window.gtag) {
      window.gtag('event', 'login_click', {
        event_category: 'Authentication',
        event_label: 'Login Button Click'
      });
    }
    
    // Redirect to login
    window.location.href = `${API_URL}/auth/login`;
  };

  const logout = () => {
    // Track logout with user details
    appInsights.trackEvent({ 
      name: 'UserLogout',
      properties: {
        userId: user?.sub,
        username: user?.preferred_username
      }
    });
    
    // Also send to Google Analytics
    if (window.gtag) {
      window.gtag('event', 'logout', {
        user_id: user?.sub
      });
    }
    
    // Clear user state
    setUser(null);
    localStorage.removeItem('user');
  };

  // ... rest of context
};
```

---

## 📊 Automatic Telemetry Collected

### Page Views

**Automatically tracked:**
- Route changes in React Router
- Initial page load
- Browser navigation (back/forward)

**Customization:**
```typescript
// Manual page view tracking (if needed)
appInsights.trackPageView({ name: 'Dashboard', uri: '/dashboard' });
```

### AJAX/Fetch Calls

**Automatically tracked:**
- All fetch() requests
- XMLHttpRequest calls
- Response times
- Success/failure status

**Example:**
- API calls to `/api/health`
- Authentication redirects
- Data fetching

### Browser Performance

**Metrics collected:**
- Page load time
- DOM processing time
- Network latency
- Resource load times

### JavaScript Errors

**Automatically captured:**
- Unhandled exceptions
- Promise rejections
- React error boundaries (if configured)

---

## 🌐 Google Analytics Integration

### Add gtag.js to HTML

**File:** `week1-frontend/public/index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    
    <!-- Google Analytics 4 -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-YYPL2F80CX"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-YYPL2F80CX');
    </script>
    
    <title>Week 1 MindX Frontend</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

### TypeScript Declarations

**File:** `week1-frontend/src/gtag.d.ts`

```typescript
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'set',
      targetId: string,
      config?: Record<string, any>
    ) => void;
    dataLayer: any[];
  }
}

export {};
```

---

## 🔍 Query Examples

### Page Views by Page

```kusto
pageViews
| where timestamp > ago(24h)
| summarize views = count() by name
| order by views desc
```

### User Journey Analysis

```kusto
pageViews
| where timestamp > ago(1h)
| where user_Id != ""
| order by timestamp asc
| project timestamp, name, user_Id
```

### AJAX Call Performance

```kusto
dependencies
| where type == "Ajax"
| where timestamp > ago(1h)
| summarize 
    avgDuration = avg(duration),
    count = count()
    by target
| order by avgDuration desc
```

### Browser Exceptions

```kusto
exceptions
| where client_Type == "Browser"
| project timestamp, problemId, message, outerMessage
| order by timestamp desc
| take 20
```

---

## 🛠️ Dockerfile Update

### Handle Peer Dependencies

**File:** `week1-frontend/Dockerfile`

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./

# Use --legacy-peer-deps to handle React version conflicts
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine AS production
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Why --legacy-peer-deps?**
- @microsoft/applicationinsights-react-js@19.3.8 requires React >=19.0.0
- Project uses React 18.3.1
- Flag allows mismatched peer dependencies

---

## ✅ Verification

### 1. Check Browser Console

Open DevTools (F12) → Console:
```
Application Insights initialized in React
```

### 2. Network Tab Verification

DevTools → Network → Filter by "dc.services":
- Should see POST requests to `dc.services.visualstudio.com`
- Status: 200 OK
- Contains telemetry data

### 3. Test Page View Tracking

1. Navigate between pages in your app
2. Go to Azure Portal → Application Insights → Logs
3. Run query:
   ```kusto
   pageViews
   | where timestamp > ago(10m)
   | project timestamp, name, url
   | order by timestamp desc
   ```

### 4. Test Custom Events

1. Click Login button
2. Wait 1-2 minutes
3. Query:
   ```kusto
   customEvents
   | where name == "LoginAttempt"
   | where timestamp > ago(10m)
   ```

---

## 🎓 Best Practices

### 1. Use React Plugin

✅ **DO:** Use React Plugin for automatic route tracking  
❌ **DON'T:** Manually track every route change

### 2. Track Meaningful Events

✅ **DO:** Track business-critical user actions  
❌ **DON'T:** Track every button click

```typescript
// Good - meaningful business event
appInsights.trackEvent({ 
  name: 'PurchaseCompleted',
  properties: { amount: 99.99, currency: 'USD' }
});

// Bad - too granular
appInsights.trackEvent({ name: 'MouseMoved' });
```

### 3. Include User Context

```typescript
// Set authenticated user context
appInsights.setAuthenticatedUserContext(user.sub, user.email);

// Events will now include user info automatically
appInsights.trackEvent({ name: 'FeatureUsed' });
```

### 4. Handle Errors in React

```typescript
// Error boundary with App Insights
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    appInsights.trackException({
      exception: error,
      properties: errorInfo
    });
  }
}
```

---

## 📝 Integration Checklist

- [x] Application Insights packages installed
- [x] appInsights.ts configuration file created
- [x] Imported in App.tsx
- [x] React Plugin configured with history
- [x] Custom events in AuthContext
- [x] Google Analytics script added to index.html
- [x] gtag.d.ts TypeScript declarations created
- [x] Dockerfile updated with --legacy-peer-deps
- [x] Browser console shows initialization

---

## 🔗 Next Steps

- **Configure Alerts** → [Alerts Configuration Guide](./04-alerts-configuration.md)
- **Access Dashboards** → [Azure Portal Access Guide](./05-azure-portal-access.md)
- **Google Analytics** → [GA4 Setup Guide](./07-google-analytics-setup.md)

---

**Next:** [Alerts Configuration →](./04-alerts-configuration.md)

[← Back to Index](./README.md) | [← Previous: Backend Integration](./02-backend-integration.md)
