# 6. Metrics Interpretation

**Section:** Understanding telemetry data and performance indicators  
**Focus:** Making data-driven decisions from monitoring insights

---

## 📊 Core Metrics Overview

### Response Time Metrics

| Metric | What It Measures | Good Value | Warning | Critical |
|--------|------------------|------------|---------|----------|
| **Average Response Time** | Mean server processing time | < 200ms | 200-1000ms | > 1000ms |
| **P50 (Median)** | Half of requests faster than this | < 100ms | 100-500ms | > 500ms |
| **P95** | 95% of requests faster than this | < 500ms | 500-2000ms | > 2000ms |
| **P99** | 99% of requests faster than this | < 1000ms | 1-5s | > 5s |

**Interpretation:**

```kusto
// Query for percentile analysis
requests
| where timestamp > ago(1h)
| summarize 
    p50 = percentile(duration, 50),
    p95 = percentile(duration, 95),
    p99 = percentile(duration, 99),
    avg = avg(duration)
| project 
    Median_ms = p50,
    P95_ms = p95,
    P99_ms = p99,
    Average_ms = avg
```

**Example Result:**
```
Median_ms | P95_ms | P99_ms | Average_ms
─────────────────────────────────────────
45        | 234    | 890    | 125
```

**What This Means:**
- ✅ **Median (45ms):** Most requests are very fast
- ✅ **P95 (234ms):** 95% of users have good experience
- ⚠️ **P99 (890ms):** 1% of users see slow responses
- ✅ **Average (125ms):** Overall healthy performance

**Why P99 is high?**
- OAuth redirects take longer
- Database query timeouts
- Cold start issues
- Network latency spikes

---

### Request Volume Metrics

| Metric | What It Measures | Healthy Range |
|--------|------------------|---------------|
| **Requests/sec** | Traffic rate | Depends on capacity |
| **Success Rate** | % of non-error responses | > 99.5% |
| **Failed Requests** | 4xx/5xx responses | < 0.5% |

**Query:**
```kusto
requests
| where timestamp > ago(1h)
| summarize 
    Total = count(),
    Success = countif(success == true),
    Failed = countif(success == false)
| extend SuccessRate = (Success * 100.0) / Total
| project Total, Success, Failed, SuccessRate
```

**Example Result:**
```
Total | Success | Failed | SuccessRate
──────────────────────────────────────
1250  | 1242    | 8      | 99.36%
```

**Interpretation:**
- ✅ 99.36% success rate is healthy
- 8 failures likely from auth errors (401/403)
- Check if failures clustered (all at once = incident, spread out = normal)

---

### Exception Metrics

| Severity | Examples | Acceptable Rate |
|----------|----------|-----------------|
| **Critical** | Database connection failed, Out of memory | 0 per hour |
| **Error** | Unhandled exceptions, TypeError, ReferenceError | < 1 per 1000 requests |
| **Warning** | Validation errors, Handled exceptions | < 5% of requests |

**Query:**
```kusto
exceptions
| where timestamp > ago(24h)
| summarize Count = count() by type, outerMessage
| order by Count desc
| take 10
```

**Example Result:**
```
type                        | outerMessage                      | Count
──────────────────────────────────────────────────────────────────────
Error                       | Cannot read property 'username'   | 12
UnauthorizedError           | Invalid or expired token          | 8
DatabaseConnectionError     | Connection timeout                | 2
```

**Action Plan:**
1. **12 TypeError** → Fix null check in frontend
2. **8 UnauthorizedError** → Expected behavior, users with expired tokens
3. **2 DatabaseConnectionError** → Investigate, should be 0

---

## 🎯 Business Metrics

### User Activity Metrics

**Custom Events to Track:**

| Event | What It Measures | Query |
|-------|------------------|-------|
| **UserLogin** | Authentication attempts | Count by hour |
| **UserLogout** | Session ends | Average session duration |
| **FeatureUsed** | Feature adoption | Count by feature name |
| **PurchaseCompleted** | Revenue events | Sum by amount |

**Example Query:**
```kusto
customEvents
| where name == "UserLogin"
| where timestamp > ago(7d)
| summarize LoginCount = count() by bin(timestamp, 1d)
| render timechart
```

**Expected Pattern:**
```
Monday:    45 logins
Tuesday:   52 logins
Wednesday: 48 logins
Thursday:  51 logins
Friday:    40 logins
Saturday:  12 logins  ← Lower on weekends
Sunday:    8 logins   ← Lower on weekends
```

