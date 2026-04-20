---
name: Map, Filter, and Reduce
categories:
- functional-programming
tags:
- fundamentals
- interview-prep
- java
- javascript
- python
code_lang: python
---

Three higher-order functions that transform collections without explicit loops. **map** applies a function to each element, **filter** selects elements matching a predicate, and **reduce** combines all elements into a single accumulated value.

Together they form a declarative pipeline: transform → select → aggregate.

**Java example:**
```java
List<Integer> nums = List.of(1, 2, 3, 4, 5, 6);

int result = nums.stream()
    .map(n -> n * n)            // [1,4,9,16,25,36]
    .filter(n -> n % 2 == 0)    // [4,16,36]
    .reduce(0, Integer::sum);   // 56
```

```python
from functools import reduce

nums = [1, 2, 3, 4, 5, 6]

squared  = list(map(lambda n: n ** 2, nums))       # [1,4,9,16,25,36]
evens    = list(filter(lambda n: n % 2 == 0, squared))  # [4,16,36]
total    = reduce(lambda acc, n: acc + n, evens)   # 56

print(squared)  # [1, 4, 9, 16, 25, 36]
print(evens)    # [4, 16, 36]
print(total)    # 56
```
