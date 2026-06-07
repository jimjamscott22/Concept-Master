---
name: WHERE Clause
categories:
- databases
tags:
- fundamentals
- sql
related:
- select-query
- delete-statement
- update-statement
code_lang: sql
---

The `WHERE` clause filters rows, keeping only those for which a condition evaluates to **true**. It applies to `SELECT`, `UPDATE`, and `DELETE`, and runs *before* grouping and sorting.

**Operators you can combine:**
- Comparison: `=`, `<>` (not equal), `<`, `>`, `<=`, `>=`
- Logical: `AND`, `OR`, `NOT` (use parentheses to control precedence)
- Set membership: `IN (...)`, ranges: `BETWEEN a AND b`
- Pattern match: `LIKE`, null test: `IS NULL`

Note that `WHERE` filters individual rows; to filter *after* aggregation use `HAVING`.

```sql
SELECT name, total
FROM orders
WHERE total >= 100
  AND status IN ('paid', 'shipped')
  AND created_at BETWEEN '2026-01-01' AND '2026-03-31';
```