### Health Check Metrics

**Purpose:** Verify service availability

**Query:**
```kusto
customMetrics
| where name == "HealthCheckRequests"
| where timestamp > ago(1h)
| summarize Total = sum(value) by bin(timestamp, 1m)
| render timechart
```

**Expected Pattern:**
```
Every minute: 1-3 health checks
Kubernetes liveness/readiness probes
```

**Anomaly Detection:**
```
0 health checks for 5 minutes → Pod crashed
100+ health checks in 1 minute → Load balancer issue
```

---

## 📈 Performance Benchmarks

### Response Time by Operation

| Operation | Expected Duration | Why |
|-----------|-------------------|-----|
| `GET /api/health` | < 10ms | Simple JSON response, no DB |
| `GET /` | 50-200ms | Serve static HTML |
| `GET /api/user` | 50-300ms | Database query + auth check |
| `POST /api/auth/callback` | 500-2000ms | OAuth redirect, token exchange |
| `POST /api/data` | 100-500ms | Database write |

**Query to Verify:**
```kusto
requests
| where timestamp > ago(1h)
| summarize AvgDuration = avg(duration) by name
| order by AvgDuration desc
```

**Example Result:**
```
name                      | AvgDuration
──────────────────────────────────────
POST /api/auth/callback   | 1234 ms  ✅ Within expected range
GET /api/user             | 125 ms   ✅ Good
GET /api/health           | 8 ms     ✅ Excellent
GET /                     | 234 ms   ✅ Acceptable
```

---

## 🔍 Dependency Analysis

### External Dependencies

**Query:**
```kusto
dependencies
| where timestamp > ago(1h)
| summarize 
    Count = count(),
    AvgDuration = avg(duration),
    FailureRate = countif(success == false) * 100.0 / count()
    by target
| order by Count desc
```

**Example Result:**
```
target                    | Count | AvgDuration | FailureRate
────────────────────────────────────────────────────────────
google-analytics.com      | 450   | 125 ms      | 0.0%
login.microsoftonline.com | 23    | 890 ms      | 0.0%
```

**Interpretation:**
- **GA4:** High call volume (450), fast (125ms), 100% reliable ✅
- **Entra ID:** Low volume (23), slower (890ms) but acceptable for OAuth ✅

### Database Performance

**If using SQL Database:**

```kusto
dependencies
| where type == "SQL"
| where timestamp > ago(1h)
| summarize 
    TotalQueries = count(),
    AvgDuration = avg(duration),
    SlowQueries = countif(duration > 1000)
| project TotalQueries, AvgDuration, SlowQueries, SlowQueryRate = (SlowQueries * 100.0) / TotalQueries
```

**Benchmarks:**
- **AvgDuration < 50ms:** Excellent
- **AvgDuration 50-200ms:** Good
- **AvgDuration > 500ms:** Needs optimization

---

## 🚨 Alert Threshold Rationale

### High Response Time Alert: > 1000ms

**Why 1000ms?**

1. **User Experience:** 1 second is psychological threshold
   - < 1s feels instant
   - > 1s feels sluggish

2. **Industry Standards:**
   - Google PageSpeed: < 1s for FCP (First Contentful Paint)
   - Mobile web: < 1s for interactivity

3. **Realistic for API:**
   - Simple queries: < 100ms
   - Complex queries: 200-500ms
   - OAuth redirects: 500-2000ms (not included in avg)

**Verification:**
```kusto
requests
| where timestamp > ago(7d)
| summarize avg(duration)
```

If **avg < 200ms normally**, then **> 1000ms = 5x degradation** = alert-worthy.

### High Exception Rate Alert: > 5 in 5 minutes

**Why 5 exceptions?**

1. **Normal error rate:**
   - 1250 requests/hour = ~21 requests/min
   - 0.5% error rate = ~1 error/min
   - 5 errors in 5 min = 1 per minute baseline

2. **Spike detection:**
   - Normal: 0-5 exceptions per 5 min
   - Incident: > 5 exceptions per 5 min

3. **Avoids false positives:**
   - Single user with expired token = 1 error
   - Network blip = 2-3 errors
   - Real bug affecting all users = 10+ errors

