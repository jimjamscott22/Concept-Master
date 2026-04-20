---
name: Merge Sort
categories:
- algorithms
tags:
- exam-review
- interview-prep
- java
code_lang: python
---

A stable divide-and-conquer sorting algorithm. Recursively splits the array in half, sorts each half, then merges.

**Time complexity:** O(n log n) — all cases
**Space:** O(n)

**Java example:**
```java
void mergeSort(int[] arr, int left, int right) {
    if (left >= right) return;
    int mid = (left + right) / 2;
    mergeSort(arr, left, mid);
    mergeSort(arr, mid + 1, right);
    merge(arr, left, mid, right);
}
```

```python
def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left  = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)
```
