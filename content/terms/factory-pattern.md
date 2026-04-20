---
name: Factory Pattern
categories:
- design-patterns
tags:
- interview-prep
- java
- python
code_lang: python
---

A creational design pattern that provides an interface for creating objects without specifying their exact class. A factory method or class encapsulates the instantiation logic, letting subclasses or configuration determine which concrete type to create.

**Use cases:** creating objects from a shared interface, plugin systems, decoupling client code from concrete classes.

**Java example:**
```java
interface Shape {
    void draw();
}

class Circle implements Shape {
    public void draw() { System.out.println("Circle"); }
}

class Square implements Shape {
    public void draw() { System.out.println("Square"); }
}

class ShapeFactory {
    static Shape create(String type) {
        return switch (type) {
            case "circle" -> new Circle();
            case "square" -> new Square();
            default -> throw new IllegalArgumentException(type);
        };
    }
}
```

```python
class Dog:
    def speak(self): return "Woof"

class Cat:
    def speak(self): return "Meow"

def animal_factory(kind):
    animals = {"dog": Dog, "cat": Cat}
    cls = animals.get(kind)
    if cls is None:
        raise ValueError(f"Unknown animal: {kind}")
    return cls()

pet = animal_factory("dog")
print(pet.speak())  # Woof
```
