---
name: Currying
categories:
- functional-programming
tags:
- fundamentals
- haskell
code_lang: python
---

Currying transforms a function that takes multiple arguments into a chain of functions each taking one argument. Named after mathematician Haskell Curry.

`f(a, b, c)` → `f(a)(b)(c)`

**Benefits:**
- **Partial application:** fix some arguments to create specialised functions.
- **Point-free style:** compose curried functions without naming intermediate arguments.
- **Reuse:** derive many specific functions from one general one.

**Note:** currying and partial application are related but distinct. Partial application fixes *k* of *n* arguments; currying turns an *n*-ary function into *n* unary functions.

```python
from functools import partial

# Manual currying
def add(a):
    def inner(b):
        return a + b
    return inner

add5 = add(5)
print(add5(3))   # 8
print(add5(10))  # 15

# Using functools.partial (partial application)
def power(base, exp):
    return base ** exp

square = partial(power, exp=2)
cube   = partial(power, exp=3)
print(square(4))  # 16
print(cube(3))    # 27
```
