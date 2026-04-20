---
name: SQL JOIN
categories:
- databases
tags:
- fundamentals
code_lang: sql
---

A SQL clause combining rows from two or more tables based on a related column.

**Types:**
- `INNER JOIN` — matching rows only
- `LEFT JOIN` — all left rows + matching right
- `RIGHT JOIN` — all right rows + matching left
- `FULL OUTER JOIN` — all rows from both

```sql
SELECT u.name, o.total
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE o.total > 100;
```
