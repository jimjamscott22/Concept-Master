---
name: Orchestration
categories:
- devops
tags:
- containers
- infrastructure
- scaling
code_lang: yaml
---

Orchestration automates the deployment, scheduling, scaling, networking, and recovery of services across a group of machines.

In container platforms, an orchestrator decides where containers run, keeps the desired number of replicas healthy, restarts failed workloads, and connects services through internal networking.

**Common responsibilities:**
- Place workloads on available nodes.
- Restart unhealthy containers.
- Scale replicas up or down.
- Roll out new versions gradually.
- Manage service discovery and load balancing.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: example/web:1.2.0
          ports:
            - containerPort: 8080
```
