---
name: System Call
categories:
- operating-systems
tags:
- exam-review
- interview-prep
related:
- context-switch
- process-vs-thread
code_lang: c
---

The controlled mechanism by which a user-space program requests a service from the OS kernel — file I/O, process creation, network sockets, memory mapping, etc. The CPU traps from **user mode** into **kernel mode**, executes the requested kernel routine, and returns with a result and `errno`.

**Typical invocation flow:**
1. The libc wrapper places the syscall number in a register (e.g. `rax` on x86-64) and arguments in the ABI-defined registers.
2. The `syscall` instruction triggers a mode switch into the kernel's syscall entry point.
3. The kernel dispatches via the syscall table, validates arguments, and runs the handler.
4. The return value is placed in a register; control returns to user space.

Because each call crosses the user/kernel boundary it has measurable cost (hundreds of nanoseconds plus cache effects), which is why high-performance code batches I/O (`writev`, `io_uring`) or uses memory-mapped files.

**Familiar POSIX system calls:** `open`, `read`, `write`, `close`, `fork`, `execve`, `mmap`, `brk`, `socket`, `epoll_wait`, `clone`, `wait4`.

```c
#include <unistd.h>

ssize_t n = write(1, "hello\n", 6);
```
