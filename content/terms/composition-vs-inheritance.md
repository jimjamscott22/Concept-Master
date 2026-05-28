---
name: Composition vs Inheritance
categories:
- object-oriented
tags:
- design
- fundamentals
- interview-prep
code_lang: python
---

**Inheritance** ("is-a"): a subclass extends a parent, reusing and overriding its behaviour. Creates a tight coupling — changes to the parent ripple down.

**Composition** ("has-a"): an object holds references to other objects and delegates behaviour to them. More flexible and easier to test because dependencies can be swapped.

**"Favour composition over inheritance"** (GoF, Effective Java) — reach for inheritance only when a true is-a relationship exists and you actively need polymorphism via the base type.

**Inheritance smell:** you find yourself overriding methods just to disable or no-op them → the hierarchy is wrong.

```python
# Inheritance approach — fragile if FlyingDog needs to not swim
class Animal:
    def breathe(self): print("breathing")

class Dog(Animal):
    def fetch(self): print("fetching")

# Composition approach — mix behaviours freely
class Fetcher:
    def fetch(self): print("fetching")

class Swimmer:
    def swim(self): print("swimming")

class LabradorRetriever:
    def __init__(self):
        self.fetcher = Fetcher()
        self.swimmer = Swimmer()

    def fetch(self): self.fetcher.fetch()
    def swim(self):  self.swimmer.swim()

lab = LabradorRetriever()
lab.fetch()  # fetching
lab.swim()   # swimming
```
