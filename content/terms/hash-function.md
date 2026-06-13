---
name: Hash Function
categories:
- cybersecurity
tags:
- cryptography
- fundamentals
code_lang: python
---

A hash function maps arbitrary-length input to a fixed-length digest (e.g., 256 bits). A *cryptographic* hash function additionally satisfies:

1. **Pre-image resistance:** given `h`, infeasible to find `m` where `hash(m) = h`.
2. **Second pre-image resistance:** given `m₁`, infeasible to find `m₂ ≠ m₁` with the same hash.
3. **Collision resistance:** infeasible to find *any* two distinct inputs with the same hash.
4. **Avalanche effect:** a 1-bit change in input flips ~50% of output bits.

**Common algorithms:** SHA-256 (secure), SHA-3, bcrypt/Argon2 (for passwords — include salt + work factor). **MD5 and SHA-1 are broken** for security use.

**Uses:** password storage, data integrity (checksums), digital signatures, Merkle trees, HMACs.

```python
import hashlib, os

# Password hashing — NEVER use plain SHA-256 for passwords; use bcrypt/argon2
password = b"hunter2"
salt = os.urandom(16)
digest = hashlib.pbkdf2_hmac("sha256", password, salt, iterations=600_000)
print(digest.hex())

# Data integrity
data = b"important message"
checksum = hashlib.sha256(data).hexdigest()
print(checksum)  # deterministic: same data → same hash
```
