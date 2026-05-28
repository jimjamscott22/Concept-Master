---
name: Dijkstra's Algorithm
categories:
- algorithms
tags:
- exam-review
- graphs
- interview-prep
related:
- breadth-first-search
code_lang: python
---

A greedy single-source shortest-path algorithm for **non-negative** edge weights. Maintains a priority queue of vertices keyed by their tentative distance, repeatedly extracting the closest unvisited vertex and relaxing its outgoing edges.

**Time complexity:** O((V + E) log V) with a binary heap
**Does not work** with negative edges — use Bellman-Ford instead.

```python
import heapq

def dijkstra(graph, source):
    dist = {v: float('inf') for v in graph}
    dist[source] = 0
    pq = [(0, source)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for v, w in graph[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(pq, (nd, v))
    return dist
```
