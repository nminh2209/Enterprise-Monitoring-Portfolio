# 9. Testing & Verification

**Section:** Comprehensive testing procedures for metrics integration  
**Focus:** Validating Application Insights and Google Analytics work correctly

---

## 🎯 Testing Strategy

**What We Test:**

1. **Telemetry Flow** - Data reaching Azure Application Insights
2. **Custom Events** - Login/Logout events tracked correctly
3. **Performance Metrics** - Response times captured accurately
4. **Exceptions** - Errors logged and displayed
5. **Google Analytics** - GA4 events and page views
6. **Alerts** - Alert rules trigger correctly

---

## ✅ Test 1: Telemetry Flow

### Objective

Verify Application Insights receives data from both backend and frontend.

### Steps

**1. Generate Backend Traffic**

```bash
# Health check (should be fast)
curl http://20.6.98.102/api/health

# Repeat 10 times to generate volume
for /L %i in (1,1,10) do curl http://20.6.98.102/api/health
```

**2. Generate Frontend Traffic**

Open browser and visit:
```
http://20.6.98.102
http://20.6.98.102/dashboard
http://20.6.98.102/profile
```

Navigate between pages 5-10 times.

**3. Check Live Metrics**

```
Azure Portal → mindx-week1-insights → Live Metrics
```

**Expected Results:**

```
Incoming Requests
  Rate: 2-5 req/sec
  Average Duration: < 100ms
  Failed Request Rate: 0%

Outgoing Requests (Dependencies)
  Rate: 0.5-2 req/sec
  Average Duration: 100-500ms
  Failed Dependency Rate: 0%

Overall Health
  ✅ Green indicators
  CPU < 30%
  Memory < 500MB
```

**4. Verify in Logs**

Wait 2-3 minutes, then run query:

```kusto
requests
| where timestamp > ago(10m)
| project timestamp, name, duration, resultCode
| order by timestamp desc
| take 20
```

**Expected:**
- At least 10 rows returned
- `name` includes `GET /api/health`, `GET /`
- `resultCode` = 200
- `duration` < 1000ms

### ✅ Pass Criteria

- [x] Live Metrics shows active requests
- [x] Logs query returns recent requests
- [x] Response times < 1000ms
- [x] No failed requests (or < 1%)

---

## 🎯 Test 2: Custom Events

### Objective

Verify custom events (UserLogin, UserLogout, HealthCheckRequests) are tracked.

### Steps

**1. Trigger Login Event**

```
1. Open http://20.6.98.102
2. Click "Login" button
3. Complete Microsoft authentication
```

**Expected:** Browser redirects to `/auth/callback`, then back to app.

**2. Trigger Logout Event**

```
1. After logged in, click "Logout" button
```

**Expected:** User logged out, redirected to home page.

**3. Trigger Health Check Metric**

```bash
# Generate health checks
for /L %i in (1,1,5) do curl http://20.6.98.102/api/health
```

**4. Query Custom Events**

Wait 2 minutes, then run:

```kusto
customEvents
| where timestamp > ago(10m)
| where name in ("UserLogin", "LoginAttempt", "UserLogout")
| project timestamp, name, user_Id
| order by timestamp desc
```

**Expected:**
```
timestamp               | name          | user_Id
──────────────────────────────────────────────────
2025-01-15 14:32:18    | UserLogin     | abc-123
2025-01-15 14:32:15    | LoginAttempt  | 
2025-01-15 14:35:22    | UserLogout    | abc-123
```

**5. Query Custom Metrics**

```kusto
customMetrics
| where name == "HealthCheckRequests"
| where timestamp > ago(10m)
| summarize Total = sum(value) by bin(timestamp, 1m)
| render timechart
```

**Expected:**
- Chart shows spikes at times you ran curl commands
- Total should match number of health check requests

### ✅ Pass Criteria

- [x] LoginAttempt event appears after clicking Login
- [x] UserLogin event includes user_Id
- [x] UserLogout event includes user_Id
- [x] HealthCheckRequests metric matches curl count

