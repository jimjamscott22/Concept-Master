---
name: Page Fault
categories:
- operating-systems
- memory-management
tags:
- os
- memory
related: [virtual-memory, paging]
code_lang: c
---

A CPU exception raised when a program touches a virtual address whose page is **not currently mapped** to a physical frame. The MMU walks the page table, finds the *present* bit clear (or a permission mismatch), and traps into the kernel's page-fault handler — which decides what to do.

**Three outcomes:**
- **Minor fault** — the page is already in RAM (e.g. shared with another process, or in the page cache); the kernel just fixes up the page-table entry. Fast.
- **Major fault** — the page must be read from disk (swapped out, or never loaded — *demand paging*). Slow: milliseconds, vs. nanoseconds for a hit.
- **Invalid fault** — the address isn't backed by anything legal. The kernel delivers `SIGSEGV` and (usually) kills the process.

**Why page faults are a feature, not a bug:**
- They enable **demand paging** — only load what's actually touched.
- They enable **copy-on-write** for `fork()` — both processes share pages until one writes, which traps and triggers a copy.
- They enable **memory-mapped files** — disk I/O disguised as memory access.

```c
// Demonstrating a major fault — first touch of a freshly mapped region
char *p = mmap(NULL, 4096, PROT_READ | PROT_WRITE,
               MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);

p[0] = 'x';   // page-fault → kernel allocates a zeroed frame → maps it → resumes
p[1] = 'y';   // no fault: page is now resident
```

You can watch them with `getrusage()` (`ru_minflt`, `ru_majflt`) or `/usr/bin/time -v`.
