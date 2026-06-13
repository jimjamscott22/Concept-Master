---
name: LIKE Operator
categories:
- databases
tags:
- fundamentals
- sql
related:
- where-clause
- index-database
code_lang: sql
---

`LIKE` performs pattern matching on text in a `WHERE` clause using two wildcards:

- `%` matches **any sequence** of characters (including none).
- `_` matches **exactly one** character.

**Notes:**
- `'a%'` matches anything starting with *a*; `'%a%'` matches *a* anywhere.
- A leading `%` (`'%term'`) usually **defeats an index**, forcing a full scan — fine on small tables, costly on large ones.
- Case sensitivity depends on the column's collation in MySQL/MariaDB.
- Use `ESCAPE` to match a literal `%` or `_`.

```sql
SELECT name, email
FROM users
WHERE email LIKE '%@gmail.com'
  AND name LIKE 'J_n%';   -- Jon, Jan, Jane...
```
