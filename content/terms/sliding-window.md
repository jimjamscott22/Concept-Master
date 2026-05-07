---
name: Sliding Window
categories:
- algorithms
tags:
- interview-prep
- patterns
code_lang: python
related:
- two-pointer
- kadane-algorithm
---

An algorithmic pattern that maintains a contiguous range `[left, right]` over a sequence and advances the boundaries to answer subarray/substring questions in O(n) instead of O(n²).

Two common flavors:

- **Fixed-size window** — maintain a window of length `k`; slide one step at a time, updating the running aggregate.
- **Variable-size window** — expand `right` to include new elements; shrink `left` while the window violates a constraint.

**Example — longest substring with at most K distinct characters:**

```python
def longest_k_distinct(s, k):
    counts = {}
    left = best = 0
    for right, ch in enumerate(s):
        counts[ch] = counts.get(ch, 0) + 1
        while len(counts) > k:
            counts[s[left]] -= 1
            if counts[s[left]] == 0:
                del counts[s[left]]
            left += 1
        best = max(best, right - left + 1)
    return best
```
