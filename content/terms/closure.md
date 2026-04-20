---
name: Closure
categories:
- functional-programming
tags:
- advanced
- java
- python
code_lang: python
---

A function that captures variables from its enclosing scope, even after the outer function has returned. Enables data hiding and partial application.

**Java example:**
```java
int start = 0;
AtomicInteger counter = new AtomicInteger(start);
Supplier<Integer> increment = () -> counter.incrementAndGet();
System.out.println(increment.get()); // 1
System.out.println(increment.get()); // 2
```

```python
def make_counter(start=0):
    count = [start]  # mutable container
    def increment():
        count[0] += 1
        return count[0]
    return increment

counter = make_counter()
print(counter())  # 1
print(counter())  # 2
```
