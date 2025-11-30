# 10. Troubleshooting Guide

**Section:** Common issues and solutions  
**Focus:** Debugging Application Insights and Google Analytics integration

---

## 🚨 Critical Issue: Crypto Error (RESOLVED)

### Symptom

```
ReferenceError: crypto is not defined
    at OpenTelemetrySpanProcessor
    at Module._compile
```

### Root Cause

Application Insights SDK v3.x uses OpenTelemetry which requires Node.js `crypto` module. Alpine Linux containers don't have this available by default.

### Solution ✅

**Downgrade to v2.9.5:**

```json
{
  "dependencies": {
    "applicationinsights": "^2.9.5"  // NOT ^3.12.1
  }
}
```

**Update initialization:**

```typescript
// ❌ OLD (v3.x style)
appInsights.setup(connectionString)
  .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
  .setAutoCollectConsole(true, true)
  .start();

// ✅ NEW (v2.x style)
process.env.APPINSIGHTS_INSTRUMENTATIONKEY = 'f97d9fcc-bf08-46d9-985c-458c6fa4ce7a';
appInsights.setup()
  .setAutoCollectConsole(true)
  .start();
```

**Rebuild and redeploy:**

```bash
docker build -t week1-api:v16-appinsights-fixed .
docker push mindxweek1.azurecr.io/week1-api:v16-appinsights-fixed
kubectl apply -f api-deployment.yaml
```

### Verification

```bash
kubectl logs -l app=api --tail=20
```

**Expected:**
```
✅ Application Insights initialized
Instrumentation Key: f97d9fcc-bf08-46d9-985c-458c6fa4ce7a
```

**No more crypto errors!**

---

## 📊 Issue: Empty Dashboards / No Data

### Symptom

- Live Metrics shows "No data"
- Logs queries return 0 results
- Application Map empty

### Possible Causes & Solutions

#### Cause 1: Telemetry Not Initialized

**Check pod logs:**

```bash
kubectl logs -l app=api | findstr "Application Insights"
```

**Expected:**
```
✅ Application Insights initialized
```

**If missing:**

1. Verify environment variable set:
   ```bash
   kubectl describe deployment api | findstr APPINSIGHTS_INSTRUMENTATIONKEY
   ```

2. Verify instrumentation key correct:
   ```yaml
   env:
   - name: APPINSIGHTS_INSTRUMENTATIONKEY
     value: "f97d9fcc-bf08-46d9-985c-458c6fa4ce7a"
   ```

3. Redeploy if needed:
   ```bash
   kubectl rollout restart deployment/api
   ```

#### Cause 2: Firewall / Network Block

**Test outbound connectivity from pod:**

```bash
kubectl exec -it POD-NAME -- wget -O- https://dc.services.visualstudio.com/v2/track
```

