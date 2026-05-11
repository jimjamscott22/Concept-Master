---
name: Interrupt
categories:
- operating-systems
tags:
- os
- fundamentals
related: [system-call, context-switch]
code_lang: c
---

A signal — usually from hardware — that asynchronously diverts the CPU from whatever it was doing to run a handler (an **Interrupt Service Routine**, or ISR). Interrupts are how the outside world (keyboard, NIC, disk, timer) gets the CPU's attention without it having to constantly poll.

**Flavors:**
- **Hardware interrupts** — raised by devices via the interrupt controller (e.g. APIC). The classic *timer interrupt* is what enables preemptive scheduling.
- **Software interrupts / traps** — deliberately raised by an instruction (e.g. `int 0x80`, `syscall`) to enter the kernel.
- **Exceptions** — synchronous interrupts caused by the current instruction (page fault, divide-by-zero).

**Handling flow:**
1. CPU finishes its current instruction.
2. Pushes state (registers, PC) onto the kernel stack.
3. Looks up the handler in the **Interrupt Descriptor Table** (IDT) by vector number.
4. Runs the ISR — typically short, masking further interrupts of the same kind.
5. Restores state and returns (`iret`).

ISRs should be **fast**; long work is deferred to a *bottom half* (Linux), *DPC* (Windows), or a tasklet.

```c
// Linux kernel-ish style ISR registration (simplified)
irqreturn_t my_handler(int irq, void *dev) {
    // acknowledge device, copy data into a buffer
    schedule_work(&deferred);   // do the heavy lifting later
    return IRQ_HANDLED;
}

request_irq(IRQ_NUM, my_handler, IRQF_SHARED, "mydev", dev);
```
