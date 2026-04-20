---
name: Inheritance
categories:
- object-oriented
tags:
- java
- python
code_lang: python
---

A mechanism allowing a class (subclass) to inherit attributes and methods from another class (superclass). Supports code reuse and the **is-a** relationship.

**Java example:**
```java
class Animal {
    String speak() { return "..."; }
}

class Cat extends Animal {
    @Override String speak() { return "Meow"; }
}

class Dog extends Animal {
    @Override String speak() { return "Woof"; }
}
```

```python
class Animal:
    def speak(self): return "..."

class Cat(Animal):
    def speak(self): return "Meow"

class Dog(Animal):
    def speak(self): return "Woof"

animals = [Cat(), Dog()]
for a in animals:
    print(a.speak())
```
