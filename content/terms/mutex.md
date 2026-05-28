---
name: Mutex
categories:
- concurrency
tags:
- fundamentals
- os
related:
- process-vs-thread
- producer-consumer
code_lang: python
---

A **mut**ual **ex**clusion lock — a synchronization primitive that ensures only one thread at a time can enter a critical section. A thread *acquires* the mutex before entering and *releases* it when done; any other thread that tries to acquire it blocks until it is released.

**Key properties:**
- **Ownership:** only the thread that acquired it can release it.
- **Non-reentrant by default** (attempting to re-acquire from the same thread deadlocks unless it is a *reentrant/recursive* mutex).
- Heavier than a spinlock because blocked threads are put to sleep by the OS.

**vs. Semaphore:** a semaphore has a count and can be signaled by *any* thread; a mutex has an owner.

```python
import threading

counter = 0
lock = threading.Lock()

def increment():
    global counter
    with lock:          # acquire on enter, release on exit (even if exception)
        counter += 1

threads = [threading.Thread(target=increment) for _ in range(1000)]
for t in threads: t.start()
for t in threads: t.join()
print(counter)  # always 1000
```
