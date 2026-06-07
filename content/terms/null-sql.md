---
name: NULL (SQL)
categories:
- databases
tags:
- fundamentals
- sql
related:
- where-clause
- aggregate-functions
code_lang: sql
---

`NULL` represents the **absence of a value** — "unknown" or "not applicable" — not zero and not an empty string.

**The big gotcha: three-valued logic.** Comparisons with `NULL` yield `UNKNOWN`, not `TRUE`/`FALSE`. So `value = NULL` never matches anything — you must use `IS NULL` / `IS NOT NULL`.

- `NULL = NULL` → `UNKNOWN` (not true!)
- `WHERE col = NULL` returns no rows; use `WHERE col IS NULL`.
- Aggregates like `SUM`/`AVG` skip `NULL`s; `COUNT(col)` ignores them.
- Use `COALESCE(col, fallback)` to substitute a default for `NULL`.

```sql
SELECT name, COALESCE(phone, 'no phone on file') AS contact
FROM customers
WHERE deleted_at IS NULL;
```
