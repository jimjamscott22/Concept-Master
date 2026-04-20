---
name: Linked List
categories:
- data-structures
tags:
- fundamentals
- java
code_lang: python
---

A linear data structure where each element (node) stores a value and a pointer to the next node. Unlike arrays, nodes are not contiguous in memory.

**Time complexity:**
- Access: O(n)
- Search: O(n)
- Insert/Delete at head: O(1)

**Java example:**
```java
class Node {
    int val;
    Node next;
    Node(int val) { this.val = val; }
}

Node head = new Node(1);
head.next = new Node(2);
```

```python
class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

head = Node(1)
head.next = Node(2)
```
