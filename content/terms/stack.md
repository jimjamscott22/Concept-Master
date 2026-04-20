---
name: Stack
categories:
- data-structures
tags:
- fundamentals
- java
code_lang: python
---

A LIFO (Last In, First Out) data structure. Elements are pushed onto the top and popped from the top.

**Use cases:** function call stack, undo/redo, expression evaluation.

**Java example:**
```java
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1);
stack.push(2);
int top = stack.pop(); // => 2
```

```python
stack = []
stack.append(1)  # push
stack.append(2)
top = stack.pop()  # => 2
```
