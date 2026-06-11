---
name: Model-View-Controller
categories:
- design-patterns
- design
- web
tags:
- fundamentals
- interview-prep
- web
related:
- separation-of-concerns
- rest
code_lang: typescript
---

Model-View-Controller, or MVC, is an architectural pattern that separates application state, presentation, and request handling.

The model represents data and business rules, the view renders output, and the controller receives input and coordinates the response. Web frameworks often adapt this idea even when their exact naming differs.

**Benefit:** UI and business logic can evolve with less accidental overlap.

```typescript
type User = { id: number; name: string };

function userView(user: User) {
  return `<h1>${user.name}</h1>`;
}

function userController(id: number, users: Map<number, User>) {
  const user = users.get(id);
  return user ? userView(user) : "Not found";
}
```
