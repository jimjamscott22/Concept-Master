---
name: ArrayList
categories:
- data-structures
tags:
- exam-review
- fundamentals
- java
code_lang: java
---

ArrayList is a resizable-array implementation of the `List` interface. It offers O(1) random access and amortized O(1) append, while insertions/removals in the middle are O(n).

```java
import java.util.ArrayList;
import java.util.List;

List<String> names = new ArrayList<>();
names.add("Ada");
names.add("Grace");
System.out.println(names.get(1)); // Grace
```
