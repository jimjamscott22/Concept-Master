---
name: TLS
categories:
- cybersecurity
- networking
tags:
- advanced
- interview-prep
- systems
code_lang: bash
---

Transport Layer Security encrypts data in transit so clients and servers can communicate privately and verify each other's identity.

**TLS provides:**
- Confidentiality through encryption
- Integrity checks to detect tampering
- Certificate-based authentication

HTTPS is simply HTTP running over TLS.

```bash
openssl s_client -connect example.com:443 -servername example.com
```
