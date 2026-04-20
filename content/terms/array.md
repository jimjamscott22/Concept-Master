---
name: Array
categories:
- data-structures
tags:
- fundamentals
- java
code_lang: python
---

A contiguous block of memory storing elements of the same type, accessed by index in O(1) time. Arrays have fixed size in most languages.

**Time complexity:**
- Access: O(1)
- Search: O(n)
- Insert/Delete: O(n)

**Java example:**
```java
int[] nums = {1, 2, 3, 4, 5};
System.out.println(nums[2]); // O(1) access => 3
```

```python
nums = [1, 2, 3, 4, 5]
print(nums[2])  # O(1) access => 3
nums.append(6)  # O(1) amortized
```
