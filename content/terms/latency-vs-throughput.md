---
name: Latency vs Throughput
categories:
- networking
tags:
- fundamentals
- interview-prep
related:
- load-balancer
- tcp
code_lang: python
---

Latency is how long one operation takes. Throughput is how many operations can be completed in a period of time.

A system can have high throughput but poor latency if it processes many requests in batches while each individual request waits a long time. Performance work often requires deciding which metric matters most for the user experience.

**Example:** a delivery truck has high throughput when full, but one package may experience high latency while waiting for the truck to leave.

```python
latencies_ms = [42, 50, 47, 120]
throughput_per_second = len(latencies_ms) / 1.0
average_latency = sum(latencies_ms) / len(latencies_ms)

print(throughput_per_second, average_latency)
```
