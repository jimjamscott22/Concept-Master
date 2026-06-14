---
name: Canary Deployment
categories:
- devops
tags:
- deployment
- monitoring
- release-strategy
code_lang: yaml
---

A canary deployment releases a new version to a small portion of users or traffic before gradually expanding it.

The goal is to detect problems early with limited blast radius. Teams watch metrics, logs, traces, and error rates while shifting more traffic to the new version.

**Typical flow:**
- Send 1-5% of traffic to the new version.
- Monitor health and business metrics.
- Increase traffic if the canary is healthy.
- Roll back if errors, latency, or alerts increase.

```yaml
traffic:
  stable:
    version: app-v1
    weight: 95
  canary:
    version: app-v2
    weight: 5
```
