---
name: GROUP BY
categories:
- databases
tags:
- fundamentals
- sql
code_lang: sql
---

`GROUP BY` combines rows that share the same values into summary groups. It is commonly used with aggregate functions like `COUNT`, `SUM`, `AVG`, `MIN`, and `MAX`.

**Use `HAVING`** when filtering after aggregation.

```sql
SELECT user_id, COUNT(*) AS order_count, SUM(total) AS total_spent
FROM orders
GROUP BY user_id
HAVING COUNT(*) >= 3;
```
