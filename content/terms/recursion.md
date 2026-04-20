---
name: Recursion
categories:
- algorithms
tags:
- advanced
- java
code_lang: python
---

A technique where a function calls itself with a smaller input until reaching a base case. Every recursive solution can be converted to an iterative one.

**Watch out for:** stack overflow with deep recursion; Python default limit is 1000.

**Java example:**
```java
int factorial(int n) {
    if (n == 0) return 1;
    return n * factorial(n - 1);
}
```

```python
def factorial(n):
    if n == 0:        # base case
        return 1
    return n * factorial(n - 1)
```
