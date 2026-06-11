---
name: Adapter Pattern
categories:
- design-patterns
- design
tags:
- fundamentals
- interview-prep
- java
related:
- dependency-injection
- java-interface
code_lang: java
---

The adapter pattern lets code with one interface work with code that expects a different interface.

An adapter wraps an existing object and translates calls into the shape the client needs. This is useful when integrating third-party libraries, legacy code, or APIs that should not leak into the rest of the application.

**Key idea:** change the interface without changing the wrapped object.

```java
interface PaymentGateway {
    void charge(int cents);
}

class StripeClient {
    void createCharge(int amountInCents) {}
}

class StripeAdapter implements PaymentGateway {
    private final StripeClient stripe;

    StripeAdapter(StripeClient stripe) {
        this.stripe = stripe;
    }

    public void charge(int cents) {
        stripe.createCharge(cents);
    }
}
```
