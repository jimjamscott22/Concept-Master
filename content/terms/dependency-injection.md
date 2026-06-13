---
name: Dependency Injection
categories:
- design-patterns
- object-oriented
tags:
- fundamentals
- interview-prep
- java
related:
- virtual-environment-python
code_lang: java
---

Dependency injection is a design pattern where an object receives the dependencies it needs instead of creating them directly.

This makes code easier to test and change because classes depend on interfaces or abstractions rather than hard-coded concrete implementations.

**Common form:** pass dependencies through a constructor.

```java
interface EmailSender {
    void send(String address, String message);
}

class SignupService {
    private final EmailSender emailSender;

    SignupService(EmailSender emailSender) {
        this.emailSender = emailSender;
    }

    void welcome(String address) {
        emailSender.send(address, "Welcome!");
    }
}
```
