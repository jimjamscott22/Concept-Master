---
name: Object
categories:
- object-oriented
tags:
- java
- python
code_lang: python
---

An instance of a class, encapsulating state (attributes) and behavior (methods). Objects are the core building blocks of object-oriented programming.

**Java example:**
```java
class Dog {
    String name;
    Dog(String name) { this.name = name; }
    String bark() { return name + " says woof!"; }
}

Dog fido = new Dog("Fido");
System.out.println(fido.bark());
```

```python
class Dog:
    def __init__(self, name):
        self.name = name

    def bark(self):
        return f"{self.name} says woof!"

fido = Dog("Fido")
print(fido.bark())
```
