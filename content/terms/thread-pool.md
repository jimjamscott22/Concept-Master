---
name: Thread Pool
categories:
- concurrency
tags:
- concurrency
- patterns
- performance
related:
- asynchronous-programming
- producer-consumer
code_lang: java
---

A fixed (or bounded) collection of worker threads that pull tasks from a shared queue, instead of spawning a fresh thread per task. The pool **amortizes thread-creation cost** and **caps concurrency** so the program doesn't melt under load.

**Why not just spawn a thread per task?**
- Thread creation isn't free — kernel stack allocation, scheduling setup. Often hundreds of microseconds.
- Unbounded threads → unbounded memory (each stack is ~1 MB by default) → context-switching collapse.
- Most workloads benefit from concurrency *matching the hardware*, not exceeding it.

**Sizing heuristics:**
- **CPU-bound** work: pool size ≈ number of cores.
- **I/O-bound** work: pool can be much larger — threads spend most of their time blocked.
- **Mixed:** Little's Law — `threads ≈ target_throughput × average_latency`.

**Watch out for:**
- **Deadlock by exhaustion** — if pool tasks submit and *wait on* other pool tasks, you can fill the pool with waiters. Use separate pools or async composition.
- **Queue overflow** — what should happen when the queue is full? Block? Drop? Run on the caller? Pick deliberately.

```java
import java.util.concurrent.*;

ExecutorService pool = Executors.newFixedThreadPool(8);

for (int i = 0; i < 1000; i++) {
    final int n = i;
    pool.submit(() -> System.out.println("task " + n + " on " +
                       Thread.currentThread().getName()));
}

pool.shutdown();                                  // no new tasks accepted
pool.awaitTermination(1, TimeUnit.MINUTES);
```
