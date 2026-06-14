---
name: Observability
categories:
- devops
tags:
- monitoring
- operations
- reliability
code_lang: yaml
---

Observability is the ability to understand a system's internal state from the signals it emits.

It goes beyond basic uptime monitoring by helping engineers answer new questions during incidents, debugging, and performance investigations.

**Core signals:**
- **Metrics:** numeric measurements over time, such as request rate or CPU usage.
- **Logs:** timestamped events and application messages.
- **Traces:** request paths across services.

Strong observability helps teams detect failures, explain why they happened, and confirm that fixes worked.

```yaml
alert:
  name: high-error-rate
  condition: error_rate > 0.02
  duration: 5m
  severity: page
```
