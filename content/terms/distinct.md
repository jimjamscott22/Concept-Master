---
name: DISTINCT
categories:
- databases
tags:
- fundamentals
- sql
related:
- select-query
- aggregate-functions
code_lang: sql
---

`DISTINCT` removes duplicate rows from a result set, returning only unique combinations of the selected columns.

**Things to know:**
- `DISTINCT` applies to the **entire `SELECT` list**, not just the first column — `SELECT DISTINCT city, country` returns unique *(city, country)* pairs.
- Two `NULL`s are treated as equal for de-duplication purposes here, so they collapse to one.
- It can force a sort or hash under the hood, so on large tables it isn't free.
- Inside an aggregate: `COUNT(DISTINCT user_id)` counts unique users.

```sql
SELECT DISTINCT country
FROM customers
ORDER BY country;
```
