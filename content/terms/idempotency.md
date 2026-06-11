---
name: Idempotency
categories:
- design
- web
- networking
tags:
- fundamentals
- interview-prep
- api
related:
- rest
- http
code_lang: javascript
---

Idempotency means performing the same operation multiple times has the same effect as performing it once.

In web APIs, idempotency matters because clients may retry requests after timeouts or network failures. Safe retries are easier when the server can recognize duplicate operations or when the operation naturally overwrites the same state.

**Example:** setting a user's email to a specific value is idempotent; incrementing a counter is not.

```javascript
await fetch("/api/profile/email", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "dev@example.com" }),
});
```
