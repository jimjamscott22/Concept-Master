---
name: Authorization
categories:
- cybersecurity
- web
tags:
- fundamentals
- java
- python
code_lang: python
---

Authorization determines what an authenticated user is allowed to do. It answers the question, "Now that we know who you are, what can you access?"

Examples include role-based access control, ownership checks, and permission scopes.

**Java example:**
```java
boolean canEditTerm(User user, Term term) {
    return user.isAdmin() || term.ownerId() == user.id();
}
```

```python
def can_edit_term(user, term):
    return user.is_admin or term.owner_id == user.id
```
