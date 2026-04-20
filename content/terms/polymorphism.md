---
name: Polymorphism
categories:
- object-oriented
tags:
- java
- python
code_lang: python
---

The ability of different objects to respond to the same interface. Enables writing code that works with objects of multiple types.

**Types:** compile-time (overloading) and runtime (overriding).

**Java example:**
```java
interface Animal {
    String speak();
}

class Dog implements Animal {
    public String speak() { return "Woof"; }
}

class Cat implements Animal {
    public String speak() { return "Meow"; }
}

void makeItSpeak(Animal animal) {
    System.out.println(animal.speak());
}
```

```python
# Duck typing in Python
def make_it_speak(animal):
    print(animal.speak())

make_it_speak(Dog())
make_it_speak(Cat())
```
