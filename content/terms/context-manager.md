---
name: Context Manager
categories:
- memory-management
tags:
- fundamentals
- python
- resources
related:
- exception-handling
- garbage-collection
code_lang: python
---

A context manager controls setup and cleanup around a block of code. In Python, the `with` statement calls the context manager's enter logic before the block and its exit logic afterward, even if an exception occurs.

Context managers are especially useful for files, locks, database connections, and temporary resources that must be released reliably.

```python
with open("notes.txt", "w", encoding="utf-8") as file:
    file.write("Remember to close resources safely.")

# The file is closed automatically here.
```
