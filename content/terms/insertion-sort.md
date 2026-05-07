---
name: Insertion Sort
categories:
- algorithms
tags:
- exam-review
- interview-prep
code_lang: python
related:
- merge-sort
- quick-sort
---

A simple, **stable**, in-place sort that builds the sorted array one element at a time by inserting each new element into its correct position among the already-sorted elements.

**Time complexity:**
- Best: O(n) — already sorted
- Average / Worst: O(n²)

**Space:** O(1)

Excellent for small or nearly-sorted inputs; commonly used as the base case inside hybrid sorts like Timsort and introsort.

```python
def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr
```
