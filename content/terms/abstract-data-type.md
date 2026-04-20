---
name: Abstract Data Type (ADT)
categories:
- data-structures
tags:
- exam-review
- fundamentals
- java
code_lang: java
---

An abstract data type defines a data model and the operations allowed on it, without specifying implementation details. In Java, interfaces are often used to model ADTs while classes provide concrete implementations.

Example ADTs include List, Stack, Queue, Set, and Map.

```java
import java.util.ArrayList;
import java.util.List;

List<Integer> numbers = new ArrayList<>();
numbers.add(10);
numbers.add(20);
System.out.println(numbers.get(0));
```
