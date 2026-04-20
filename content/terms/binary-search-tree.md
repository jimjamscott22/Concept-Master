---
name: Binary Search Tree
categories:
- data-structures
tags:
- fundamentals
- java
code_lang: python
---

A binary tree where for each node, all values in the left subtree are smaller and all values in the right subtree are larger.

**Time complexity (balanced):**
- Search/Insert/Delete: O(log n)

**Java example:**
```java
class Node {
    int val;
    Node left, right;
    Node(int val) { this.val = val; }
}

Node insert(Node root, int val) {
    if (root == null) return new Node(val);
    if (val < root.val) root.left = insert(root.left, val);
    else root.right = insert(root.right, val);
    return root;
}
```

```python
class BST:
    def insert(self, root, val):
        if not root:
            return Node(val)
        if val < root.val:
            root.left = self.insert(root.left, val)
        else:
            root.right = self.insert(root.right, val)
        return root
```
