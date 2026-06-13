---
name: ORDER BY
categories:
- databases
tags:
- fundamentals
- sql
related:
- select-query
- where-clause
code_lang: sql
---

`ORDER BY` sorts the rows of a result set. Without it, SQL makes **no guarantee** about row order — results may come back in any sequence.

**Key points:**
- `ASC` (ascending, the default) or `DESC` (descending) per column.
- Sort by multiple columns; later columns break ties from earlier ones.
- You can sort by a column, an expression, or a `SELECT`-list alias.
- Combine with `LIMIT` / `OFFSET` to get "top N" results or to paginate.

```sql
SELECT name, total
FROM orders
ORDER BY total DESC, name ASC
LIMIT 10;
```
