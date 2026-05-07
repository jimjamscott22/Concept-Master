---
name: Paging
categories:
- operating-systems
- memory-management
tags:
- exam-review
related:
- virtual-memory
- context-switch
---

A memory-management scheme that divides virtual and physical memory into fixed-size blocks — **pages** in the virtual space, **frames** in physical RAM — and maps pages to frames through a per-process **page table**.

**Key properties:**
- Eliminates external fragmentation (every free frame is interchangeable).
- May produce small **internal fragmentation** in the last page of an allocation.
- Page sizes are typically 4 KiB, with optional **huge pages** (2 MiB / 1 GiB) to reduce TLB pressure.

**Address translation (single-level):**

```
virtual address: [ page number | offset ]
                       │           │
                       ▼           │
                  page table       │
                       │           │
                       ▼           ▼
physical addr:   [ frame number | offset ]
```

**Page replacement** — when RAM is full and a new page must be loaded, the kernel evicts an existing frame using a policy like LRU, Clock, or LFU. Poorly tuned working sets cause **thrashing**: the system spends more time paging than computing.
