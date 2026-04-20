---
name: Dynamic Programming
categories:
- algorithms
tags:
- advanced
- interview-prep
- java
code_lang: python
---

An optimization technique that solves complex problems by breaking them into overlapping subproblems and caching results (memoization or tabulation).

**Key insight:** optimal substructure + overlapping subproblems.

**Java example:**
```java
Map<Integer, Integer> memo = new HashMap<>();
int fib(int n) {
    if (n <= 1) return n;
    if (memo.containsKey(n)) return memo.get(n);
    int value = fib(n - 1) + fib(n - 2);
    memo.put(n, value);
    return value;
}
```

```python
# Fibonacci with memoization
from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):
    if n <= 1:
        return n
    return fib(n-1) + fib(n-2)
```
