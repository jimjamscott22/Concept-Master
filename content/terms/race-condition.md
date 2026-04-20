---
name: Race Condition
categories:
- concurrency
tags:
- advanced
- interview-prep
- java
- python
- systems
code_lang: python
---

A race condition occurs when the result of a program depends on the timing or ordering of concurrent operations accessing shared state.

These bugs can be intermittent and hard to reproduce because small scheduling changes can alter the outcome.

**Java example:**
```java
AtomicInteger counter = new AtomicInteger(0);

void increment() {
    counter.incrementAndGet();
}
```

```python
import threading

counter = 0
lock = threading.Lock()

def increment():
    global counter
    with lock:
        counter += 1
```
