---
name: Pointer
categories:
- memory-management
tags:
- fundamentals
- interview-prep
- systems
code_lang: c
---

A variable that stores the memory address of another variable rather than a data value itself. Pointers enable direct memory access, dynamic memory allocation, efficient pass-by-reference, and building data structures like linked lists and trees.

**Core operations:**
- **Declaration:** `int *p;` declares a pointer to an int
- **Address-of:** `p = &x;` stores the address of x
- **Dereference:** `*p` accesses the value at the stored address
- **Arithmetic:** `p + 1` moves to the next element of the pointed-to type

**Java note:**
```java
// Java has no explicit pointers, but object variables
// are references (managed pointers) under the hood:
String s = new String("hello"); // s holds a reference
String t = s;                   // t points to same object
```

```c
#include <stdio.h>

int main(void) {
    int x = 10;
    int *p = &x;          /* p holds the address of x */

    printf("x  = %d\n", x);    /* 10 */
    printf("*p = %d\n", *p);   /* 10  (dereference) */
    printf("p  = %p\n", (void *)p);  /* address */

    *p = 20;                   /* modify x through p */
    printf("x  = %d\n", x);    /* 20 */

    /* pointer arithmetic */
    int arr[] = {1, 2, 3};
    int *q = arr;
    printf("first: %d, second: %d\n", *q, *(q + 1));
    return 0;
}
```
