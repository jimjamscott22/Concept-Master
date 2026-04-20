---
name: Quick Sort
categories:
- algorithms
tags:
- exam-review
- interview-prep
- java
code_lang: python
---

A divide-and-conquer sorting algorithm that selects a pivot and partitions elements around it.

**Time complexity:**
- Average: O(n log n)
- Worst (bad pivot): O(n²)

In-place; poor cache performance for linked lists.

**Java example:**
```java
void quickSort(int[] arr, int low, int high) {
    if (low >= high) return;
    int pivotIndex = partition(arr, low, high);
    quickSort(arr, low, pivotIndex - 1);
    quickSort(arr, pivotIndex + 1, high);
}
```

```python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left  = [x for x in arr if x < pivot]
    mid   = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + mid + quicksort(right)
```
