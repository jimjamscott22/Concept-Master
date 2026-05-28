---
name: Heap Sort
categories:
- algorithms
tags:
- exam-review
- interview-prep
- java
code_lang: python
---

A comparison-based sort that builds a max-heap from the array, then repeatedly extracts the maximum and places it at the end. In-place but **not stable**.

**Time complexity:** O(n log n) — all cases
**Space:** O(1) auxiliary

Useful when worst-case performance matters (unlike Quick Sort) and constant extra memory is required (unlike Merge Sort).

**Java (in-place max-heap):**
```java
void heapSort(int[] a) {
    int n = a.length;
    for (int i = n / 2 - 1; i >= 0; i--) sift(a, n, i);
    for (int i = n - 1; i > 0; i--) {
        int tmp = a[0]; a[0] = a[i]; a[i] = tmp;
        sift(a, i, 0);
    }
}
```

```python
import heapq

def heap_sort(arr):
    h = [-x for x in arr]
    heapq.heapify(h)
    return [-heapq.heappop(h) for _ in range(len(h))]
```
