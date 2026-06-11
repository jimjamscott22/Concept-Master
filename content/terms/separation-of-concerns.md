---
name: Separation of Concerns
categories:
- design
tags:
- fundamentals
- interview-prep
related:
- cohesion
- coupling
code_lang: typescript
---

Separation of concerns is a design principle that splits a system into parts with clearly different responsibilities.

Each part should focus on one kind of decision, such as data access, business rules, rendering, or user input. This makes code easier to test, change, and reason about because unrelated changes are less likely to ripple through the whole program.

**Key idea:** keep responsibilities distinct, then connect them through small, explicit interfaces.

```typescript
type User = { id: number; name: string };

async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

function renderUser(user: User) {
  return `<h1>${user.name}</h1>`;
}
```
