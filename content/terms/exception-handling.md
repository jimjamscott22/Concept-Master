---
name: Exception Handling
categories:
- object-oriented
tags:
- fundamentals
- java
- python
- debugging
related:
- memory-leak
- race-condition
code_lang: python
---

Exception handling is the practice of detecting and responding to runtime errors without immediately crashing the program. Code that might fail is placed in a protected block, and specific handlers decide how to recover, report the error, or clean up resources.

Java uses `try`, `catch`, and `finally`, and distinguishes checked exceptions from unchecked exceptions. Python uses `try`, `except`, `else`, and `finally`.

```python
try:
    value = int(input("Enter a number: "))
except ValueError:
    print("That was not a valid integer.")
else:
    print(f"Double is {value * 2}")
finally:
    print("Done checking input.")
```
