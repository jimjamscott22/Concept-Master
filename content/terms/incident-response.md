---
name: Incident Response
categories:
- devops
tags:
- operations
- reliability
- monitoring
code_lang: bash
---

Incident response is the process a team follows when a production system is degraded, unavailable, insecure, or behaving unexpectedly.

The goal is to restore service safely, communicate clearly, and learn from the event without assigning blame.

**Common phases:**
- **Detect:** alert on symptoms or user reports.
- **Triage:** assess severity, scope, and ownership.
- **Mitigate:** reduce impact through rollback, failover, scaling, or feature flags.
- **Resolve:** fix the underlying issue.
- **Review:** write a postmortem and track follow-up work.

```bash
# Fast mitigation example: roll back a Kubernetes deployment
kubectl rollout undo deployment/web
kubectl rollout status deployment/web
```
