---
name: UPDATE Statement
categories:
- databases
tags:
- fundamentals
- sql
related:
- sql-injection
- transaction
code_lang: sql
---

An `UPDATE` statement changes existing rows in a table. It should usually include a `WHERE` clause so only the intended rows are modified.

**Safety habit:** run a matching `SELECT` first when writing a risky update.

```sql
UPDATE users
SET last_login_at = NOW()
WHERE id = 42;
```
