---
name: Aggregate Functions
categories:
- databases
tags:
- fundamentals
- sql
related:
- group-by
- select-query
code_lang: sql
---

Aggregate functions collapse **many rows into a single summary value**. The core five are `COUNT`, `SUM`, `AVG`, `MIN`, and `MAX`.

**Behavior worth remembering:**
- `COUNT(*)` counts rows; `COUNT(col)` counts non-`NULL` values in that column.
- `SUM`, `AVG`, `MIN`, `MAX` ignore `NULL`s entirely.
- Used alone they reduce the whole table to one row; paired with `GROUP BY` they produce one row *per group*.
- `COUNT(DISTINCT col)` counts unique non-null values.

```sql
SELECT
  COUNT(*)        AS order_count,
  SUM(total)      AS revenue,
  AVG(total)      AS avg_order,
  MAX(total)      AS biggest_order
FROM orders
WHERE status = 'paid';
```
