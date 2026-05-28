---
name: INSERT Statement
categories:
- databases
tags:
- fundamentals
- sql
code_lang: sql
---

An `INSERT` statement adds new rows to a table. In MySQL, omitted columns use their default value, `NULL`, or an auto-generated value if the column supports it.

**Tip:** list the target columns explicitly so the query stays correct if the table schema changes.

```sql
INSERT INTO users (name, email, is_active)
VALUES ('Avery Stone', 'avery@example.com', 1);
```
