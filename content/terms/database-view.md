---
name: Database View
categories:
- databases
tags:
- sql
- fundamentals
code_lang: sql
---

A view is a named, saved SELECT query that behaves like a virtual table. The underlying data is not duplicated — the view's query executes when the view is referenced.

**Benefits:**
- **Abstraction:** hide join complexity or sensitive columns from callers.
- **Security:** grant SELECT on the view, not the base tables.
- **Readability:** replace a complex join with a simple `SELECT * FROM clean_view`.

**Limitations:** standard views don't store data and can be slow for expensive queries. *Materialized views* (PostgreSQL, MySQL 8+) cache results and refresh on demand.

**Updatable views:** a view over a single table with no aggregates/DISTINCT can often accept INSERT/UPDATE/DELETE, transparently forwarded to the base table.

```sql
-- Create a view joining terms with their categories
CREATE VIEW terms_with_categories AS
SELECT
    t.id,
    t.name,
    t.slug,
    GROUP_CONCAT(c.name ORDER BY c.name SEPARATOR ', ') AS categories
FROM terms t
LEFT JOIN term_categories tc ON tc.term_id = t.id
LEFT JOIN categories c       ON c.id = tc.category_id
GROUP BY t.id, t.name, t.slug;

-- Use it like a table
SELECT * FROM terms_with_categories WHERE categories LIKE '%Algorithms%';

-- Remove when no longer needed
DROP VIEW IF EXISTS terms_with_categories;
```
