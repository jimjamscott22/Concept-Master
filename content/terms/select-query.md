---
name: SELECT Query
categories:
- databases
tags:
- fundamentals
- sql
related:
- index-database
code_lang: sql
---

A `SELECT` query reads data from one or more tables. It can return specific columns, filter rows, sort results, and combine data through joins.

**Common parts:**
- `SELECT` chooses the columns.
- `FROM` chooses the table.
- `WHERE` filters rows.
- `ORDER BY` sorts the result.

```sql
SELECT id, name, email
FROM users
WHERE is_active = 1
ORDER BY name ASC;
```