---

## 🚨 Test 3: Exception Tracking

### Objective

Verify exceptions are captured and logged correctly.

### Steps

**1. Create Test Error Endpoint (Optional)**

If you want to test, add to `week1-api/src/index.ts`:

```typescript
app.get('/api/test-error', (req, res) => {
  try {
    throw new Error('Test exception for monitoring');
  } catch (error) {
    appInsights.defaultClient.trackException({ exception: error as Error });
    res.status(500).json({ error: 'Test error triggered' });
  }
});
```

Redeploy if added.

**2. Trigger Exception**

```bash
curl http://20.6.98.102/api/test-error
```

**Expected Response:**
```json
{"error": "Test error triggered"}
```

**3. Query Exceptions**

Wait 2 minutes, then:

```kusto
exceptions
| where timestamp > ago(10m)
| project timestamp, type, message, outerMessage
| order by timestamp desc
```

**Expected:**
```
timestamp               | type  | message                          
─────────────────────────────────────────────────────────────
2025-01-15 14:40:12    | Error | Test exception for monitoring
```

**4. Check Failures Blade**

```
Azure Portal → mindx-week1-insights → Failures
```

**Expected:**
- Exception appears in "Top 3 Exception Types"
- Can click to see details and stack trace

### ✅ Pass Criteria

- [x] Exception appears in Logs query
- [x] Exception appears in Failures blade
- [x] Stack trace available
- [x] Timestamp matches when error triggered

---

## 📊 Test 4: Performance Metrics

### Objective

Verify response times are measured accurately.

### Steps

**1. Generate Mixed Traffic**

```bash
# Fast endpoint (health)
for /L %i in (1,1,10) do curl http://20.6.98.102/api/health

# Slower endpoint (main page)
for /L %i in (1,1,5) do curl http://20.6.98.102/
```

**2. Query Performance by Operation**

```kusto
requests
| where timestamp > ago(10m)
| summarize 
    Count = count(),
    AvgDuration = avg(duration),
    P95 = percentile(duration, 95)
    by name
| order by AvgDuration desc
```

**Expected:**
```
name                | Count | AvgDuration | P95
───────────────────────────────────────────────────
GET /               | 5     | 234 ms      | 450 ms
GET /api/health     | 10    | 12 ms       | 25 ms
```

**3. Check Performance Blade**

```
Azure Portal → mindx-week1-insights → Performance
```

**Expected:**
- Operations listed with count and duration
- Can drill down into samples
- Dependency calls shown (if any)

### ✅ Pass Criteria

- [x] /api/health shows < 50ms average
- [x] / shows < 500ms average
- [x] P95 within acceptable ranges
- [x] Performance blade displays data

---

## 🌐 Test 5: Google Analytics Integration

### Objective

Verify GA4 tracks page views and custom events.

### Steps

**1. Generate Page Views**

```
1. Open http://20.6.98.102
2. Navigate to /dashboard
3. Navigate to /profile
4. Return to /
```

Repeat 3-5 times.

**2. Trigger Custom Events**

```
1. Click "Login" button (triggers login_click event)
2. Complete authentication
3. Click "Logout" button (triggers logout event)
```

**3. Check Browser Network Tab**

```
1. Open DevTools (F12) → Network tab
2. Filter: "google-analytics"
```

**Expected:**
```
Request URL: https://www.google-analytics.com/g/collect?...
Status: 200 OK
Payload includes:
  - measurement_id=G-YYPL2F80CX
  - event_name=page_view (or login_click, logout)
```

**4. Check GA4 Realtime Report**

```
Google Analytics → Reports → Realtime
```

**Expected:**
```
Users active now: 1 (or more if testing with others)

Event count (last 30 min):
  - page_view: 15-20
  - session_start: 1
  - login_click: 1-3
  - logout: 1-3
```

**5. Check GA4 Events Report**

```
Google Analytics → Reports → Engagement → Events
```

