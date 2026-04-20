---
name: Big O Notation
categories:
- algorithms
tags:
- interview-prep
- java
code_lang: python
---

A mathematical notation describing the upper bound of an algorithm's time or space complexity as input size n grows.

**Common complexities:**
- O(1) constant
- O(log n) logarithmic
- O(n) linear
- O(n log n) linearithmic
- O(n²) quadratic
- O(2ⁿ) exponential

**Java example:**
```java
for (int i = 0; i < n; i++) {
    for (int j = 0; j < n; j++) {
        System.out.println(i + "," + j);
    }
}
```

```python
# O(n²) example
for i in range(n):
    for j in range(n):
        print(i, j)
```
