---
name: TreeMap
categories:
- data-structures
tags:
- fundamentals
- interview-prep
- java
code_lang: java
---

TreeMap is a red-black tree implementation of `Map` that keeps keys sorted. Typical operations (`get`, `put`, `remove`) are O(log n), making it useful when ordered key traversal is required.

```java
import java.util.Map;
import java.util.TreeMap;

Map<String, Integer> scores = new TreeMap<>();
scores.put("bob", 80);
scores.put("alice", 95);
System.out.println(scores.keySet()); // [alice, bob]
```