**Verification:**
```kusto
exceptions
| where timestamp > ago(7d)
| summarize ExceptionCount = count() by bin(timestamp, 5m)
| summarize 
    p50 = percentile(ExceptionCount, 50),
    p95 = percentile(ExceptionCount, 95),
    max = max(ExceptionCount)
```

If **P95 = 2**, then **> 5 = well above normal** = alert-worthy.

---

## 📊 Metric Correlation

### Example: High Response Time + High CPU

**Scenario:**
```
Response time: 2500ms (normally 200ms)
CPU usage: 85% (normally 20%)
Memory: 512MB (normally 300MB)
```

**Diagnosis:** CPU bottleneck  
**Solution:** Scale horizontally (add replicas) or vertically (more CPU)

### Example: High Response Time + Normal CPU

**Scenario:**
```
Response time: 2500ms (normally 200ms)
CPU usage: 15% (normal)
Memory: 280MB (normal)
Dependencies: SQL 2400ms (normally 50ms)
```

**Diagnosis:** Database bottleneck  
**Solution:** Optimize query, add index, scale database tier

### Example: High Exceptions + Recent Deployment

**Scenario:**
```
Exceptions: 45 in 5 minutes (normally 2)
Last deployment: 10 minutes ago
Exception type: TypeError
```

**Diagnosis:** New bug in deployed code  
**Solution:** Rollback deployment, fix bug, redeploy

---

## 🎓 Best Practices

### 1. Establish Baselines

**DO:**
```kusto
// Save baseline for normal operation
requests
| where timestamp between (datetime(2025-01-10) .. datetime(2025-01-12))
| summarize 
    BaselineAvgDuration = avg(duration),
    BaselineP95 = percentile(duration, 95),
    BaselineRequestRate = count() / 48.0  // requests per hour
```

**Use for comparison:**
```kusto
// Current vs baseline
requests
| where timestamp > ago(1h)
| summarize 
    CurrentAvgDuration = avg(duration),
    CurrentP95 = percentile(duration, 95)
| extend 
    BaselineAvg = 125.0,  // from saved baseline
    BaselineP95 = 234.0
| extend 
    AvgChange = ((CurrentAvgDuration - BaselineAvg) / BaselineAvg) * 100,
    P95Change = ((CurrentP95 - BaselineP95) / BaselineP95) * 100
```

### 2. Monitor Trends, Not Just Snapshots

**BAD:** "Response time is 500ms right now"  
**GOOD:** "Response time increased from 200ms to 500ms over last hour"

**Query:**
```kusto
requests
| where timestamp > ago(24h)
| summarize AvgDuration = avg(duration) by bin(timestamp, 1h)
| render timechart
```

### 3. Correlate Metrics with Events

**Track deployments:**
```kusto
customEvents
| where name == "DeploymentCompleted"
| project DeploymentTime = timestamp
```

**Overlay with performance:**
```kusto
let deployments = customEvents | where name == "DeploymentCompleted" | project DeploymentTime = timestamp;
requests
| where timestamp > ago(24h)
| summarize AvgDuration = avg(duration) by bin(timestamp, 10m)
| join kind=leftouter deployments on $left.timestamp == $right.DeploymentTime
| render timechart
```

### 4. Use Multiple Metrics

Don't rely on single metric:

✅ **Good Investigation:**
- Response time increased
- Exception rate stable
- CPU/memory normal
- New dependency detected
- **Conclusion:** External API slow

❌ **Bad Investigation:**
- Response time increased
- **Conclusion:** Broken (too vague)

---

## ✅ Metrics Interpretation Checklist

- [x] Understand response time percentiles (P50, P95, P99)
- [x] Know healthy ranges for request success rate
- [x] Differentiate critical vs. expected exceptions
- [x] Establish baseline metrics for normal operation
- [x] Correlate multiple metrics for diagnosis
- [x] Use trends over time, not just snapshots
- [x] Understand alert threshold rationale
- [ ] Document baselines in team wiki
- [ ] Create custom dashboard for key metrics

---

## 🔗 Next Steps

- **Setup Google Analytics** → [GA4 Setup Guide](./07-google-analytics-setup.md)
- **Deploy Changes** → [Deployment Guide](./08-deployment-guide.md)
- **Test Metrics** → [Testing Verification Guide](./09-testing-verification.md)

---

**Next:** [Google Analytics Setup →](./07-google-analytics-setup.md)

[← Back to Index](./README.md) | [← Previous: Azure Portal Access](./05-azure-portal-access.md)
