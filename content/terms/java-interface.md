---
name: Java Interface
categories:
- object-oriented
tags:
- exam-review
- fundamentals
- java
code_lang: java
---

An interface defines a contract of methods that implementing classes must provide. It enables abstraction and polymorphism, which are core ideas behind modeling ADTs in Java.

Collections like `List`, `Set`, and `Map` are defined as interfaces.

```java
interface Stack<T> {
    void push(T value);
    T pop();
    boolean isEmpty();
}

class IntStack implements Stack<Integer> {
    private final java.util.Deque<Integer> data = new java.util.ArrayDeque<>();
    public void push(Integer value) { data.push(value); }
    public Integer pop() { return data.pop(); }
    public boolean isEmpty() { return data.isEmpty(); }
}
```
