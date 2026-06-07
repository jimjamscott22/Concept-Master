---
name: UNION
categories:
- databases
tags:
- fundamentals
- sql
related:
- select-query
- distinct
code_lang: sql
---

`UNION` stacks the rows of two or more `SELECT` queries into one result set (vertically), unlike a `JOIN`, which combines columns side by side.

**Rules:**
- Each query must return the **same number of columns** with compatible types.
- Column names come from the *first* query.
- `UNION` removes duplicate rows (an implicit `DISTINCT`); `UNION ALL` keeps every row and is faster — prefer it when you know there are no duplicates.
- A single `ORDER BY` at the very end sorts the combined result.

```sql
SELECT name, 'customer' AS kind FROM customers
UNION ALL
SELECT name, 'supplier' AS kind FROM suppliers
ORDER BY name;
```
