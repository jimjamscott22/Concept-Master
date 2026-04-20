---
name: Strategy Pattern
categories:
- design-patterns
tags:
- advanced
- interview-prep
- java
- python
code_lang: python
---

A behavioral design pattern that defines a family of interchangeable algorithms, encapsulates each one, and makes them swappable at runtime. The client delegates work to a strategy object rather than implementing the logic itself.

**Use cases:** sorting algorithms, payment methods, compression formats, validation rules.

**Java example:**
```java
interface SortStrategy {
    void sort(int[] data);
}

class BubbleSort implements SortStrategy {
    public void sort(int[] data) { /* bubble sort */ }
}

class QuickSort implements SortStrategy {
    public void sort(int[] data) { /* quick sort */ }
}

class Sorter {
    private SortStrategy strategy;
    Sorter(SortStrategy strategy) { this.strategy = strategy; }
    void execute(int[] data) { strategy.sort(data); }
}
```

```python
from typing import Callable

def bubble_sort(data: list[int]) -> list[int]:
    items = data[:]
    for i in range(len(items)):
        for j in range(len(items) - 1 - i):
            if items[j] > items[j + 1]:
                items[j], items[j + 1] = items[j + 1], items[j]
    return items

def quick_sort(data: list[int]) -> list[int]:
    if len(data) <= 1:
        return data
    pivot = data[len(data) // 2]
    left  = [x for x in data if x < pivot]
    mid   = [x for x in data if x == pivot]
    right = [x for x in data if x > pivot]
    return quick_sort(left) + mid + quick_sort(right)

class Sorter:
    def __init__(self, strategy: Callable):
        self.strategy = strategy

    def execute(self, data: list[int]) -> list[int]:
        return self.strategy(data)

sorter = Sorter(quick_sort)
print(sorter.execute([5, 3, 8, 1]))  # [1, 3, 5, 8]
```
