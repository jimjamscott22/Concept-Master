---
name: Pure Function
categories:
- functional-programming
tags:
- fundamentals
- interview-prep
- java
- python
code_lang: python
---

A function that always returns the same output for the same inputs and produces no side effects — no mutation, no I/O, no global state changes. Pure functions are easier to reason about, test, and parallelize because they depend only on their arguments and guarantee no hidden interactions.

**Key properties:** deterministic output, no side effects, referential transparency.

**Java example:**
```java
// Pure — depends only on input, no side effects
static int add(int a, int b) {
    return a + b;
}

// Impure — mutates external state
static int counter = 0;
static int addAndCount(int a, int b) {
    counter++;          // side effect
    return a + b;
}
```

```python
# Pure function — same input always gives same output
def add(a, b):
    return a + b

# Impure — relies on and mutates external state
total = 0

def add_to_total(x):
    global total
    total += x      # side effect: mutates global
    return total

print(add(2, 3))        # always 5
print(add_to_total(5))  # 5  (depends on previous calls)
print(add_to_total(5))  # 10 (different result, same input)
```
