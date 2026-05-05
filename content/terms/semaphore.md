---
name: Semaphore
categories:
- concurrency
tags:
- fundamentals
- os
code_lang: python
---

A semaphore is a synchronization primitive with an integer counter. Two atomic operations:
- **acquire / wait (P):** decrements the counter; if it would go below 0, the thread blocks.
- **release / signal (V):** increments the counter, waking a blocked thread if any.

**Binary semaphore (value 0 or 1):** behaves like a mutex but *without ownership* — any thread can release it. Used for signaling between threads.

**Counting semaphore:** limits concurrent access to a resource pool (e.g., a database connection pool of size N).

```python
import threading

# Allow at most 3 concurrent workers
pool = threading.Semaphore(3)

def worker(n):
    pool.acquire()
    try:
        print(f"Worker {n} running")
        # ... do work ...
    finally:
        pool.release()

threads = [threading.Thread(target=worker, args=(i,)) for i in range(10)]
for t in threads: t.start()
for t in threads: t.join()
```
