---
name: Context Switch
categories:
- concurrency
- operating-systems
tags:
- exam-review
- interview-prep
related:
- cpu-scheduling
- interrupt
- paging
- process-vs-thread
- system-call
---

The act of saving the CPU state of one process or thread and restoring the state of another so that multiple tasks can share a single core. Triggered by the scheduler on a time-slice expiry, a blocking system call, an interrupt, or a higher-priority task becoming runnable.

**What gets saved/restored:**
- General-purpose and floating-point registers
- Program counter and stack pointer
- Process status flags
- For a *process* switch: the page-table base register (which forces a TLB flush on most architectures)

**Cost:**
- Direct cost is small (microseconds) — just register saves and a kernel-mode round trip.
- The **indirect** cost dominates: cache and TLB misses after the switch, plus pipeline stalls.
- Thread switches within one process are cheaper than full process switches because the address space (and thus the TLB) is preserved.

Excessive context-switching (visible as high `cs/s` in `vmstat`) is a classic sign of lock contention or oversubscribed thread pools.
