---
name: EXPLAIN (MySQL)
categories:
- databases
tags:
- mysql
- performance
code_lang: sql
---

`EXPLAIN` shows how MySQL plans to execute a query. It helps diagnose slow queries by showing table access order, index usage, join strategy, and estimated rows scanned.

**Watch for:** full table scans on large tables, missing useful indexes, and unexpectedly high row estimates.

```sql
EXPLAIN
SELECT u.name, o.total
FROM users AS u
JOIN orders AS o ON o.user_id = u.id
WHERE o.created_at >= '2026-01-01';
```
