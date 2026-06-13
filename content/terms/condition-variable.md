---
name: Condition Variable
categories:
- concurrency
tags:
- concurrency
- synchronization
related:
- producer-consumer
code_lang: python
---

A synchronization primitive that lets a thread **wait for some condition on shared state to become true** without busy-spinning. Always used *with* a mutex: the mutex protects the state; the condition variable lets you sleep until a peer signals that the state changed.

**The three operations:**
- **`wait()`** — atomically releases the held mutex and puts the thread to sleep. When woken, reacquires the mutex before returning.
- **`notify()` / `signal()`** — wake one waiting thread.
- **`notify_all()` / `broadcast()`** — wake them all.

**The cardinal rule — always wait in a loop:**
Why? **Spurious wakeups** can happen (the OS may wake a thread without a `notify`), and another thread may have grabbed the resource between your wakeup and your re-acquiring the lock. Re-check.

**vs. Semaphore:** a semaphore is just a count; a condition variable lets you wait on *any* predicate over arbitrary shared state.

```python
while not condition_holds():
    cv.wait()
```

```python
import threading
from collections import deque

queue = deque()
lock = threading.Lock()
not_empty = threading.Condition(lock)

def consumer():
    with not_empty:
        while not queue:               # loop, not if!
            not_empty.wait()
        item = queue.popleft()
    process(item)

def producer(item):
    with not_empty:
        queue.append(item)
        not_empty.notify()             # wake one consumer
```

**vs. Semaphore:** a semaphore is just a count; a condition variable lets you wait on *any* predicate over arbitrary shared state.

```python
while not condition_holds():
    cv.wait()
```
