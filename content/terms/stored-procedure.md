---
name: Stored Procedure
categories:
- databases
tags:
- sql
- fundamentals
code_lang: sql
---

A stored procedure is a named, precompiled block of SQL (and procedural logic) saved in the database and executed by name. Unlike ad-hoc queries, it runs on the server, reducing round-trips and network overhead.

**Advantages:**
- **Performance:** query plan cached after first execution.
- **Security:** grant `EXECUTE` on the procedure without exposing underlying tables.
- **Encapsulation:** business logic lives in the DB, callable from any application.
- **Reduce duplication:** one definition, many callers.

**Downsides:** harder to version-control, test, and port across DB engines.

```sql
-- MySQL / MariaDB syntax
DELIMITER $$

CREATE PROCEDURE get_terms_by_category(IN cat_slug VARCHAR(100))
BEGIN
    SELECT t.id, t.name, t.slug
    FROM terms t
    JOIN term_categories tc ON tc.term_id = t.id
    JOIN categories c       ON c.id = tc.category_id
    WHERE c.slug = cat_slug
    ORDER BY t.name;
END$$

DELIMITER ;

-- Invoke
CALL get_terms_by_category('algorithms');
```
