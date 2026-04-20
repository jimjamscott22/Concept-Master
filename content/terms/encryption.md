---
name: Encryption
categories:
- cybersecurity
tags:
- advanced
- fundamentals
- systems
code_lang: bash
---

Encryption transforms readable plaintext into unreadable ciphertext using an algorithm and a key so only authorized parties can recover the original data.

**At-rest vs. in-transit:**
- Disk/database encryption protects stored data
- TLS protects data moving across the network

```bash
echo "top-secret" | openssl enc -aes-256-cbc -pbkdf2 -salt -out secret.enc
```
