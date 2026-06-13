---
name: Load Balancer
categories:
- networking
tags:
- distributed-systems
- infrastructure
code_lang: bash
---

A load balancer distributes incoming network traffic across multiple backend servers (a *pool* or *farm*), preventing any single server from becoming a bottleneck.

**Layers:**
- **L4 (transport):** routes based on IP/TCP without inspecting content — very fast.
- **L7 (application):** routes based on HTTP headers, URL path, cookies — enables content-based routing, SSL termination, sticky sessions.

**Common algorithms:**
- **Round-robin:** requests cycle through servers in order.
- **Least connections:** route to the server with the fewest active connections.
- **IP hash:** same client IP always goes to the same server (useful for session affinity).
- **Weighted round-robin:** heavier-spec servers get a higher share.

**Health checks:** the load balancer periodically probes backends; unhealthy servers are taken out of rotation automatically.

**Examples:** AWS ALB/NLB, Nginx, HAProxy, Caddy.

```bash
# Minimal Nginx round-robin config
# /etc/nginx/conf.d/app.conf

upstream backend {
    server 10.0.0.1:8000;
    server 10.0.0.2:8000;
    server 10.0.0.3:8000;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
    }
}
```
