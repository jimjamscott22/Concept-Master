---
name: Normalization
categories:
- databases
tags:
- exam-review
- fundamentals
- interview-prep
code_lang: sql
---

Database normalization is the process of organizing tables to **reduce redundancy** and **prevent update anomalies**.

**1NF (First Normal Form):** every column holds atomic (indivisible) values; no repeating groups.
**2NF (Second Normal Form):** meets 1NF and every non-key column depends on the entire primary key.
**3NF (Third Normal Form):** meets 2NF and no non-key column depends on another non-key column (no transitive dependencies).

Higher normal forms exist (BCNF, 4NF, 5NF) but 3NF is the practical target for most applications.

```sql
-- Unnormalized: repeating data
-- | order_id | customer | item   | item_price |
-- | 1        | Alice    | Widget | 9.99       |
-- | 2        | Alice    | Gadget | 14.99      |

-- Normalized into two tables:
CREATE TABLE customers (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE orders (
    id          INTEGER PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    item        TEXT NOT NULL,
    item_price  REAL NOT NULL
);
```
