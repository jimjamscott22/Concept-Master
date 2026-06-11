---
name: KISS Principle
categories:
- design
tags:
- fundamentals
- interview-prep
related:
- yagni
- dry-principle
code_lang: python
---

KISS stands for "Keep It Simple, Stupid." It is a reminder to prefer the simplest design that clearly solves the current problem.

Simple code has fewer moving parts, fewer assumptions, and fewer paths to test. KISS does not mean avoiding structure; it means avoiding structure that is not paying for itself.

**Practical test:** if a direct function communicates the idea clearly, avoid introducing a framework-shaped abstraction.

```python
def is_passing(score: int) -> bool:
    return score >= 70
```
