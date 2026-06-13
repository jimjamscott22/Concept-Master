---
name: Subquery
categories:
- databases
tags:
- fundamentals
- sql
related:
- select-query
- where-clause
- sql-join
code_lang: sql
---

A subquery is a `SELECT` nested inside another statement. It lets you use the result of one query as input to another.

**Common forms:**
- **Scalar** — returns a single value, usable anywhere a value is expected.
- **In `WHERE`** with `IN`, `EXISTS`, or a comparison to filter against another query's results.
- **In `FROM`** (a *derived table*) — treat the subquery's output as a temporary table.
- **Correlated** — references the outer query and is re-evaluated per outer row (powerful, but can be slow).

Many subqueries can be rewritten as `JOIN`s, which the optimizer often handles better — reach for a join first when both read equally clearly.

```sql
SELECT name, total
FROM orders
WHERE total > (SELECT AVG(total) FROM orders);
```