**Expected:** Connection successful (may return 400, that's OK - means endpoint reachable)

**If timeout:**
- Check Azure Network Security Groups
- Check Kubernetes Network Policies
- Check cluster egress rules

#### Cause 3: Wrong Instrumentation Key

**Verify in Azure Portal:**

```
Azure Portal → mindx-week1-insights → Overview → Instrumentation Key
```

**Should be:** `f97d9fcc-bf08-46d9-985c-458c6fa4ce7a`

**If different, update deployment:**

```yaml
env:
- name: APPINSIGHTS_INSTRUMENTATIONKEY
  value: "CORRECT-KEY-HERE"
```

#### Cause 4: Data Delay (Normal)

**Expected delays:**

- **Live Metrics:** Real-time (< 10 seconds)
- **Logs queries:** 1-3 minutes
- **Metrics charts:** 5-10 minutes
- **Alerts:** 1-5 minutes (depends on evaluation frequency)

**Solution:** Wait 5 minutes and retry.

#### Cause 5: No Traffic Generated

**Verify app is receiving requests:**

```bash
# Test health endpoint
curl http://20.6.98.102/api/health

# Check pod logs for requests
kubectl logs -l app=api --tail=50
```

**Expected:** Logs show HTTP requests being processed.

---

## 🚨 Issue: Alerts Not Firing

### Symptom

Expected alert to fire but it didn't.

### Possible Causes & Solutions

#### Cause 1: Alert Disabled

**Check status:**

```bash
az monitor metrics alert show \
  --name "High Response Time Alert" \
  --resource-group mindx-week1-rg \
  --query "enabled"
```

**If false:**

```bash
az monitor metrics alert update \
  --name "High Response Time Alert" \
  --resource-group mindx-week1-rg \
  --enabled true
```

#### Cause 2: Threshold Not Actually Exceeded

**Verify metric value:**

```kusto
requests
| where timestamp > ago(10m)
| summarize AvgDuration = avg(duration)
```

**For High Response Time Alert:**
- Threshold: > 1000ms
- If AvgDuration < 1000, alert won't fire (working as designed)

**For High Exception Rate Alert:**

```kusto
exceptions
| where timestamp > ago(5m)
| summarize Count = count()
```

- Threshold: > 5
- If Count <= 5, alert won't fire

#### Cause 3: Evaluation Window Delay

**Alert evaluates:**
- **Frequency:** Every 1 minute
- **Window:** Over 5-minute period

**Timeline:**
```
14:50 - Metric exceeds threshold
14:51 - First evaluation (checks 14:46-14:51)
14:52 - Second evaluation (checks 14:47-14:52)
```

**If threshold only exceeded briefly:**
- May not persist long enough in 5-minute window
- Solution: Sustain high metric for 5+ minutes when testing

#### Cause 4: Alert Rule Scope Wrong

**Check alert scope:**

```bash
az monitor metrics alert show \
  --name "High Response Time Alert" \
  --resource-group mindx-week1-rg \
  --query "scopes"
```

**Expected:**
```
[
  "/subscriptions/fb2f3701-af77-441e-b987-b8adca866d11/resourceGroups/mindx-week1-rg/providers/microsoft.insights/components/mindx-week1-insights"
]
```

**If different, recreate alert with correct scope.**

---

## 🌐 Issue: Google Analytics Not Tracking

### Symptom

- GA4 Realtime shows 0 users
- Events not appearing
- Browser Network tab shows no GA requests

### Possible Causes & Solutions

#### Cause 1: Measurement ID Incorrect

**Check index.html:**

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-YYPL2F80CX"></script>
<script>
  gtag('config', 'G-YYPL2F80CX');
</script>
```

**Expected:** Both instances of `G-YYPL2F80CX` match your GA4 property.

**If wrong:**
1. Update `week1-frontend/public/index.html`
2. Rebuild frontend: `docker build -t week1-frontend:v12-ga4-fixed .`
3. Redeploy

#### Cause 2: Ad Blocker / Browser Extension

**Common blockers:**
- uBlock Origin
- AdBlock Plus
- Privacy Badger
- Brave Browser (built-in)

**Solution:**
1. Disable ad blocker
2. Open incognito/private window
3. Test again

#### Cause 3: gtag.js Script Blocked

**Check browser Console (F12):**

**If error:**
```
Failed to load resource: net::ERR_BLOCKED_BY_CLIENT
```

**Solution:** Ad blocker or CSP (Content Security Policy) blocking script.

**Verify script loaded:**

```
DevTools → Sources → Page → https://www.googletagmanager.com/gtag/js
```

**Should be present.** If missing, check network blocking.

#### Cause 4: Data Sampling / Delay

**GA4 Realtime delay:** Up to 60 seconds

**Solution:** Wait 1-2 minutes after generating events.

**Check DebugView (detailed debugging):**

```
GA4 → Admin → DebugView
```

**Enable debug mode:**

```javascript
gtag('config', 'G-YYPL2F80CX', {
  debug_mode: true
});
```

**Remember to remove before production!**

#### Cause 5: `window.gtag` Not Defined

**Check browser Console:**

```javascript
console.log(window.gtag);
```

**Expected:** `function gtag(){...}`

**If undefined:**
- gtag.js script didn't load
- Check `<script src="https://www.googletagmanager.com/gtag/js?id=G-YYPL2F80CX">` in HTML

**Verify script placement:**

```html
<!-- Should be in <head>, BEFORE any gtag() calls -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-YYPL2F80CX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-YYPL2F80CX');
</script>
```

---

## 🔍 Issue: Custom Events Not Appearing

### Symptom

Login/Logout events not visible in Application Insights Logs.

### Possible Causes & Solutions

#### Cause 1: Event Not Triggered

**Add console.log to verify execution:**

```typescript
const login = async () => {
  console.log('🔍 Login clicked - tracking event');
  appInsights.trackEvent({ name: 'LoginAttempt' });
  
  if (window.gtag) {
    console.log('🔍 Tracking GA4 login_click');
    window.gtag('event', 'login_click', { /*...*/ });
  }
  
  window.location.href = `${API_URL}/auth/login`;
};
```

**Check browser Console:**

**If messages don't appear:** Event code not being executed.

**If messages appear:** Event triggered, check Application Insights.

#### Cause 2: Data Delay

Custom events have 1-3 minute delay before appearing in Logs.

**Solution:** Wait 3-5 minutes and retry query.

#### Cause 3: Query Time Range Too Narrow

```kusto
customEvents
| where timestamp > ago(10m)  // ← May need to expand
| where name == "LoginAttempt"
```

**Try broader range:**

```kusto
customEvents
| where timestamp > ago(1h)
| where name == "LoginAttempt"
```

#### Cause 4: Event Name Typo

**Check exact event name:**

```kusto
customEvents
| where timestamp > ago(1h)
| distinct name
```

**Expected:**
```
UserLogin
LoginAttempt
UserLogout
```

**If different:** Update query or code to match.

#### Cause 5: App Insights Not Initialized

**Check frontend console:**

**Expected:**
```
Application Insights initialized in React
```

**If missing:**

1. Verify `appInsights.ts` imported in `App.tsx`
2. Verify connection string correct
3. Check browser DevTools → Network → Filter "dc.services"
   - Should see POST requests to Application Insights

---

## ⚡ Issue: High Response Times

### Symptom

Response times > 1000ms consistently.

### Diagnosis Steps

#### Step 1: Identify Slow Operations

```kusto
requests
| where timestamp > ago(1h)
| summarize AvgDuration = avg(duration) by name
| order by AvgDuration desc
```

**Expected slow operations:**
- OAuth callbacks (500-2000ms) - External Entra ID latency
- Database queries without indexes

**Unexpected slow operations:**
- Health checks (should be < 50ms)
- Static page serving (should be < 200ms)

#### Step 2: Check Dependencies

```kusto
dependencies
| where timestamp > ago(1h)
| summarize AvgDuration = avg(duration) by target
| order by AvgDuration desc
```

**Slow dependencies:**
- Database > 500ms → Add indexes, optimize queries
- External API > 2000ms → Consider caching, async processing

#### Step 3: Check Resource Utilization

```bash
# Check pod CPU/Memory
kubectl top pods
```

**If CPU > 80%:**
- Scale horizontally: Increase replicas
- Scale vertically: Increase CPU limits

**If Memory > 90%:**
- Check for memory leaks
- Increase memory limits
- Review code for inefficient buffering

#### Step 4: Check Kubernetes Scaling

```bash
kubectl get hpa  # Horizontal Pod Autoscaler
kubectl get pods -l app=api
```

**If only 1 replica under load:**
- Add more replicas:
  ```yaml
  spec:
    replicas: 3  # Increase from 2
  ```

### Solutions

**Database optimization:**
```sql
-- Add index to frequently queried column
CREATE INDEX idx_user_email ON users(email);
```

**Caching:**
```typescript
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 600 }); // 10 min cache

