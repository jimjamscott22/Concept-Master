---
name: Deadlock
categories:
- concurrency
tags:
- java
- systems
code_lang: python
---

A situation where two or more threads are blocked forever, each waiting for a resource held by another.

**Conditions (Coffman):** mutual exclusion, hold and wait, no preemption, circular wait.

**Java example:**
```java
Object lockA = new Object();
Object lockB = new Object();

// Thread 1: lockA then lockB
// Thread 2: lockB then lockA
// => potential deadlock
```

```python
# Classic deadlock: two threads, two locks
import threading
lock_a = threading.Lock()
lock_b = threading.Lock()

# Thread 1: acquires lock_a, then lock_b
# Thread 2: acquires lock_b, then lock_a
# => potential deadlock
```
