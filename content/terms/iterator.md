---
name: Iterator
categories:
- data-structures
tags:
- advanced
- fundamentals
- java
code_lang: java
---

An iterator provides a standard way to traverse elements in a collection without exposing internal representation. Java collections provide iterators for sequential access and safe in-loop removal.

```java
import java.util.Iterator;
import java.util.List;

List<Integer> values = new java.util.ArrayList<>(List.of(1, 2, 3, 4));
Iterator<Integer> it = values.iterator();
while (it.hasNext()) {
    if (it.next() % 2 == 0) it.remove();
}
System.out.println(values); // [1, 3]
```
