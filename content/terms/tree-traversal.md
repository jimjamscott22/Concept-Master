---
name: Tree Traversal
categories:
- algorithms
- data-structures
tags:
- fundamentals
- interview-prep
- java
code_lang: java
---

Tree traversal is the process of visiting every node in a tree in a specific order.

Common depth-first traversals are preorder, inorder, and postorder. Breadth-first traversal visits nodes level by level using a queue.

**Binary tree depth-first orders:**

- Preorder: root, left, right
- Inorder: left, root, right
- Postorder: left, right, root

```java
void inorder(TreeNode node) {
    if (node == null) {
        return;
    }

    inorder(node.left);
    System.out.println(node.value);
    inorder(node.right);
}
```
