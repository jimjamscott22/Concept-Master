---
name: SOLID Principles
categories:
- design
- object-oriented
tags:
- fundamentals
- interview-prep
- java
related:
- dependency-injection
- java-interface
code_lang: java
---

SOLID is a group of object-oriented design principles that help classes stay understandable, flexible, and testable.

The acronym stands for Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion. The principles are guidelines, not laws; they are most useful when they reduce real change friction.

**Key idea:** design code so new behavior can often be added without rewriting stable code.

```java
interface DiscountPolicy {
    double apply(double subtotal);
}

class CheckoutService {
    private final DiscountPolicy discountPolicy;

    CheckoutService(DiscountPolicy discountPolicy) {
        this.discountPolicy = discountPolicy;
    }

    double total(double subtotal) {
        return discountPolicy.apply(subtotal);
    }
}
```
