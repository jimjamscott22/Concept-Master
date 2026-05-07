---
name: Process vs Thread
categories:
- operating-systems
- concurrency
tags:
- exam-review
- interview-prep
code_lang: python
related:
- thread
- context-switch
- mutex
---

A **process** is an independent program in execution with its own virtual address space, file descriptors, and OS resources. A **thread** is a unit of execution that lives *inside* a process and shares that process's memory and resources with sibling threads.

| Aspect | Process | Thread |
| ------------------- | ----------------------- | --------------------------------- |
| Memory              | Isolated address space  | Shared with other threads in proc |
| Creation cost       | High                    | Low                               |
| Communication       | IPC (pipes, sockets)    | Shared memory (needs sync)        |
| Crash isolation     | One crash ≠ kill others | One thread crash kills process    |
| Context-switch cost | Higher                  | Lower                             |

Use **processes** for isolation and CPU-bound parallelism on multi-core machines (especially under Python's GIL). Use **threads** for I/O-bound concurrency and lightweight task parallelism.

```python
from multiprocessing import Process
from threading import Thread

Process(target=work).start()
Thread(target=work).start()
```
