---
name: Atomic Operation
categories:
- concurrency
tags:
- concurrency
- fundamentals
related: [race-condition, mutex, semaphore]
code_lang: java
---

An operation that appears to other threads as a **single, indivisible step** — it either fully happens or doesn't, with no observable intermediate state. There's no moment another thread can read "half" of an atomic update.

**Why this matters:** ordinary operations you think are atomic usually aren't. `counter++` is *three* steps (read, add, write); two threads racing on it can each read the same starting value and clobber each other's increment.

**Hardware primitives** (the building blocks):
- **Compare-and-Swap (CAS)** — "set memory at X to N, but only if it currently equals E". Returns whether it succeeded. Used to build lock-free queues, counters, etc.
- **Fetch-and-Add**, **Load-Linked / Store-Conditional** — variations on the same theme.
- Backed by CPU instructions (`LOCK CMPXCHG` on x86, `LDREX/STREX` on ARM).

**Atomic vs lock-based:** locks protect a *region of code*; atomics protect a *single variable*. Atomics avoid context-switching overhead but can only express simple updates.

```java
import java.util.concurrent.atomic.AtomicInteger;

AtomicInteger counter = new AtomicInteger(0);

// Safe across threads — no lock needed
counter.incrementAndGet();

// Manual CAS loop — retry until we win the race
int prev, next;
do {
    prev = counter.get();
    next = prev * 2;
} while (!counter.compareAndSet(prev, next));
```
