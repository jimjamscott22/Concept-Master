---
name: Java Virtual Machine
categories:
- memory-management
- object-oriented
tags:
- fundamentals
- java
- systems
related:
- garbage-collection
- stack-vs-heap-memory
code_lang: java
---

The Java Virtual Machine, or JVM, is the runtime that executes Java bytecode. Java source code is compiled into `.class` files, and the JVM loads those classes, verifies them, manages memory, and runs the program on a specific operating system and CPU.

This is why Java is often described as "write once, run anywhere": the same bytecode can run on any machine with a compatible JVM.

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Runs on the JVM");
    }
}
```
