---
name: PriorityQueue (Java)
categories:
- data-structures
tags:
- exam-review
- fundamentals
- interview-prep
- java
code_lang: java
---

PriorityQueue is a heap-backed queue that removes elements by priority instead of insertion order. By default, Java uses a min-heap, so the smallest element is removed first.

```java
import java.util.PriorityQueue;

PriorityQueue<Integer> pq = new PriorityQueue<>();
pq.offer(30);
pq.offer(10);
pq.offer(20);
System.out.println(pq.poll()); // 10
```
