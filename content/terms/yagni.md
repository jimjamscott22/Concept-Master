---
name: YAGNI
categories:
- design
tags:
- fundamentals
- interview-prep
related:
- kiss-principle
- dry-principle
code_lang: typescript
---

YAGNI stands for "You Aren't Gonna Need It." It warns against building features, abstractions, or configuration before there is a real requirement.

Premature flexibility adds code that must be tested, documented, and maintained. YAGNI encourages small, reversible steps based on current evidence.

**Use it when:** a design is becoming complex mainly to satisfy imagined future cases.

```typescript
function calculateTotal(prices: number[]) {
  return prices.reduce((sum, price) => sum + price, 0);
}
```
