---
name: Database Migration
categories:
- databases
tags:
- fundamentals
- sql
code_lang: sql
---

A database migration is a versioned change to a database schema or reference data.

Migrations let teams evolve tables, indexes, constraints, and seed data in a repeatable way across development, testing, and production environments.

Good migrations are small, ordered, and reversible when possible.

```sql
ALTER TABLE terms
ADD COLUMN last_reviewed_at DATETIME NULL;

CREATE INDEX idx_terms_last_reviewed_at
ON terms (last_reviewed_at);
```
