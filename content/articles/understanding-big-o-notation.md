---
title: Understanding Big-O Notation
subtitle: A practical guide to reasoning about algorithmic complexity
is_published: true
categories: [algorithms]
tags: [fundamentals, interview-prep]
related_terms: [big-o-notation, time-complexity, binary-search, quick-sort]
related_articles: [choosing-the-right-data-structure]
---

Big-O notation is the language we use to talk about how an algorithm's cost grows
as its input grows. It deliberately ignores constants and lower-order terms so we
can compare approaches without getting lost in machine-specific details.

## Why constants don't matter (much)

If one algorithm runs in `100n` steps and another in `2n²`, the linear one wins
for any sufficiently large `n` — no matter how big that constant `100` is. Big-O
captures this *asymptotic* behavior: what happens as the input heads toward
infinity.

## The complexity classes you'll actually see

| Notation     | Name         | Example                          |
| ------------ | ------------ | -------------------------------- |
| `O(1)`       | Constant     | Hash map lookup                  |
| `O(log n)`   | Logarithmic  | Binary search                    |
| `O(n)`       | Linear       | Scanning an array                |
| `O(n log n)` | Linearithmic | Merge sort, quick sort (average) |
| `O(n²)`      | Quadratic    | Naive nested-loop comparisons    |
| `O(2ⁿ)`      | Exponential  | Brute-force subset enumeration   |

## Reading complexity from code

A single loop over the input is linear. A loop nested inside another loop over the
same input is quadratic:

```python
def has_duplicate(nums):
    for i in range(len(nums)):          # O(n)
        for j in range(i + 1, len(nums)):  # O(n)
            if nums[i] == nums[j]:
                return True
    return False
# Overall: O(n²)
```

Swapping that for a set turns it into a single linear pass:

```python
def has_duplicate(nums):
    seen = set()
    for n in nums:        # O(n)
        if n in seen:     # O(1) average
            return True
        seen.add(n)
    return False
# Overall: O(n)
```

## Best, average, and worst case

Big-O usually describes the **worst case**, but average case matters in practice.
Quick sort is `O(n log n)` on average yet `O(n²)` in the worst case — which is why
real-world implementations randomize the pivot to make that worst case
astronomically unlikely.

The takeaway: pick the right complexity class for your input sizes, and don't
sweat the constants until profiling tells you to.
