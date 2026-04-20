---
name: REST
categories:
- networking
tags:
- fundamentals
- java
code_lang: python
---

Representational State Transfer — an architectural style for distributed hypermedia systems. Key constraints: stateless, client-server, cacheable, uniform interface.

**HTTP verbs:** GET (read), POST (create), PUT/PATCH (update), DELETE.

**Java example:**
```java
@GetMapping("/users/{userId}")
public UserResponse getUser(@PathVariable int userId) {
    return new UserResponse(userId, "Alice");
}
```

```python
# FastAPI REST endpoint example
@app.get("/users/{user_id}")
async def get_user(user_id: int):
    return {"id": user_id, "name": "Alice"}
```
