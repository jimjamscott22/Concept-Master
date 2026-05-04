---
name: List Comprehension
categories:
- functional-programming
tags:
- fundamentals
- python
- exam-review
related:
- map-filter-reduce
- higher-order-function
code_lang: python
---

A list comprehension is Python syntax for building a new list from an iterable in a single expression. It usually combines mapping and optional filtering while staying readable for simple transformations.

Prefer a normal `for` loop when the logic becomes multi-step or hard to scan.

```python
numbers = [1, 2, 3, 4, 5, 6]

squares_of_evens = [n * n for n in numbers if n % 2 == 0]

print(squares_of_evens)  # [4, 16, 36]
```
