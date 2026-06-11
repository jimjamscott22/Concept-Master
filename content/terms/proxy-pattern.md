---
name: Proxy Pattern
categories:
- design-patterns
- cybersecurity
tags:
- advanced
- interview-prep
related:
- authorization
- decorator-python
code_lang: python
---

The proxy pattern places an object in front of another object to control access to it.

A proxy can add lazy loading, caching, authorization checks, logging, rate limiting, or remote communication while preserving the same basic interface as the real object.

**Security example:** check permissions before forwarding a call to the protected service.

```python
class DocumentProxy:
    def __init__(self, user, document_service):
        self.user = user
        self.document_service = document_service

    def read(self, document_id: int) -> str:
        if "reader" not in self.user.roles:
            raise PermissionError("Not allowed")
        return self.document_service.read(document_id)
```
