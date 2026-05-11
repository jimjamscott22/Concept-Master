---
name: CPU Scheduling
categories:
- operating-systems
tags:
- os
- fundamentals
related: [process-vs-thread, context-switch]
code_lang: python
---

The kernel subsystem that decides **which ready process (or thread) gets the CPU next**, and for how long. Because there are almost always more runnable tasks than cores, the scheduler arbitrates — and its policy directly shapes responsiveness, throughput, and fairness.

**Two big axes:**
- **Preemptive vs cooperative.** Preemptive schedulers can yank the CPU away on a timer interrupt; cooperative ones wait for the task to yield. Modern OSes are preemptive.
- **Policy.** *Round-robin* (each task gets a fixed time slice), *priority* (highest priority wins, risks starvation), *Multilevel Feedback Queue* (Linux's old O(1) scheduler — promote/demote based on CPU usage), *Completely Fair Scheduler* (Linux CFS — uses virtual runtime to share CPU proportionally).

**Key terms:**
- **Quantum / time slice** — how long a task runs before the scheduler reconsiders.
- **Starvation** — a low-priority task never gets to run.
- **Aging** — gradually raise priority of waiting tasks to prevent starvation.

```python
# Toy round-robin scheduler
from collections import deque

ready = deque([("A", 5), ("B", 3), ("C", 8)])  # (task, work_left)
QUANTUM = 2

while ready:
    task, work = ready.popleft()
    run = min(QUANTUM, work)
    print(f"run {task} for {run}")
    if work - run > 0:
        ready.append((task, work - run))   # back to tail
```
