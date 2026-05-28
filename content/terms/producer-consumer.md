---
name: Producer-Consumer
categories:
- concurrency
tags:
- concurrency
- interview-prep
- patterns
related:
- condition-variable
- mutex
- thread-pool
code_lang: python
---

A classic concurrency pattern: one or more **producer** threads push work items into a shared bounded buffer; one or more **consumer** threads pull items out and process them. The buffer decouples the two — producers don't have to wait for slow consumers, and consumers don't sit idle when producers are bursty.

**The synchronization problem:**
- A consumer must wait if the buffer is **empty**.
- A producer must wait if the buffer is **full** (bounded buffer — prevents unbounded memory growth).
- Mutual exclusion on the buffer itself.

**Classic solution — two condition variables sharing one mutex:**
- `not_empty` — consumers wait on this; producers signal it after pushing.
- `not_full` — producers wait on this; consumers signal it after popping.

**In practice:** you almost never write this by hand — use a thread-safe queue (`queue.Queue` in Python, `BlockingQueue` in Java, channels in Go) which encapsulate exactly this pattern.

```python
import threading
from collections import deque

CAPACITY = 4
buffer = deque()
lock = threading.Lock()
not_empty = threading.Condition(lock)
not_full  = threading.Condition(lock)

def produce(item):
    with not_full:
        while len(buffer) == CAPACITY:
            not_full.wait()
        buffer.append(item)
        not_empty.notify()

def consume():
    with not_empty:
        while not buffer:
            not_empty.wait()
        item = buffer.popleft()
        not_full.notify()
    return item
```
