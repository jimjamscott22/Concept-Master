---
name: Heap
categories:
- data-structures
tags:
- fundamentals
- java
code_lang: python
---

A complete binary tree satisfying the heap property. In a **min-heap**, each parent is ≤ its children; in a **max-heap**, each parent is ≥ its children.

Used to implement priority queues.

**Java example:**
```java
PriorityQueue<Integer> pq = new PriorityQueue<>(); // min-heap
pq.offer(3);
pq.offer(1);
System.out.println(pq.poll()); // => 1
```

```python
import heapq
pq = []
heapq.heappush(pq, 3)
heapq.heappush(pq, 1)
print(heapq.heappop(pq))  # => 1
```
