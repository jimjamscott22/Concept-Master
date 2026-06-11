---
name: Cohesion
categories:
- design
- object-oriented
tags:
- fundamentals
- interview-prep
related:
- separation-of-concerns
- coupling
code_lang: java
---

Cohesion describes how closely the responsibilities inside a module, class, or function belong together.

High cohesion means a unit has a clear purpose and its parts support that purpose. Low cohesion often appears when unrelated behavior is grouped together just because it was convenient at the time.

**Rule of thumb:** a highly cohesive class is easy to name without using words like "and" or "manager."

```java
class PasswordHasher {
    String hash(String password) {
        return Integer.toHexString(password.hashCode());
    }

    boolean matches(String password, String expectedHash) {
        return hash(password).equals(expectedHash);
    }
}
```