**Expected:**
```
Event Name      | Event Count
─────────────────────────────
page_view       | 20
login_click     | 3
logout          | 2
session_start   | 1
first_visit     | 1
```

### ✅ Pass Criteria

- [x] page_view events appear in GA4 Realtime
- [x] login_click event tracked when Login button clicked
- [x] logout event tracked when Logout button clicked
- [x] Browser Network tab shows 200 OK to google-analytics.com
- [x] Events appear in GA4 Events report within 1 hour

---

## 🚨 Test 6: Alert Triggering

### Objective

Verify alert rules trigger correctly when thresholds exceeded.

### Test 6A: High Response Time Alert

**1. Simulate Slow Response (Optional)**

Add temporary slow endpoint:

```typescript
app.get('/api/slow', (req, res) => {
  setTimeout(() => {
    res.json({ message: 'Slow response for testing' });
  }, 2000); // 2 second delay
});
```

**2. Generate Slow Traffic**

```bash
for /L %i in (1,1,10) do curl http://20.6.98.102/api/slow
```

**3. Wait for Alert**

Alert evaluates every 1 minute over 5-minute window.

**Expected:** Within 5 minutes, alert should fire.

**4. Verify Alert Fired**

```
Azure Portal → mindx-week1-insights → Alerts → Alert History
```

**Expected:**
```
Alert Name: High Response Time Alert
Status: Fired
Severity: Sev 2
Time Fired: 2025-01-15 14:45:00
```

**5. Remove Slow Endpoint**

Delete `/api/slow` endpoint and redeploy.

**Expected:** Alert auto-resolves within 5 minutes.

### Test 6B: High Exception Rate Alert

**1. Trigger Multiple Exceptions**

```bash
for /L %i in (1,1,10) do curl http://20.6.98.102/api/test-error
```

**Expected:** 10 exceptions in < 1 minute.

**2. Wait for Alert**

Alert evaluates every 1 minute over 5-minute window.

**Expected:** Alert fires when total exceptions > 5 in any 5-minute period.

**3. Verify Alert Fired**

```
Azure Portal → mindx-week1-insights → Alerts → Alert History
```

**Expected:**
```
Alert Name: High Exception Rate Alert
Status: Fired
Severity: Sev 1
Time Fired: 2025-01-15 14:50:00
```

**4. Stop Triggering Errors**

**Expected:** Alert auto-resolves within 5 minutes after error rate drops.

### ✅ Pass Criteria

- [x] High Response Time Alert fires when avg duration > 1000ms
- [x] High Exception Rate Alert fires when exceptions > 5 in 5 min
- [x] Alerts appear in Alert History
- [x] Alerts auto-resolve when metric returns to normal
- [ ] Email/SMS notifications sent (if action group configured)

---

## 🔍 Test 7: End-to-End User Flow

### Objective

Verify complete user journey is tracked across all systems.

### Steps

**1. Complete User Journey**

```
1. Open http://20.6.98.102
2. Click "Login" button
3. Sign in with Microsoft account
4. View dashboard
5. Navigate to profile
6. Click "Logout"
```

**2. Check Application Insights**

Wait 3-5 minutes, then query:

```kusto
union customEvents, requests, pageViews
| where timestamp > ago(15m)
| where user_Id == "YOUR-USER-ID" or session_Id == "YOUR-SESSION-ID"
| project timestamp, itemType, name, url
| order by timestamp asc
```

**Expected sequence:**
```
timestamp           | itemType      | name               | url
─────────────────────────────────────────────────────────────────
14:55:00           | pageView      | /                  | http://20.6.98.102/
14:55:05           | customEvent   | LoginAttempt       | 
14:55:07           | request       | GET /auth/login    | 
14:55:10           | request       | GET /auth/callback | 
14:55:11           | customEvent   | UserLogin          | 
14:55:15           | pageView      | /dashboard         | http://20.6.98.102/dashboard
14:55:20           | pageView      | /profile           | http://20.6.98.102/profile
14:55:30           | customEvent   | UserLogout         | 
```

