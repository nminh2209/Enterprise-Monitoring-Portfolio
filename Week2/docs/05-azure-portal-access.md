# 5. Azure Portal Access

**Section:** Navigating Application Insights dashboards  
**Focus:** Understanding and using Azure monitoring tools

---

## 🔑 Quick Access

### Direct Links

| Dashboard | URL |
|-----------|-----|
| **Application Insights** | [https://portal.azure.com/#@/resource/subscriptions/fb2f3701-af77-441e-b987-b8adca866d11/resourceGroups/mindx-week1-rg/providers/microsoft.insights/components/mindx-week1-insights](https://portal.azure.com) |
| **Live Metrics** | Portal → mindx-week1-insights → Live Metrics |
| **Application Map** | Portal → mindx-week1-insights → Application Map |
| **Logs** | Portal → mindx-week1-insights → Logs |

### Navigation Path

```
Azure Portal (portal.azure.com)
└── Resource Groups
    └── mindx-week1-rg
        └── mindx-week1-insights (Application Insights)
            ├── Overview
            ├── Live Metrics
            ├── Application Map
            ├── Performance
            ├── Failures
            ├── Logs
            └── Alerts
```

---

## 📊 Key Dashboards

### 1. Overview Dashboard

**Location:** mindx-week1-insights → Overview

**Purpose:** High-level health snapshot

**Metrics Displayed:**
- Failed requests (last hour)
- Server response time (last hour)
- Server requests (last hour)
- Availability (last hour)

**Quick Actions:**
- View application map
- Open Live Metrics
- Check recent failures
- Access performance data

**Best For:**
- Quick health check
- Executive summaries
- Daily standup reviews

---

### 2. Live Metrics Stream

**Location:** mindx-week1-insights → Live Metrics

**Purpose:** Real-time telemetry visualization

**What You See:**

#### Incoming Requests
```
Rate: 2.3 req/sec
Average Duration: 846.4 µs
Failed Request Rate: 0.0%
```

#### Outgoing Requests (Dependencies)
```
Rate: 1.1 req/sec
Average Duration: 125 ms
Failed Dependency Rate: 0.0%
```

#### Overall Health
```
CPU Usage: 12%
Memory Usage: 245 MB
Committed Memory: 512 MB
```

**Use Cases:**
- ✅ Watch deployments in real-time
- ✅ Debug live issues
- ✅ Test new features immediately
- ✅ Verify traffic after DNS changes

**Tips:**
- Keep open during deployments
- Filter by server instance
- Watch for spikes in response time
- Monitor memory for leaks

---

### 3. Application Map

**Location:** mindx-week1-insights → Application Map

**Purpose:** Visualize component dependencies and health

**What You See:**

```
┌─────────────┐
│   2 inst    │  ← Your backend instances
│  846.4 µs   │     Average response time
│   100% ✓    │     Success rate
└─────────────┘
      │
      ├─► [Azure Service Bus]  (if used)
      ├─► [SQL Database]       (if used)
      └─► [External APIs]      (Google Analytics)
```

**Interpretation:**

| Visual Element | Meaning |
|----------------|---------|
| **Number (2 inst)** | Instance count (Kubernetes replicas) |
| **Green circle** | Healthy, no errors |
| **Yellow circle** | Warnings, performance degraded |
| **Red circle** | Critical errors |
| **Line thickness** | Traffic volume |
| **Response time** | Average latency |

**Use Cases:**
- ✅ Identify slow dependencies
- ✅ Find bottlenecks
- ✅ Verify architecture
- ✅ Troubleshoot cascading failures

**Example Scenario:**

```
Before Fix:
┌─────────────┐
│   2 inst    │
│  2500 µs    │  ← SLOW!
│   100% ✓    │
└─────────────┘
      │
      └─► [SQL Database - 2400µs]  ← Bottleneck identified!

After Index Added:
┌─────────────┐
│   2 inst    │
│  846 µs     │  ← Fast again
│   100% ✓    │
└─────────────┘
      │
      └─► [SQL Database - 15µs]  ← Fixed!
```

---

### 4. Performance Blade

**Location:** mindx-week1-insights → Performance

**Purpose:** Analyze operation-level performance

**Views:**

#### Operations Tab
```
Operation Name          | Count | Avg Duration | 95th % | Trend
─────────────────────────────────────────────────────────────
GET /api/health         | 1.2K  | 12 ms        | 45 ms  | ↓
GET /                   | 856   | 234 ms       | 890 ms | →
POST /api/auth/callback | 23    | 1.2 s        | 2.5 s  | ↑
```

**Insights:**
- `/api/health` is fastest (12ms avg) ✅
- `/` has acceptable performance (234ms) ✅
- `/api/auth/callback` is slow (1.2s) ⚠️ - OAuth overhead expected

#### Dependencies Tab
```
Dependency Name         | Count | Avg Duration | Failure Rate
─────────────────────────────────────────────────────────────
GET google-analytics.com| 450   | 125 ms       | 0.0%
GET entra.microsoft.com | 23    | 890 ms       | 0.0%
```

**Drill-Down:**
1. Click any operation
2. See sample requests
3. View end-to-end transaction
4. Identify slow dependencies

---

### 5. Failures Blade

**Location:** mindx-week1-insights → Failures

**Purpose:** Investigate errors and exceptions

**Sections:**

#### Top 3 Exception Types
```
Exception                           | Count | Users Affected
──────────────────────────────────────────────────────────
TypeError: Cannot read property    | 12    | 4
UnauthorizedError: Invalid token   | 8     | 8
DatabaseConnectionError            | 2     | 2
```

#### Top 3 Failed Operations
```
Operation                | Failure Count | Failure Rate
───────────────────────────────────────────────────
POST /api/protected     | 8             | 34.8%
GET /api/users          | 2             | 0.5%
```

**Drill-Down Steps:**

1. **Click Exception Type**
   ```
   TypeError: Cannot read property 'username' of undefined
   ```

2. **View Samples**
   ```
   10 occurrences in last 24h
   ```

3. **Select Sample**
   ```
   Timestamp: 2025-01-15 14:32:18
   User: user-123
   Session: session-456
   ```

4. **See Stack Trace**
   ```javascript
   at AuthContext.getUsername (AuthContext.tsx:45)
   at Dashboard.render (Dashboard.tsx:12)
   at React.Component.render
   ```

---

### 6. Logs (Kusto Queries)

**Location:** mindx-week1-insights → Logs

**Purpose:** Advanced querying and analysis

**Interface:**
- Left: Table explorer (requests, customEvents, exceptions, etc.)
- Center: Query editor (Kusto Query Language)
- Right: Results pane

**Common Queries:**

#### Recent Requests
```kusto
requests
| where timestamp > ago(1h)
| project timestamp, name, duration, resultCode
| order by timestamp desc
| take 100
```

#### Custom Events
```kusto
customEvents
| where name == "UserLogin"
| where timestamp > ago(24h)
| summarize LoginCount = count() by bin(timestamp, 1h)
| render timechart
```

#### Exception Analysis
```kusto
exceptions
| where timestamp > ago(24h)
| summarize Count = count() by type, outerMessage
| order by Count desc
```

#### Performance Percentiles
```kusto
requests
| where timestamp > ago(1h)
| summarize 
    p50 = percentile(duration, 50),
    p95 = percentile(duration, 95),
    p99 = percentile(duration, 99)
| project 
    Median = p50,
    P95 = p95,
    P99 = p99
```

**Tips:**
- Use `| take 10` to limit results during testing
- Save frequent queries
- Export results to CSV
- Create charts with `| render`

---

### 7. Alerts Dashboard

**Location:** mindx-week1-insights → Alerts

**Purpose:** Monitor alert rules and firings

**Sections:**

#### Alert Rules
```
Alert Name               | Status  | Severity | Condition
──────────────────────────────────────────────────────────
High Response Time       | Enabled | Sev 2    | avg > 1000ms
High Exception Rate      | Enabled | Sev 1    | count > 5
```

#### Fired Alerts (Last 24h)
```
Time Fired         | Alert Name          | Status    | Duration
──────────────────────────────────────────────────────────────
2025-01-15 14:32  | High Exception Rate | Resolved  | 3 min
2025-01-15 10:15  | High Response Time  | Resolved  | 12 min
```

**Actions:**
- View alert history
- Modify alert rules
- Configure action groups
- Test alert conditions

---

## 🎯 Common Workflows

### Workflow 1: Investigate Slow Requests

1. **Overview** → Notice high average response time
2. **Performance** → Identify slow operation (`POST /api/data`)
3. **Click operation** → See sample slow requests
4. **Click sample** → View end-to-end transaction
5. **Dependencies** → Identify slow database query
6. **Fix** → Add database index or optimize query

### Workflow 2: Debug Production Error

1. **Failures** → See spike in `TypeError`
2. **Click exception** → View stack trace
3. **Note timestamp and user** → Reproduce scenario
4. **Logs** → Query for related telemetry:
   ```kusto
   traces
   | where user_Id == "affected-user-id"
   | where timestamp between (datetime(2025-01-15 14:30:00) .. datetime(2025-01-15 14:35:00))
   ```
5. **Fix code** → Deploy patch
6. **Live Metrics** → Verify error stopped

### Workflow 3: Verify Deployment

1. **Before deployment** → Note current metrics in Overview
2. **Deploy** → Kubernetes rolling update
3. **Live Metrics** → Watch new pods come online
4. **Application Map** → Verify instance count increases temporarily
5. **Performance** → Check response times stable
6. **Failures** → Confirm no new exceptions
7. **Logs** → Query for deployment logs:
   ```kusto
   traces
   | where message contains "Application Insights initialized"
   | where timestamp > ago(10m)
   ```

---

## 🔍 Advanced Features

### Workbooks

**Location:** mindx-week1-insights → Workbooks

**Purpose:** Custom interactive reports

**Pre-built Templates:**
- Failure Analysis
- Performance Analysis
- User Flows
- Usage Analysis

**Create Custom:**
1. Click "New"
2. Add visualizations (charts, grids, text)
3. Add parameters (time range, filters)
4. Share with team

### Smart Detection

**Location:** mindx-week1-insights → Smart Detection

**Purpose:** AI-driven anomaly detection

**What it detects:**
- Abnormal rise in exception rate
- Degradation in response time
- Abnormal rise in dependency failures
- Memory leak detection

**How it works:**
- Azure ML learns normal patterns
- Alerts when significant deviation detected
- No configuration needed

---

## 📱 Mobile Access

### Azure Mobile App

**Download:** App Store / Google Play

**Features:**
- View alerts
- Check metrics
- Run queries
- Restart resources

**Setup:**
1. Install "Azure" app
2. Sign in with Azure account
3. Add mindx-week1-insights to favorites

---

## ✅ Portal Access Checklist

- [x] Can access Application Insights resource
- [x] Verified Live Metrics shows data
- [x] Application Map displays architecture
- [x] Performance blade shows operation metrics
- [x] Failures blade tracks exceptions
- [x] Logs interface loads queries
- [x] Alerts dashboard shows configured rules
- [ ] Saved common queries in Logs
- [ ] Created custom Workbook (optional)

---

## 🔗 Next Steps

- **Understand Metrics** → [Metrics Interpretation Guide](./06-metrics-interpretation.md)
- **Setup GA4** → [Google Analytics Guide](./07-google-analytics-setup.md)
- **Learn Queries** → Practice Kusto in Logs blade

---

**Next:** [Metrics Interpretation →](./06-metrics-interpretation.md)

[← Back to Index](./README.md) | [← Previous: Alerts Configuration](./04-alerts-configuration.md)
