---
name: Transaction
categories:
- databases
tags:
- fundamentals
- interview-prep
- java
code_lang: sql
---

A database transaction is a unit of work that groups one or more operations into a single logical action. The transaction either **fully completes** (commit) or **fully rolls back** (abort), ensuring the database never ends up in a half-finished state.

Transactions are the mechanism through which ACID guarantees are enforced.

**Java example:**
```java
Connection conn = DriverManager.getConnection(url);
conn.setAutoCommit(false);
try {
    PreparedStatement ps = conn.prepareStatement("INSERT INTO orders (user_id, total) VALUES (?, ?)");
    ps.setInt(1, userId);
    ps.setBigDecimal(2, total);
    ps.executeUpdate();
    conn.commit();
} catch (SQLException e) {
    conn.rollback();
    throw e;
}
```

```sql
BEGIN TRANSACTION;

INSERT INTO orders (user_id, total) VALUES (1, 59.99);
UPDATE inventory SET qty = qty - 1 WHERE product_id = 42;

-- If everything succeeds:
COMMIT;

-- If something fails:
-- ROLLBACK;
```
