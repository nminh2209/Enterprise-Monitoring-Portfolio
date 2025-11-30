# 1. Overview & Setup

**Section:** Week 2 Metrics Implementation  
**Focus:** Project overview and initial Azure Application Insights setup

---

## 📊 Overview

Week 2 focuses on implementing comprehensive metrics collection for both production monitoring (Azure Application Insights) and product analytics (Google Analytics 4).

### Objectives

1. **Production Monitoring:** Track application health, performance, and errors
2. **Product Analytics:** Understand user behavior and engagement
3. **Proactive Alerting:** Get notified of issues before users report them
4. **Data-Driven Decisions:** Make informed choices based on real metrics

---

## 🎯 Acceptance Criteria Status

- [x] **Azure App Insights integrated** - Backend and frontend instrumented
- [x] **Application logs, errors, performance metrics visible** - Real-time telemetry working
- [x] **Alerts setup and tested** - 2 alerts configured for response time and exceptions
- [x] **Google Analytics integrated** - GA4 property created and collecting data
- [x] **Product metrics tracked** - Login, logout, page views, user events
- [x] **Documentation provided** - Complete guide with multiple sections
- [x] **Configuration committed** - All code changes in repository

**Status:** ✅ ALL CRITERIA MET

---

## 🔧 Azure Application Insights Setup

### Resource Details

| Property | Value |
|----------|-------|
| **Resource Name** | `mindx-week1-insights` |
| **Resource Group** | `mindx-minhnh-rg` |
| **Location** | Southeast Asia |
| **Type** | Application Insights (Web) |
| **Instrumentation Key** | `f97d9fcc-bf08-46d9-985c-458c6fa4ce7a` |

### Connection String
```
InstrumentationKey=f97d9fcc-bf08-46d9-985c-458c6fa4ce7a;
IngestionEndpoint=https://southeastasia-1.in.applicationinsights.azure.com/;
LiveEndpoint=https://southeastasia.livediagnostics.monitor.azure.com/;
ApplicationId=95976a35-6e1c-4dff-bc84-3b4cbcc8b360
```

---

## 🚀 Creation Command

### Using Azure CLI

```bash
az monitor app-insights component create \
  --app mindx-week1-insights \
  --location southeastasia \
  --resource-group mindx-minhnh-rg \
  --application-type web
```

### Retrieve Connection Details

```bash
# Get instrumentation key
az monitor app-insights component show \
  --app mindx-week1-insights \
  --resource-group mindx-minhnh-rg \
  --query instrumentationKey -o tsv

# Get connection string
az monitor app-insights component show \
  --app mindx-week1-insights \
  --resource-group mindx-minhnh-rg \
  --query connectionString -o tsv
```

---

## 📋 What Gets Monitored

### Automatic Collection

Application Insights automatically collects:

- ✅ **HTTP Requests** - All incoming requests with response times and status codes
- ✅ **Dependencies** - External HTTP calls, database queries
- ✅ **Exceptions** - Unhandled exceptions with full stack traces
- ✅ **Performance Counters** - CPU usage, memory consumption, request rates
- ✅ **Live Metrics** - Real-time application monitoring

### Custom Tracking

You can also track:

- ✅ **Custom Events** - Business events like login, logout, purchases
- ✅ **Custom Metrics** - Application-specific counters and gauges
- ✅ **Custom Properties** - Additional context attached to telemetry
- ✅ **User Tracking** - User journeys and behavior patterns

---

## 🏗️ Architecture Overview

```
┌─────────────────┐
│   Frontend      │  Browser telemetry
│   (React)       │  ─────────┐
└─────────────────┘           │
                              ▼
┌─────────────────┐    ┌──────────────────┐
│   Backend       │───▶│  Application     │
│   (Node.js)     │    │  Insights        │
└─────────────────┘    └──────────────────┘
         │                      │
         │                      ▼
         │              ┌──────────────────┐
         │              │  Azure Portal    │
         │              │  Dashboards      │
         │              └──────────────────┘
         │
         ▼
┌─────────────────┐
│  Google         │
│  Analytics 4    │
└─────────────────┘
```

---

## 💡 Key Features

### For Production Monitoring

1. **Live Metrics Stream**
   - See requests in real-time (< 1 second latency)
   - Monitor server performance live
   - Detect issues instantly

2. **Application Map**
   - Visual topology of your application
   - Shows dependencies and health
   - Identifies bottlenecks

3. **Smart Detection**
   - AI-powered anomaly detection
   - Automatic alerts for unusual patterns
   - Proactive issue identification

4. **Distributed Tracing**
   - Track requests across services
   - End-to-end transaction monitoring
   - Performance bottleneck identification

### For Product Analytics

1. **User Behavior**
   - Track user journeys
   - Funnel analysis
   - Conversion tracking

2. **Engagement Metrics**
   - Session duration
   - Page views per session
   - Active users

3. **Custom Events**
   - Business-specific tracking
   - Feature usage
   - User actions

---

## 🎯 Success Metrics

### Week 2 Goals

| Goal | Target | Achieved |
|------|--------|----------|
| Application Insights Setup | Complete | ✅ Yes |
| Backend Integration | Working | ✅ Yes |
| Frontend Integration | Working | ✅ Yes |
| Alerts Configured | 2+ alerts | ✅ 2 alerts |
| Google Analytics | Live | ✅ Yes |
| Documentation | Complete | ✅ Yes |

### Production Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Response Time | < 200ms | ✅ 846.4µs |
| Availability | > 99.9% | ✅ 100% |
| Error Rate | < 1% | ✅ 0% |
| Data Freshness | < 5min | ✅ Real-time |

---

## 🔗 Next Steps

1. **Understand Backend Integration** → [Backend Integration Guide](./02-backend-integration.md)
2. **Learn Frontend Setup** → [Frontend Integration Guide](./03-frontend-integration.md)
3. **Access Your Metrics** → [Azure Portal Access Guide](./05-azure-portal-access.md)

---

## 📚 Additional Resources

- **Azure Documentation:** https://docs.microsoft.com/azure/azure-monitor/app/app-insights-overview
- **Quick Access Guide:** [QUICK_ACCESS_METRICS.md](./QUICK_ACCESS_METRICS.md)
- **Troubleshooting:** [Troubleshooting Guide](./10-troubleshooting.md)

---

**Next:** [Backend Integration →](./02-backend-integration.md)

[← Back to Index](./README.md)
