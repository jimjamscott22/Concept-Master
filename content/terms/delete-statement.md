---
name: DELETE Statement
categories:
- databases
tags:
- fundamentals
- sql
code_lang: sql
---

A `DELETE` statement removes rows from a table. Like `UPDATE`, it should normally include a `WHERE` clause to avoid removing every row.

**MySQL note:** foreign key constraints can block deletes or cascade them to child rows, depending on how the relationship is defined.

```sql
DELETE FROM sessions
WHERE expires_at < NOW();
```
