---
name: HashSet
categories:
- data-structures
tags:
- exam-review
- fundamentals
- java
code_lang: java
---

HashSet is a hash-table-backed implementation of `Set` that stores unique elements with no guaranteed iteration order. It provides average O(1) add, contains, and remove operations.

```java
import java.util.HashSet;
import java.util.Set;

Set<Integer> seen = new HashSet<>();
seen.add(5);
seen.add(5);
System.out.println(seen.size()); // 1
```
