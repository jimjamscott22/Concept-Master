---
name: Higher-Order Function
categories:
- functional-programming
tags:
- advanced
- java
- python
code_lang: python
---

A function that takes one or more functions as arguments, or returns a function. Core to functional programming.

**Examples:** map, filter, reduce, sorted with key.

**Java example:**
```java
List<Integer> numbers = List.of(1, -2, 3, -4, 5);
List<Integer> positives = numbers.stream().filter(x -> x > 0).toList();
List<Integer> squared = numbers.stream().map(x -> x * x).toList();
List<Integer> sortedByAbs = numbers.stream()
    .sorted(Comparator.comparingInt(Math::abs))
    .toList();
```

```python
numbers = [1, -2, 3, -4, 5]
positives = list(filter(lambda x: x > 0, numbers))
squared   = list(map(lambda x: x**2, numbers))
sorted_abs = sorted(numbers, key=abs)
```