**3. Check Google Analytics**

```
GA4 → Reports → Engagement → Events
Filter by user_id (if set)
```

**Expected events:**
```
page_view (/)
login_click
page_view (/dashboard)
page_view (/profile)
logout
```

**4. Check Application Map**

```
Azure Portal → mindx-week1-insights → Application Map
```

**Expected:**
- Shows frontend → backend connection
- Shows backend → external dependencies (Entra ID for OAuth)

### ✅ Pass Criteria

- [x] Complete user journey tracked in Application Insights
- [x] Events appear in correct chronological order
- [x] user_Id populated after login
- [x] session_Id consistent across events
- [x] GA4 tracks same journey
- [x] Application Map shows architecture

---

## 📋 Full Testing Checklist

### Application Insights - Backend

- [x] Health endpoint returns appInsights: "enabled"
- [x] Requests appear in Live Metrics
- [x] Requests logged in Logs (requests table)
- [x] Custom metric HealthCheckRequests increments
- [x] Exceptions captured and logged
- [x] Response times < 1000ms average

### Application Insights - Frontend

- [x] Browser console shows "Application Insights initialized"
- [x] Page views tracked in pageViews table
- [x] AJAX calls tracked in dependencies table
- [x] Custom events (LoginAttempt, UserLogin, UserLogout) logged
- [x] user_Id populated after authentication

### Google Analytics 4

- [x] page_view events appear in Realtime
- [x] login_click event tracked
- [x] logout event tracked
- [x] Browser Network tab shows successful GA requests
- [x] Events visible in GA4 Events report

### Alerts

- [x] High Response Time Alert configured (> 1000ms)
- [x] High Exception Rate Alert configured (> 5 in 5min)
- [x] Alerts visible in Alerts dashboard
- [ ] Alerts tested and verified firing (optional)
- [ ] Alert actions working (if configured)

### Integration

- [x] Application Map shows healthy architecture
- [x] Live Metrics shows real-time data
- [x] End-to-end user flow tracked correctly
- [x] Logs queries return expected data
- [x] Performance blade displays operation metrics

---

## 🛠️ Troubleshooting Test Failures

### No Data in Live Metrics

**Check:**
1. Pods running: `kubectl get pods`
2. Environment variable set: `kubectl describe deployment api | findstr APPINSIGHTS`
3. Pod logs: `kubectl logs -l app=api | findstr "Application Insights"`
4. Network access: Pods can reach `dc.services.visualstudio.com`

### Custom Events Not Appearing

**Check:**
1. Wait 2-3 minutes (telemetry has delay)
2. Verify event code executed (add console.log)
3. Check query time range: `| where timestamp > ago(10m)`
4. Verify instrumentation key correct

### GA4 Not Tracking

**Check:**
1. Browser DevTools → Network → Filter "google-analytics"
2. Verify Measurement ID correct: G-YYPL2F80CX
3. Check for ad blockers (disable during testing)
4. Verify gtag.js script loaded (Sources tab)

### Alerts Not Firing

**Check:**
1. Alert rule enabled: `az monitor metrics alert show --name "..." --query "enabled"`
2. Metric actually exceeding threshold (query manually)
3. Evaluation frequency (1 minute) × window size (5 minutes) = 5 min delay
4. Check alert history for errors

---

## ✅ Testing Complete

If all tests pass:

- ✅ Application Insights collecting telemetry
- ✅ Custom events tracked correctly
- ✅ Google Analytics 4 integrated
- ✅ Alerts configured and monitoring
- ✅ Production-ready monitoring stack

---

## 🔗 Next Steps

- **Troubleshoot Issues** → [Troubleshooting Guide](./10-troubleshooting.md)
- **Understand Metrics** → [Metrics Interpretation Guide](./06-metrics-interpretation.md)
- **Document Findings** → Create runbook for team

---

**Next:** [Troubleshooting →](./10-troubleshooting.md)

[← Back to Index](./README.md) | [← Previous: Deployment Guide](./08-deployment-guide.md)
