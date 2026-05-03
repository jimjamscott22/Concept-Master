---
name: Primary Key
categories:
- databases
tags:
- fundamentals
- mysql
related:
- foreign-key
- index-database
code_lang: sql
---

A primary key uniquely identifies each row in a table. It cannot contain duplicate values, and in MySQL it is automatically indexed.

Primary keys are often numeric IDs, but they can also be made from multiple columns when the real-world identity is composite.

```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(120) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
);
```
