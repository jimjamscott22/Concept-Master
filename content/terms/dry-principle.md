---
name: DRY Principle
categories:
- design
tags:
- fundamentals
- interview-prep
related:
- separation-of-concerns
- cohesion
code_lang: python
---

DRY stands for "Don't Repeat Yourself." It means each important piece of knowledge should have one authoritative representation in a system.

DRY is about avoiding duplicated rules, not eliminating every repeated line of code. Sometimes similar-looking code should remain separate if the underlying ideas change for different reasons.

**Good DRY:** extract repeated business rules after the duplication reveals a stable concept.

```python
def format_currency(cents: int) -> str:
    return f"${cents / 100:.2f}"

invoice_total = format_currency(2599)
cart_total = format_currency(2599)
```
