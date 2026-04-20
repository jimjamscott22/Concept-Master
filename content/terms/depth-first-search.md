---
name: Depth-First Search
categories:
- algorithms
tags:
- exam-review
- interview-prep
- java
code_lang: python
---

A graph traversal algorithm that explores as far as possible along each branch before backtracking. Uses a stack (implicit via recursion or explicit).

**Use cases:** topological sort, cycle detection, maze solving.

**Java example:**
```java
void dfs(Map<String, List<String>> graph, String node, Set<String> visited) {
    visited.add(node);
    for (String neighbor : graph.getOrDefault(node, List.of())) {
        if (!visited.contains(neighbor)) {
            dfs(graph, neighbor, visited);
        }
    }
}
```

```python
def dfs(graph, node, visited=None):
    if visited is None:
        visited = set()
    visited.add(node)
    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs(graph, neighbor, visited)
    return visited
```
