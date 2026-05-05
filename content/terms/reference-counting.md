---
name: Reference Counting
categories:
- memory-management
tags:
- fundamentals
- python
code_lang: python
---

Reference counting tracks how many references point to a heap object. When the count drops to zero, the object is immediately freed.

**Advantages:**
- Objects are freed the instant they become unreachable — no pause for GC cycles.
- Simple to implement; predictable memory footprint.

**Disadvantages:**
- **Cannot collect cycles:** if A → B → A, both counts stay at 1 even though neither is reachable. Requires a separate cycle detector (Python's `gc` module uses one).
- Counter updates on every assignment add overhead.

**Python's implementation:** CPython uses reference counting as its primary mechanism (`sys.getrefcount`), supplemented by a cycle-detecting GC for cyclic garbage.

```python
import sys
import gc

a = []
print(sys.getrefcount(a))  # 2 (one for `a`, one for getrefcount arg)

b = a
print(sys.getrefcount(a))  # 3

del b
print(sys.getrefcount(a))  # 2

# Cycle example — only the cycle detector can clean this up
x = []
y = [x]
x.append(y)  # x → y → x: a reference cycle
del x, y
gc.collect()  # force cycle GC
```
