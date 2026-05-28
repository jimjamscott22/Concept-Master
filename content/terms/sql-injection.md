---
name: SQL Injection
categories:
- cybersecurity
- databases
- web
tags:
- advanced
- exam-review
- interview-prep
- java
- python
related:
- update-statement
code_lang: python
---

SQL injection is a vulnerability where untrusted input is interpreted as part of a SQL query, allowing attackers to bypass checks or read and modify data.

**Primary defense:** always use parameterized queries instead of building SQL with string concatenation.

**Java example:**
```java
String sql = "SELECT * FROM users WHERE email = ? AND password_hash = ?";
PreparedStatement stmt = connection.prepareStatement(sql);
stmt.setString(1, email);
stmt.setString(2, passwordHash);
ResultSet rs = stmt.executeQuery();
```

```python
cursor.execute(
    "SELECT * FROM users WHERE email = %s AND password_hash = %s",
    (email, password_hash),
)
```
