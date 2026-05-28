---
name: Kadane's Algorithm
categories:
- algorithms
tags:
- dynamic-programming
- interview-prep
related:
- dynamic-programming
- sliding-window
code_lang: python
---

A linear-time dynamic programming algorithm for the **maximum subarray sum** problem. At each index, decide whether to extend the current subarray or start a new one beginning at the current element.

**Time complexity:** O(n)
**Space:** O(1)

The recurrence is `best_ending_here = max(x, best_ending_here + x)`.

Example: `[-2, 1, -3, 4, -1, 2, 1, -5, 4]` → `6` (subarray `[4, -1, 2, 1]`).

```python
def max_subarray(nums):
    best = current = nums[0]
    for x in nums[1:]:
        current = max(x, current + x)
        best = max(best, current)
    return best
```