app.get('/api/data', async (req, res) => {
  const cacheKey = 'data';
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return res.json(cached);
  }
  
  const data = await fetchFromDatabase();
  cache.set(cacheKey, data);
  res.json(data);
});
```

**Horizontal scaling:**
```yaml
spec:
  replicas: 4  # More instances
```

---

## 🔧 Issue: Deployment Failures

### Symptom

```
kubectl rollout status deployment/api
Error: deadline exceeded
```

### Possible Causes & Solutions

#### Cause 1: Image Pull Error

**Check pod status:**

```bash
kubectl describe pod POD-NAME
```

**Look for:**
```
Events:
  Failed to pull image: unauthorized
```

**Solution:**

```bash
# Re-login to ACR
az acr login --name mindxweek1

# Verify image exists
az acr repository show-tags --name mindxweek1 --repository week1-api
```

#### Cause 2: Insufficient Resources

**Check pod events:**

```bash
kubectl describe pod POD-NAME
```

**Look for:**
```
Warning  FailedScheduling  Pod didn't fit: Insufficient cpu
```

**Solution:**

Reduce resource requests or add more nodes to cluster.

```yaml
resources:
  requests:
    cpu: 100m      # Reduce from 500m
    memory: 128Mi  # Reduce from 512Mi
```

#### Cause 3: CrashLoopBackOff

**Check logs:**

```bash
kubectl logs POD-NAME --previous
```

**Common errors:**
- Missing environment variables
- Application startup errors
- Port already in use

**Solution:** Fix code/config issue and redeploy.

---

## 🛠️ General Debugging Commands

### Application Insights

```bash
# Test connectivity to App Insights
curl https://dc.services.visualstudio.com/v2/track

