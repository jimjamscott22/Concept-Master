---
name: Thread
categories:
- concurrency
tags:
- java
- systems
code_lang: python
---

The smallest unit of execution within a process. Multiple threads share the same memory space, enabling concurrency.

**Python note:** the GIL limits true parallelism for CPU-bound tasks; use `multiprocessing` instead.

**Java example:**
```java
Runnable worker = () -> System.out.println("Thread running");
List<Thread> threads = IntStream.range(0, 3)
    .mapToObj(i -> new Thread(worker))
    .toList();
for (Thread t : threads) t.start();
for (Thread t : threads) t.join();
```

```python
import threading

def worker(name):
    print(f"Thread {name} running")

threads = [threading.Thread(target=worker, args=(i,)) for i in range(3)]
for t in threads:
    t.start()
for t in threads:
    t.join()
```
