---
name: Stack vs Heap Memory
categories:
- memory-management
tags:
- fundamentals
- interview-prep
- java
- systems
related:
- virtual-memory
code_lang: c
---

Programs use two main memory regions for allocation.

**Stack:** a fast, LIFO region that stores local variables, function parameters, and return addresses. Each function call creates a stack frame that is automatically freed when the function returns. Stack memory is limited in size, thread-local, and very fast because allocation is just a pointer bump.

**Heap:** a larger, dynamically allocated region for objects whose size or lifetime isn't known at compile time. Heap allocation is slower (requires bookkeeping) and memory must be freed explicitly (C/C++) or by a garbage collector (Java, Python).

**Key differences:**
- **Speed:** stack is faster (pointer bump vs. allocator search)
- **Size:** stack is small (typically 1-8 MB); heap can grow to available RAM
- **Lifetime:** stack data dies with the function; heap data lives until freed
- **Thread safety:** each thread has its own stack; the heap is shared

**Java example:**
```java
void demo() {
    int x = 42;              // x lives on the stack
    int[] arr = new int[10]; // arr reference on stack,
                             // array object on heap
}
```

```c
#include <stdio.h>
#include <stdlib.h>

void demo(void) {
    int x = 42;                     /* stack allocation */
    int *p = malloc(sizeof(int));   /* heap allocation  */
    *p = 99;
    printf("stack: %d, heap: %d\n", x, *p);
    free(p);                        /* must free heap memory */
}

int main(void) {
    demo();
    return 0;
}
```
