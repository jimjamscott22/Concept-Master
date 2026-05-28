---
name: Immutability
categories:
- functional-programming
tags:
- concurrency
- fundamentals
code_lang: python
---

An immutable value cannot be changed after creation. Instead of mutating, you produce a new value with the desired change. This is a cornerstone of functional programming and enables safe sharing without locks in concurrent code.

**Benefits:**
- **Thread safety:** immutable objects need no synchronisation.
- **Referential transparency:** the same value always means the same thing.
- **Easier reasoning:** no hidden state changes.
- **Undo/history:** old versions naturally persist (persistent data structures).

**In Python:** strings, tuples, `frozenset`, and `int`/`float` are immutable. Use `@dataclass(frozen=True)` or `NamedTuple` for immutable records.

**In Java:** `String`, `Integer`, and records (`record`) are immutable; use `Collections.unmodifiableList`.

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Point:
    x: float
    y: float

    def translate(self, dx: float, dy: float) -> "Point":
        return Point(self.x + dx, self.y + dy)  # new object, original untouched

p1 = Point(1.0, 2.0)
p2 = p1.translate(3.0, 4.0)
print(p1)  # Point(x=1.0, y=2.0)  — unchanged
print(p2)  # Point(x=4.0, y=6.0)
```
