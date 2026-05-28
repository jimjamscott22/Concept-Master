---
name: Lambda Expression
categories:
- functional-programming
- object-oriented
tags:
- fundamentals
- java
- python
related:
- higher-order-function
code_lang: java
---

A lambda expression is a compact way to write an anonymous function. Lambdas are often passed into higher-order functions to describe behavior without declaring a separate named method or class.

In Java, lambdas work with functional interfaces such as `Predicate<T>`, `Function<T, R>`, and `Runnable`. In Python, `lambda` creates a small single-expression function.

```java
List<String> names = List.of("Ada", "Grace", "Linus");

List<String> shortNames = names.stream()
    .filter(name -> name.length() <= 4)
    .toList();
```
