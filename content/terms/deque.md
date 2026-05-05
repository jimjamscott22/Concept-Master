---
name: Deque (Double-Ended Queue)
categories:
- data-structures
tags:
- fundamentals
- interview-prep
code_lang: python
---

A deque (pronounced "deck") supports O(1) insertion and deletion at **both** ends. It generalises a queue (FIFO) and a stack (LIFO) into a single structure.

**Operations:**
| Operation | Time |
|---|---|
| `appendleft(x)` / `append(x)` | O(1) |
| `popleft()` / `pop()` | O(1) |
| `peek` front/back | O(1) |
| Random access | O(n) |

**Use cases:** sliding window maximum/minimum, BFS (deque as a queue), palindrome checking, monotonic deque for next-greater-element problems.

**Java:** `ArrayDeque<T>` — preferred over `Stack` and `LinkedList` for both stack and queue use.

```python
from collections import deque

# Sliding window maximum (monotonic deque)
def max_sliding_window(nums: list[int], k: int) -> list[int]:
    dq: deque[int] = deque()   # stores indices, decreasing value order
    result = []
    for i, val in enumerate(nums):
        while dq and nums[dq[-1]] <= val:
            dq.pop()
        dq.append(i)
        if dq[0] == i - k:     # front is out of window
            dq.popleft()
        if i >= k - 1:
            result.append(nums[dq[0]])
    return result
```
