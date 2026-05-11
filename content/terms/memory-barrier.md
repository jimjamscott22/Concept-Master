---
name: Memory Barrier
categories:
- concurrency
- memory-management
tags:
- concurrency
- advanced
related: [atomic-operation, race-condition]
code_lang: java
---

A CPU (or compiler) instruction that **constrains the ordering** of memory operations around it, so that other threads observe writes in a predictable order. Without barriers, both the compiler and the CPU are free to reorder loads and stores for performance — which is invisible to a single thread, but can produce baffling bugs across threads.

**Why reordering happens:**
- **Compiler:** moves a load above a store if it thinks no one looks.
- **CPU:** out-of-order execution, store buffers, and per-core caches mean Thread B may see Thread A's writes in a different order than A issued them.

**Types of barriers:**
- **Load barrier** (`lfence`) — no later load may be reordered before earlier loads.
- **Store barrier** (`sfence`) — no later store may be reordered before earlier stores.
- **Full barrier** (`mfence`) — no reordering across the fence in either direction.

**Happens-before** is the language-level model built on top of barriers. In Java's memory model, an unlock *happens-before* the next lock on the same monitor; a `volatile` write happens-before every subsequent `volatile` read of the same field. That guarantee is implemented with barriers under the hood.

**You rarely write barriers directly** — they're emitted automatically by:
- `synchronized` / `Lock` (Java)
- `volatile` fields (Java) — full barrier semantics on read/write
- `std::atomic` operations (C++) with explicit memory orders
- Mutex acquire/release in any language

```java
class Flag {
    private volatile boolean ready = false;   // volatile = barrier on access
    private int data;

    void writer() {
        data = 42;
        ready = true;          // happens-before the reader seeing ready==true
    }
    void reader() {
        if (ready) {
            assert data == 42; // guaranteed by the happens-before edge
        }
    }
}
```
