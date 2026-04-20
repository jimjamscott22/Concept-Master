---
name: Observer Pattern
categories:
- design-patterns
tags:
- java
code_lang: python
---

A behavioral design pattern where an object (subject) maintains a list of dependents (observers) and notifies them of state changes.

**Use cases:** event systems, MVC (Model notifies View).

**Java example:**
```java
class EventEmitter {
    private final Map<String, List<Consumer<String>>> listeners = new HashMap<>();

    void on(String event, Consumer<String> fn) {
        listeners.computeIfAbsent(event, k -> new ArrayList<>()).add(fn);
    }

    void emit(String event, String payload) {
        for (Consumer<String> fn : listeners.getOrDefault(event, List.of())) {
            fn.accept(payload);
        }
    }
}
```

```python
class EventEmitter:
    def __init__(self):
        self._listeners = {}

    def on(self, event, fn):
        self._listeners.setdefault(event, []).append(fn)

    def emit(self, event, *args):
        for fn in self._listeners.get(event, []):
            fn(*args)
```
