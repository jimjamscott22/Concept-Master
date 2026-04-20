---
name: Authentication
categories:
- cybersecurity
- web
tags:
- fundamentals
- java
- python
code_lang: python
---

Authentication is the process of verifying who a user or system is. It answers the question, "Are you really who you claim to be?"

**Common authentication factors:**
- Something you know: password or PIN
- Something you have: token or phone
- Something you are: fingerprint or face scan

**Java example:**
```java
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.example.com/me"))
    .header("Authorization", "Bearer " + token)
    .GET()
    .build();
```

```python
headers = {"Authorization": f"Bearer {token}"}
response = requests.get("https://api.example.com/me", headers=headers)
```
