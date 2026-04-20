---
name: Java Generics
categories:
- object-oriented
tags:
- advanced
- interview-prep
- java
code_lang: java
---

Generics let classes and methods work with type parameters, giving compile-time type safety and reducing casts. They are essential for reusable data structures like `List<T>` and `Map<K, V>`.

```java
class Box<T> {
    private T value;
    void set(T value) { this.value = value; }
    T get() { return value; }
}

Box<String> box = new Box<>();
box.set("hello");
String text = box.get();
```
