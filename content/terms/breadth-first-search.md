---
name: Breadth-First Search
categories:
- algorithms
tags:
- exam-review
- interview-prep
- java
code_lang: python
---

A graph traversal algorithm that explores all neighbors at the current depth before moving deeper. Uses a queue.

**Use cases:** shortest path in unweighted graphs, level-order traversal.

**Java example:**
```java
Set<String> bfs(Map<String, List<String>> graph, String start) {
    Set<String> visited = new HashSet<>();
    Queue<String> queue = new ArrayDeque<>();
    visited.add(start);
    queue.offer(start);
    while (!queue.isEmpty()) {
        String node = queue.poll();
        for (String neighbor : graph.getOrDefault(node, List.of())) {
            if (visited.add(neighbor)) queue.offer(neighbor);
        }
    }
    return visited;
}
```

```python
from collections import deque

def bfs(graph, start):
    visited = {start}
    queue = deque([start])
    while queue:
        node = queue.popleft()
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    return visited
```
