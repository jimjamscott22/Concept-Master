---
title: Choosing the Right Data Structure
subtitle: Match the structure to the operations you do most
is_published: true
categories: [data-structures]
tags: [fundamentals, interview-prep]
related_terms: [hash-map, array, linked-list, stack, queue, binary-search-tree]
related_articles: [understanding-big-o-notation]
---

Most performance problems aren't about clever algorithms — they're about picking a
data structure whose strengths line up with what your code does most often. Start
by asking: *what operation am I doing in the hot path?*

## A cheat sheet for the common cases

| Need                          | Reach for         | Why                              |
| ----------------------------- | ----------------- | -------------------------------- |
| Fast lookup by key            | Hash map          | `O(1)` average access            |
| Ordered iteration + lookup    | Balanced BST      | `O(log n)` ops, sorted traversal |
| Index-based access            | Array             | `O(1)` random access             |
| Frequent insert/remove at ends| Deque             | `O(1)` at both ends              |
| LIFO processing               | Stack             | Natural call/undo semantics      |
| FIFO processing               | Queue             | Fair, in-order handling          |

## The classic trade-off: array vs. linked list

Arrays give you `O(1)` random access but `O(n)` insertion in the middle. Linked
lists flip that: `O(1)` insertion once you hold a node, but `O(n)` to find it.

```python
# Array: great for "give me element 5000"
prices = [12.5, 9.99, 14.0]
print(prices[2])      # O(1)

# Linked list shines when you splice constantly and rarely index
```

## When in doubt, reach for a hash map

If you find yourself writing a nested loop to check "have I seen this before?",
that's almost always a sign to introduce a set or hash map and collapse an `O(n²)`
scan into an `O(n)` pass — exactly the kind of win covered in the companion piece
on complexity.

## Don't forget memory

A hash map's speed comes at the cost of extra memory and cache-unfriendly access
patterns. For small, fixed collections a plain array is often faster *in practice*
despite identical Big-O, because it stays in cache. Measure before you optimize.
