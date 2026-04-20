---
name: Queue
categories:
- data-structures
tags:
- fundamentals
- java
code_lang: python
---

A FIFO (First In, First Out) data structure. Elements are enqueued at the back and dequeued from the front.

**Use cases:** BFS, task scheduling, print queues.

**Java example:**
```java
Queue<Integer> queue = new ArrayDeque<>();
queue.offer(1);
queue.offer(2);
int front = queue.poll(); // => 1
```

```python
from collections import deque
q = deque()
q.append(1)   # enqueue
q.append(2)
front = q.popleft()  # => 1
```
