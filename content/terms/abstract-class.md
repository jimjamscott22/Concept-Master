---
name: Abstract Class
categories:
- object-oriented
tags:
- fundamentals
- java
- python
code_lang: python
---

An abstract class is a class that cannot be instantiated directly. It defines a partial implementation and declares one or more **abstract methods** that subclasses *must* override, enforcing a contract while sharing reusable code.

**vs. Interface:**
- Abstract class: can hold state (fields) and concrete methods; single inheritance.
- Interface: purely a contract (Java 8+ allows `default` methods); a class can implement many interfaces.

**Rule of thumb:** use an abstract class when subclasses *are* a type of the parent and share real code; use an interface when you just need a contract across unrelated types.

**Python:** use `abc.ABC` / `@abstractmethod`. **Java:** `abstract class` keyword.

```python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

    @abstractmethod
    def perimeter(self) -> float: ...

    def describe(self) -> str:          # concrete method shared by all shapes
        return f"Area={self.area():.2f}, Perimeter={self.perimeter():.2f}"

class Circle(Shape):
    def __init__(self, r: float): self.r = r
    def area(self) -> float: return 3.14159 * self.r ** 2
    def perimeter(self) -> float: return 2 * 3.14159 * self.r

# Shape()  <- TypeError: Can't instantiate abstract class
print(Circle(5).describe())  # Area=78.54, Perimeter=31.42
```
