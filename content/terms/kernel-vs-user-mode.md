---
name: Kernel vs User Mode
categories:
- operating-systems
tags:
- os
- fundamentals
- security
related: [system-call, interrupt]
code_lang: c
---

Two CPU privilege levels enforced by hardware. **User mode** runs application code with a restricted instruction set and no direct access to hardware or kernel memory. **Kernel mode** (a.k.a. *supervisor mode*, ring 0 on x86) runs the OS kernel with full access to everything.

**Why split them?**
- **Isolation.** A buggy or malicious user program can't corrupt the kernel or other processes' memory.
- **Mediation.** All access to devices, files, network, and other processes is funneled through the kernel, which can enforce policy.

**Crossing the boundary** happens via:
- A **system call** (deliberate — `syscall`, `int 0x80`, or `SVC` on ARM)
- An **interrupt** (asynchronous — timer, device)
- An **exception** (synchronous — page fault, illegal instruction)

The transition switches stack, swaps page tables (or at least permissions), and saves/restores CPU state. It's not free — typically hundreds of nanoseconds — which is why batching syscalls (e.g. `writev`, `io_uring`) matters for throughput.

```c
// User mode — this works
int x = 42;
printf("%d\n", x);

// User mode — this faults (privileged instruction)
asm volatile("cli");     // disable interrupts → SIGSEGV / GPF

// To do something privileged, ask the kernel:
write(1, "hi\n", 3);     // syscall → traps into kernel mode → returns
```
