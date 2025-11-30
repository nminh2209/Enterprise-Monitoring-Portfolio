# 4. Alerts Configuration

**Section:** Azure Monitor Alerts setup  
**Focus:** Proactive monitoring and incident response

---

## 🎯 Overview

Azure Monitor Alerts notify you when critical conditions are detected in your monitoring data. We configure two production-ready alerts:

1. **High Response Time Alert** - Triggers when average server response > 1000ms
2. **High Exception Rate Alert** - Triggers when exceptions exceed 5 in 5 minutes

---

## 📋 Alert 1: High Response Time

### Purpose

Detect when server performance degrades, impacting user experience.

### Configuration

| Setting | Value |
|---------|-------|
| **Metric** | Server Response Time |
| **Threshold** | > 1000ms (1 second) |
| **Aggregation** | Average |
| **Time Window** | 5 minutes |
| **Frequency** | 1 minute |
| **Severity** | Warning (Sev 2) |
| **Auto Resolve** | Yes |

### Creation Command

```bash
az monitor metrics alert create \
  --name "High Response Time Alert" \
  --resource-group mindx-week1-rg \
  --scopes "/subscriptions/fb2f3701-af77-441e-b987-b8adca866d11/resourceGroups/mindx-week1-rg/providers/microsoft.insights/components/mindx-week1-insights" \
  --condition "avg requests/duration > 1000" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --severity 2 \
  --description "Triggers when average server response time exceeds 1 second over 5 minutes"
```

### What Triggers This Alert?

**Scenario:**
```
Minute 1: 800ms average
Minute 2: 1200ms average  ← Threshold exceeded
Minute 3: 1500ms average  ← Still exceeded
Minute 4: 1100ms average  ← Still exceeded
Minute 5: 950ms average   ← Back to normal
```

**Result:** Alert fires after Minute 2 (5-minute window shows avg > 1000ms)

### Expected Response

1. **Check Live Metrics** - Are requests currently slow?
2. **Check Application Map** - Which dependency is slow?
3. **Check Performance Blade** - What operation is slowest?
4. **Scale if needed** - Increase replicas or resources

---

## 🚨 Alert 2: High Exception Rate

### Purpose

Detect when application errors spike, indicating critical bugs or outages.

### Configuration

| Setting | Value |
|---------|-------|
| **Metric** | Exceptions Count |
| **Threshold** | > 5 exceptions |
| **Aggregation** | Total |
| **Time Window** | 5 minutes |
| **Frequency** | 1 minute |
| **Severity** | Error (Sev 1) |
| **Auto Resolve** | Yes |

### Creation Command

```bash
az monitor metrics alert create \
  --name "High Exception Rate Alert" \
  --resource-group mindx-week1-rg \
  --scopes "/subscriptions/fb2f3701-af77-441e-b987-b8adca866d11/resourceGroups/mindx-week1-rg/providers/microsoft.insights/components/mindx-week1-insights" \
  --condition "total exceptions/count > 5" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --severity 1 \
  --description "Triggers when more than 5 exceptions occur in a 5-minute window"
```

### What Triggers This Alert?

**Scenario:**
```
Minute 1: 1 exception
Minute 2: 2 exceptions
Minute 3: 3 exceptions  ← Total now = 6 exceptions in 5-min window
Minute 4: 0 exceptions  ← Alert fires
Minute 5: 0 exceptions
```

**Result:** Alert fires when cumulative count > 5 in any 5-minute period

### Expected Response

1. **Check Failures Blade** - What is the exception type?
2. **Check Logs** - Get stack traces:
   ```kusto
   exceptions
   | where timestamp > ago(10m)
   | project timestamp, type, outerMessage, innermostMessage
   | order by timestamp desc
   ```
3. **Check Recent Deployments** - Was there a recent code change?
4. **Rollback if critical** - Revert to previous stable version

---

## 🔔 Alert Actions (Optional)

### Email Notifications

```bash
# Create action group
az monitor action-group create \
  --name "MindX Alert Group" \
  --resource-group mindx-week1-rg \
  --short-name "MindXAlert" \
  --email-receiver \
    name="Admin Email" \
    email-address="admin@example.com"
```

### Update Alert with Action Group

```bash
az monitor metrics alert update \
  --name "High Response Time Alert" \
  --resource-group mindx-week1-rg \
  --add-action "MindX Alert Group"
```

### Available Action Types

- **Email** - Send email to distribution list
- **SMS** - Text message notifications
- **Webhook** - Call custom API endpoint
- **Logic App** - Trigger automated workflow
- **Azure Function** - Execute serverless code
- **ITSM** - Create incident ticket

---

## 📊 Viewing Alerts

### Azure Portal

1. **Navigate to Application Insights**
   ```
   Azure Portal → mindx-week1-insights → Alerts
   ```

2. **View Active Alerts**
   - Shows all fired alerts
   - Status: Fired / Resolved
   - Severity level
   - Time fired

3. **Alert History**
   - Click "Alert Rules" → Select rule → "History"
   - Shows all historical firings
   - Includes resolution times

### Command Line

```bash
# List all alert rules
az monitor metrics alert list \
  --resource-group mindx-week1-rg \
  --output table

# Show specific alert details
az monitor metrics alert show \
  --name "High Response Time Alert" \
  --resource-group mindx-week1-rg
```

---

## 🎛️ Alert Best Practices

### 1. Avoid Alert Fatigue

✅ **DO:** Set thresholds that indicate real problems  
❌ **DON'T:** Set overly sensitive thresholds

