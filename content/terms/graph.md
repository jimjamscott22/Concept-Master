---
name: Graph
categories:
- data-structures
tags:
- fundamentals
- java
code_lang: python
---

A collection of nodes (vertices) connected by edges. Can be directed or undirected, weighted or unweighted.

**Representations:** adjacency list (space-efficient) or adjacency matrix (fast edge lookup).

**Java example:**
```java
Map<String, List<String>> graph = Map.of(
    "A", List.of("B", "C"),
    "B", List.of("A", "D"),
    "C", List.of("A"),
    "D", List.of("B")
);
```

```python
graph = {
    "A": ["B", "C"],
    "B": ["A", "D"],
    "C": ["A"],
    "D": ["B"],
}
```
