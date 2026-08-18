---
name: Rolling Deployment
categories:
- devops
tags:
- deployment
- release-strategy
- scaling
related:
- blue-green-deployment
- canary-deployment
- orchestration
code_lang: yaml
---

A rolling deployment replaces instances of a service gradually: a few old replicas stay up while new ones start, then the old ones are terminated, until the whole fleet is on the new version.

Unlike **blue-green** (two full environments, then a cutover) or **canary** (a small slice of traffic first), rolling updates reuse the same pool and keep capacity during the change. Users may briefly see mixed versions, so the new release should stay compatible with the previous one — especially for APIs, database schema, and message formats.

**Typical flow:**
- Start *N* new pods or VMs with the new image.
- Wait until they pass health checks.
- Stop *N* old instances.
- Repeat until none of the old version remain.

**Tradeoff:** cheaper than running two full environments, but rollback is slower than flipping a load balancer, and mixed-version traffic is expected during the rollout.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 6
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template:
    spec:
      containers:
        - name: web
          image: example/web:1.3.0
```
