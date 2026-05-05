---
name: Two-Pointer Technique
categories:
- algorithms
tags:
- interview-prep
- fundamentals
code_lang: python
---

A technique that uses two indices (pointers) moving through a data structure—often toward each other or in the same direction—to solve problems in O(n) instead of O(n²).

**Common patterns:**
- **Opposite ends:** start one pointer at index 0, another at n-1, converge until they meet (e.g., two-sum on sorted array, palindrome check).
- **Same direction (sliding window variant):** fast + slow pointers to detect cycles or find subarrays.

**When to reach for it:** the array is sorted (or can be sorted), and you need pairs or subarrays meeting some condition.

```python
def two_sum_sorted(nums: list[int], target: int) -> tuple[int, int]:
    left, right = 0, len(nums) - 1
    while left < right:
        s = nums[left] + nums[right]
        if s == target:
            return (left, right)
        elif s < target:
            left += 1
        else:
            right -= 1
    return (-1, -1)
```