```
Bad:  Response time > 100ms (fires constantly)
Good: Response time > 1000ms (fires for real issues)
```

### 2. Use Severity Levels

| Severity | When to Use | Example |
|----------|-------------|---------|
| Sev 0 - Critical | System down, data loss | Complete outage |
| Sev 1 - Error | Major functionality broken | High exception rate |
| Sev 2 - Warning | Performance degradation | Slow response time |
| Sev 3 - Informational | Non-critical issues | High memory usage |
| Sev 4 - Verbose | Debug information | Deployment events |

### 3. Auto-Resolve Alerts

**Enable auto-resolve** so alerts automatically clear when metric returns to normal:

```bash
# Built into the --condition parameter
# Alert resolves when avg requests/duration <= 1000
```

### 4. Test Alerts

**Generate test conditions:**

```bash
# Trigger exception alert (run 6 times quickly)
for i in {1..6}; do
  curl http://20.6.98.102/api/test-error
done

# Trigger response time alert (simulate slow endpoint)
# Add this to your API:
app.get('/api/slow', (req, res) => {
  setTimeout(() => res.json({ ok: true }), 2000); // 2 second delay
});
```

---

## 🔍 Monitoring Alert Performance

### Query Alert Firings

```kusto
// All alerts fired in last 24 hours
AzureMetrics
| where ResourceProvider == "MICROSOFT.INSIGHTS"
| where MetricName == "alerts"
| where TimeGenerated > ago(24h)
| project TimeGenerated, Total, AlertName = tostring(split(_ResourceId, '/')[8])
| order by TimeGenerated desc
```

### Alert Response Time Analysis

```kusto
// How quickly do alerts resolve?
let alertFires = AzureActivity
| where OperationNameValue == "Microsoft.Insights/AlertRules/Activated/Action"
| project FireTime = TimeGenerated, AlertName = tostring(Properties.ruleName);

let alertResolves = AzureActivity
| where OperationNameValue == "Microsoft.Insights/AlertRules/Resolved/Action"
| project ResolveTime = TimeGenerated, AlertName = tostring(Properties.ruleName);

alertFires
| join kind=inner alertResolves on AlertName
| extend ResolutionMinutes = datetime_diff('minute', ResolveTime, FireTime)
| summarize AvgResolutionTime = avg(ResolutionMinutes) by AlertName
```

---

## 🛠️ Troubleshooting Alerts

### Alert Not Firing When Expected

**Check:**

1. **Metric availability**
   ```kusto
   requests
   | where timestamp > ago(1h)
   | summarize count()
   ```
   
2. **Threshold calculation**
   ```kusto
   requests
   | where timestamp > ago(5m)
   | summarize avg(duration)
   ```

3. **Alert rule status**
   ```bash
   az monitor metrics alert show \
     --name "High Response Time Alert" \
     --resource-group mindx-week1-rg \
     --query "enabled"
   ```

### Alert Firing Too Frequently

**Solutions:**

1. **Increase threshold** - Make it less sensitive
2. **Increase time window** - Require sustained issue (e.g., 10m instead of 5m)
3. **Change aggregation** - Use max instead of avg if spikes are acceptable

### Alert Actions Not Working

**Check:**

1. **Action group exists**
   ```bash
   az monitor action-group list --resource-group mindx-week1-rg
   ```

2. **Action group attached**
   ```bash
   az monitor metrics alert show \
     --name "High Response Time Alert" \
     --resource-group mindx-week1-rg \
     --query "actions"
   ```

3. **Email/SMS quotas** - Azure has rate limits on notifications

---

## 📈 Advanced Alert Configurations

### Dynamic Thresholds (ML-Based)

Instead of static threshold (> 1000ms), use machine learning:

```bash
az monitor metrics alert create \
  --name "Smart Response Time Alert" \
  --resource-group mindx-week1-rg \
  --scopes "/subscriptions/.../mindx-week1-insights" \
  --condition "avg requests/duration > dynamic High 2" \
  --window-size 5m \
  --evaluation-frequency 1m
```

**How it works:**
- Azure learns normal pattern over time
- Alert fires when metric deviates significantly
- Adapts to traffic patterns (weekday vs weekend)

### Multi-Resource Alerts

Monitor multiple resources with one alert:

```bash
az monitor metrics alert create \
  --name "All APIs Slow" \
  --resource-group mindx-week1-rg \
  --scopes \
    "/subscriptions/.../mindx-week1-insights" \
    "/subscriptions/.../mindx-week2-insights" \
  --condition "avg requests/duration > 1000"
```

---

## ✅ Alerts Checklist

- [x] High Response Time Alert created (Sev 2)
- [x] High Exception Rate Alert created (Sev 1)
- [x] Alerts scoped to mindx-week1-insights
- [x] 5-minute evaluation window configured
- [x] 1-minute evaluation frequency set
- [x] Auto-resolve enabled
- [ ] Action groups configured (optional)
- [ ] Alerts tested and verified firing

---

## 🔗 Next Steps

- **Access Dashboards** → [Azure Portal Access Guide](./05-azure-portal-access.md)
- **Understand Metrics** → [Metrics Interpretation Guide](./06-metrics-interpretation.md)
- **Test Alerts** → [Testing Verification Guide](./09-testing-verification.md)

---

**Next:** [Azure Portal Access →](./05-azure-portal-access.md)

[← Back to Index](./README.md) | [← Previous: Frontend Integration](./03-frontend-integration.md)
