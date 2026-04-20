---
name: Memory Leak
categories:
- memory-management
tags:
- advanced
- java
- python
- systems
code_lang: python
---

A memory leak happens when a program keeps references to memory it no longer needs, preventing that memory from being reclaimed.

Leaks often come from long-lived caches, event listeners that are never removed, or accidental retention of large objects.

**Java example:**
```java
List<byte[]> cache = new ArrayList<>();

void handleRequest(byte[] payload) {
    cache.add(payload); // grows forever if never cleared
}
```

```python
cache = []

def handle_request(payload):
    cache.append(payload)  # grows forever if never cleared
```
