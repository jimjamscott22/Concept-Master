---
name: Asynchronous Programming
categories:
- concurrency
tags:
- fundamentals
- javascript
- python
related:
- thread-pool
code_lang: python
---

Asynchronous programming lets a program start work that may take time, then continue running instead of blocking until that work finishes.

It is useful for I/O-heavy tasks such as network calls, database queries, file reads, and timers.

**Core idea:** async code improves responsiveness when work spends time waiting, but it still needs clear error handling and ordering.

```python
import asyncio

async def fetch_user(user_id):
    await asyncio.sleep(0.1)
    return {"id": user_id, "name": "Ada"}

async def main():
    user = await fetch_user(1)
    print(user["name"])

asyncio.run(main())
```
