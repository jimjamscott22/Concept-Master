---
name: Virtual Memory
categories:
- operating-systems
- memory-management
tags:
- exam-review
- interview-prep
related:
- paging
- stack-vs-heap-memory
- garbage-collection
---

An OS abstraction that gives each process the illusion of a large, contiguous, private address space, while the kernel and MMU transparently map virtual addresses to physical RAM (or disk-backed pages).

**Why it exists:**
- **Isolation** — processes can't read or corrupt each other's memory.
- **Over-commit** — the sum of all virtual address spaces can exceed physical RAM; cold pages spill to a swap file.
- **Relocation** — code and data can sit anywhere in physical memory without recompilation.
- **Protection** — page-table entries carry read/write/execute permission bits.

**Mechanics:**
- Virtual addresses are split into a **page number** + **offset**.
- The MMU walks the **page table** to translate the page number to a **frame number**, with recently-used translations cached in the **TLB** (translation lookaside buffer).
- A reference to an unmapped page triggers a **page fault**, letting the kernel load the page from disk or terminate the process on an invalid access.
