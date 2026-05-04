---
name: Enum
categories:
- object-oriented
tags:
- fundamentals
- java
- python
related:
- object
- encapsulation
code_lang: java
---

An enum is a type whose valid values are a fixed set of named constants. Enums make code safer and clearer than using raw strings or numbers because the compiler or interpreter can restrict values to the allowed choices.

Java enums are full classes that can have fields and methods. Python provides enums through the standard library's `enum` module.

```java
enum OrderStatus {
    PENDING,
    SHIPPED,
    DELIVERED
}

OrderStatus status = OrderStatus.SHIPPED;
```
