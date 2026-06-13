---
name: Decorator (Python)
categories:
- functional-programming
tags:
- advanced
- interview-prep
- python
related:
- closure
code_lang: python
---

A Python decorator is a function that wraps another function or class to add behavior without changing the original definition. Decorators are commonly used for logging, timing, caching, authorization checks, and framework features.

The `@decorator_name` syntax is shorthand for passing the function into another function and reassigning the result.

```python
def trace(func):
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@trace
def greet(name):
    return f"Hello, {name}"
```
