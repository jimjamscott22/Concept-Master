---
name: File Descriptor
categories:
- operating-systems
tags:
- os
- unix
- fundamentals
related: [system-call]
code_lang: c
---

A small non-negative integer the kernel hands back when a process opens *anything* — a file, a pipe, a socket, a terminal, an event source — that the process can later pass back to syscalls (`read`, `write`, `close`, `poll`) to refer to that resource. The integer is just an **index into the process's per-process file-descriptor table**, which the kernel maintains.

**Standard descriptors** (inherited from the parent at `fork`/`exec`):
| FD | Name   | Default              |
| -- | ------ | -------------------- |
| 0  | stdin  | keyboard / pipe in   |
| 1  | stdout | terminal / pipe out  |
| 2  | stderr | terminal             |

**Why it's a powerful abstraction:**
- "Everything is a file" — the same `read()` / `write()` work on a TCP socket, a regular file, a pipe, or `/dev/urandom`.
- Descriptors are inherited across `fork()` and survive `exec()` unless flagged `O_CLOEXEC` — this is how shells wire up pipelines.
- They're capability-like: holding the fd is the right to use the resource.

**Common pitfalls:**
- **Leaks.** Forget to `close()` and you eventually hit `EMFILE` (per-process limit, often 1024 by default).
- **Stale fds.** `close()` then reuse — another thread's `read(old_fd, ...)` might now hit a brand-new resource.

```c
int fd = open("/etc/hostname", O_RDONLY);   // fd is probably 3
char buf[64];
ssize_t n = read(fd, buf, sizeof(buf));
write(1, buf, n);                           // 1 = stdout
close(fd);
```
