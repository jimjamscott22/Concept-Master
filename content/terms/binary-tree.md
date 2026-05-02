---
name: Binary Tree
categories:
- data-structures
tags:
- fundamentals
- interview-prep
- java
code_lang: java
---

A binary tree is a tree data structure where each node has at most two children, usually called the left child and the right child.

Binary trees are the foundation for many specialized structures, including binary search trees, heaps, and expression trees.

Unlike a binary search tree, a plain binary tree does not require values to be ordered.

```java
class TreeNode {
    int value;
    TreeNode left;
    TreeNode right;

    TreeNode(int value) {
        this.value = value;
    }
}
```
