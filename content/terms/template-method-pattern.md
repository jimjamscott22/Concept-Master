---
name: Template Method Pattern
categories:
- design-patterns
- object-oriented
tags:
- advanced
- interview-prep
- java
related:
- inheritance
- abstract-class
code_lang: java
---

The template method pattern defines the skeleton of an algorithm in a base class while letting subclasses customize specific steps.

It is useful when workflows share the same overall order but vary in details. The tradeoff is that inheritance can make behavior harder to follow if the hierarchy grows too deep.

**Key idea:** keep the algorithm order fixed, override selected steps.

```java
abstract class DataImporter {
    final void importData() {
        String raw = read();
        Object parsed = parse(raw);
        save(parsed);
    }

    abstract String read();
    abstract Object parse(String raw);

    void save(Object parsed) {
        System.out.println("Saved " + parsed);
    }
}
```
