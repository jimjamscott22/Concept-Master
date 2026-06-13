---
name: Coupling
categories:
- design
- object-oriented
tags:
- fundamentals
- interview-prep
related:
- cohesion
- dependency-injection
code_lang: java
---

Coupling describes how strongly one part of a system depends on another.

Tight coupling makes changes risky because one class may rely on another class's concrete implementation details. Loose coupling uses interfaces, dependency injection, events, or small data contracts so parts can change independently.

**Goal:** reduce unnecessary knowledge between modules while keeping useful collaboration explicit.

```java
interface Notifier {
    void send(String message);
}

class OrderService {
    private final Notifier notifier;

    OrderService(Notifier notifier) {
        this.notifier = notifier;
    }

    void placeOrder() {
        notifier.send("Order placed");
    }
}
```
