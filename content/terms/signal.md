---
name: Signal
categories:
- operating-systems
tags:
- fundamentals
- interview-prep
related:
- process-vs-thread
- system-call
code_lang: c
---

A signal is a limited asynchronous notification sent to a process or thread by the operating system or another process.

Signals are used for events such as interruption, termination, child process exit, and invalid memory access. Programs can handle some signals, ignore some signals, and must accept the default behavior for others.

**Examples:** `SIGINT` is often sent by Ctrl+C, and `SIGTERM` asks a process to shut down.

```c
#include <signal.h>
#include <stdio.h>

void handle_sigint(int signum) {
    printf("caught signal %d\n", signum);
}

int main(void) {
    signal(SIGINT, handle_sigint);
    while (1) {}
}
```
