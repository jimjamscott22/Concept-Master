---
name: Comparable vs Comparator
categories:
- algorithms
tags:
- advanced
- interview-prep
- java
code_lang: java
---

`Comparable` defines an object's natural ordering, while `Comparator` defines external/custom ordering strategies. These interfaces are central to sorting and ordered data structures in Java.

```java
import java.util.*;

record Student(String name, int grade) {}

List<Student> students = new ArrayList<>(List.of(
    new Student("Ava", 88),
    new Student("Ben", 95)
));

students.sort(Comparator.comparingInt(Student::grade).reversed());
```
