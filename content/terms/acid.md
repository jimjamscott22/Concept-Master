---
name: ACID
categories:
- databases
tags:
- exam-review
- fundamentals
- interview-prep
- java
- python
code_lang: python
---

ACID describes the four guarantees every reliable database transaction must provide.

**Atomicity** — a transaction is all-or-nothing; if any step fails the entire transaction rolls back.
**Consistency** — a transaction moves the database from one valid state to another, respecting all constraints.
**Isolation** — concurrent transactions execute as if they were sequential; intermediate states are invisible to others.
**Durability** — once committed, changes survive crashes and power failures.

**Java example:**
```java
Connection conn = DriverManager.getConnection(url);
conn.setAutoCommit(false);
Statement stmt = conn.createStatement();
try {
    stmt.executeUpdate("UPDATE accounts SET balance = balance - 100 WHERE id = 1");
    stmt.executeUpdate("UPDATE accounts SET balance = balance + 100 WHERE id = 2");
    conn.commit();
} catch (SQLException e) {
    conn.rollback();
}
```

```python
import sqlite3

conn = sqlite3.connect("bank.db")
try:
    conn.execute("UPDATE accounts SET balance = balance - 100 WHERE id = 1")
    conn.execute("UPDATE accounts SET balance = balance + 100 WHERE id = 2")
    conn.commit()
except Exception:
    conn.rollback()
```
