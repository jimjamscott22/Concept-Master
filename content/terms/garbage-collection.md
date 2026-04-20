---
name: Garbage Collection
categories:
- memory-management
tags:
- java
- python
code_lang: python
---

Automatic memory management that reclaims memory occupied by objects no longer referenced. Python uses reference counting + a cyclic GC for circular references.

**Trade-off:** convenience vs. occasional GC pauses.

**Java example:**
```java
class Node { Node ref; }
Node a = new Node();
Node b = new Node();
a.ref = b;
b.ref = a;
a = null;
b = null;
System.gc();
```

```python
import gc

class Node:
    def __init__(self): self.ref = None

a = Node()
b = Node()
a.ref = b  # circular reference
b.ref = a
del a, b
gc.collect()  # reclaim the cycle
```