# Check instrumentation key
kubectl get deployment api -o yaml | findstr APPINSIGHTS
```

### Kubernetes

```bash
# Pod status
kubectl get pods

# Pod details
kubectl describe pod POD-NAME

# Pod logs
kubectl logs POD-NAME --tail=50

# Previous pod logs (if crashed)
kubectl logs POD-NAME --previous

# Execute command in pod
kubectl exec -it POD-NAME -- /bin/sh

# Check resource usage
kubectl top pods
kubectl top nodes

# Restart deployment
kubectl rollout restart deployment/api
```

### Docker

```bash
# List images
docker images

# Test image locally
docker run -p 5000:5000 -e APPINSIGHTS_INSTRUMENTATIONKEY="KEY" week1-api:v16-appinsights-fixed

# Check logs
docker logs CONTAINER-ID
```

### Azure CLI

```bash
# Check App Insights resource
az monitor app-insights component show \
  --app mindx-week1-insights \
  --resource-group mindx-week1-rg

# List alert rules
az monitor metrics alert list \
  --resource-group mindx-week1-rg \
  --output table

# Check ACR images
az acr repository list --name mindxweek1
az acr repository show-tags --name mindxweek1 --repository week1-api
```

---

## 📋 Troubleshooting Checklist

### Before Asking for Help

- [x] Checked pod logs for errors
- [x] Verified environment variables set correctly
- [x] Tested locally with Docker (if possible)
- [x] Checked Application Insights Logs for data
- [x] Waited 3-5 minutes for telemetry to appear
- [x] Checked browser DevTools Network tab
- [x] Reviewed this troubleshooting guide
- [x] Documented error messages and steps to reproduce

### Information to Provide

When reporting an issue, include:

1. **Symptoms:** What's not working?
2. **Steps to reproduce:** Exact commands/actions
3. **Expected behavior:** What should happen?
4. **Actual behavior:** What actually happens?
5. **Logs:**
   - Pod logs: `kubectl logs POD-NAME`
   - Describe output: `kubectl describe pod POD-NAME`
   - Browser console errors (if frontend issue)
6. **Environment:**
   - Deployment version (e.g., v16-appinsights-fixed)
   - Kubernetes cluster info
   - Browser/OS (if frontend issue)

---

## 🔗 Additional Resources

- **Azure Application Insights Documentation:** [https://learn.microsoft.com/azure/azure-monitor/app/app-insights-overview](https://learn.microsoft.com/azure/azure-monitor/app/app-insights-overview)
- **Google Analytics 4 Documentation:** [https://support.google.com/analytics/answer/9304153](https://support.google.com/analytics/answer/9304153)
- **Kusto Query Language (KQL) Reference:** [https://learn.microsoft.com/azure/data-explorer/kusto/query/](https://learn.microsoft.com/azure/data-explorer/kusto/query/)
- **Kubernetes Troubleshooting:** [https://kubernetes.io/docs/tasks/debug/](https://kubernetes.io/docs/tasks/debug/)

---

**Back to:** [Main README](./README.md)

[← Previous: Testing Verification](./09-testing-verification.md)
