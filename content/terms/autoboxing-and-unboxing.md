---
name: Autoboxing and Unboxing
categories:
- memory-management
- object-oriented
tags:
- fundamentals
- interview-prep
- java
code_lang: java
---

Autoboxing is Java's automatic conversion from a primitive value to its wrapper object, such as `int` to `Integer`. Unboxing is the reverse conversion from a wrapper object back to a primitive.

It makes collections and generic APIs easier to use because Java generics work with reference types, not primitives. Be careful in performance-sensitive code and with `null` wrapper values, since unboxing `null` causes a `NullPointerException`.

```java
Integer count = 10;      // autoboxing: int -> Integer
int next = count + 1;    // unboxing: Integer -> int

List<Integer> scores = new ArrayList<>();
scores.add(95);          // autoboxing into Integer
```
