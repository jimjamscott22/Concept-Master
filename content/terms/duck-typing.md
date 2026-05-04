---
name: Duck Typing
categories:
- object-oriented
tags:
- fundamentals
- python
- interview-prep
related:
- polymorphism
- java-interface
code_lang: python
---

Duck typing is a style of dynamic typing where an object's behavior matters more than its declared type. If an object has the methods or attributes a piece of code expects, it can be used there.

The name comes from the phrase "if it walks like a duck and quacks like a duck, it is a duck." Python commonly uses duck typing, while Java more often expresses the same idea through interfaces.

```python
class Dog:
    def speak(self):
        return "woof"

class Robot:
    def speak(self):
        return "beep"

def announce(entity):
    print(entity.speak())

announce(Dog())
announce(Robot())
```
