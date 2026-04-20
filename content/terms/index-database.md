---
name: Index (Database)
categories:
- databases
tags:
- fundamentals
code_lang: sql
---

A data structure (usually a B-tree) that speeds up data retrieval at the cost of additional storage and slower writes.

**Rule of thumb:** index columns used in WHERE, JOIN, and ORDER BY clauses.

```sql
CREATE INDEX idx_users_email ON users(email);

-- Now this is fast:
SELECT * FROM users WHERE email = 'alice@example.com';
```
