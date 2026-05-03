---
name: Foreign Key
categories:
- databases
tags:
- fundamentals
- mysql
related:
- primary-key
- normalization
code_lang: sql
---

A foreign key is a column, or set of columns, that points to a primary key or unique key in another table. It helps preserve referential integrity between related tables.

Foreign keys let the database reject child rows that reference missing parent rows.

```sql
CREATE TABLE orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id) REFERENCES users(id)
);
```
