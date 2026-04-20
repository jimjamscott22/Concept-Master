---
name: Singleton
categories:
- design-patterns
tags:
- java
code_lang: python
---

A creational design pattern ensuring a class has only one instance with a global access point.

**Use cases:** database connections, logging, configuration.

**Java example:**
```java
public final class Singleton {
    private static final Singleton INSTANCE = new Singleton();
    private Singleton() {}
    public static Singleton getInstance() {
        return INSTANCE;
    }
}
```

```python
class Singleton:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

a = Singleton()
b = Singleton()
print(a is b)  # True
```
