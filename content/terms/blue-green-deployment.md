---
name: Blue-Green Deployment
categories:
- devops
tags:
- deployment
- release-strategy
- rollback
code_lang: bash
---

A blue-green deployment runs two production-like environments: one serving live traffic and one waiting with the new version.

The active environment is often called **blue**, while the idle or new environment is **green**. After validation, traffic switches from blue to green. If something fails, traffic can switch back quickly.

**Why teams use it:**
- Reduces deployment downtime.
- Makes rollback simple.
- Allows production-like validation before users see the release.

The tradeoff is cost and operational complexity, because two full environments may need to exist at the same time.

```bash
# Example shape: point the load balancer at the green target group
aws elbv2 modify-listener \
  --listener-arn "$LISTENER_ARN" \
  --default-actions Type=forward,TargetGroupArn="$GREEN_TARGET_GROUP_ARN"
```
