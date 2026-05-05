---
name: Builder Pattern
categories:
- design-patterns
tags:
- creational
- interview-prep
code_lang: python
---

The Builder pattern separates the construction of a complex object from its representation, letting the same construction process produce different results. It is especially useful when an object has many optional parameters (replacing telescoping constructors).

**Participants:**
- **Builder:** fluent interface for setting parts; returns `self` for chaining.
- **Director (optional):** orchestrates a fixed build sequence.
- **Product:** the complex object being assembled.

**vs. Factory:** Factory returns a fully-formed object in one call; Builder constructs it step by step.

```python
from dataclasses import dataclass, field

@dataclass
class Query:
    table: str = ""
    conditions: list[str] = field(default_factory=list)
    limit: int | None = None
    offset: int | None = None

class QueryBuilder:
    def __init__(self): self._q = Query()

    def from_table(self, table: str) -> "QueryBuilder":
        self._q.table = table; return self

    def where(self, condition: str) -> "QueryBuilder":
        self._q.conditions.append(condition); return self

    def limit(self, n: int) -> "QueryBuilder":
        self._q.limit = n; return self

    def offset(self, n: int) -> "QueryBuilder":
        self._q.offset = n; return self

    def build(self) -> Query:
        return self._q

q = (QueryBuilder()
     .from_table("terms")
     .where("is_favorite = 1")
     .limit(10)
     .offset(0)
     .build())
```
