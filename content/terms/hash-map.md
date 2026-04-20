---
name: Hash Map
categories:
- data-structures
tags:
- fundamentals
- java
code_lang: python
---

A data structure mapping keys to values using a hash function. Provides O(1) average-case lookup, insert, and delete.

**Collision resolution:** chaining or open addressing.

**Java example:**
```java
Map<String, Integer> freq = new HashMap<>();
for (String word : words) {
    freq.put(word, freq.getOrDefault(word, 0) + 1);
}
```

```python
freq = {}
for word in words:
    freq[word] = freq.get(word, 0) + 1
```
