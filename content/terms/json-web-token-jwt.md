---
name: JSON Web Token (JWT)
categories:
- cybersecurity
- web
tags:
- fundamentals
- interview-prep
- security
related:
- oauth
- authentication
code_lang: javascript
---

A JSON Web Token, or JWT, is a compact token format commonly used to carry signed claims between systems.

A JWT has three base64url-encoded parts: header, payload, and signature. The signature helps the receiver verify that the token was issued by a trusted party and was not modified.

**Caution:** signing a JWT does not encrypt its payload, so do not store secrets inside it unless encryption is also used.

```javascript
const [header, payload, signature] = token.split(".");
const claims = JSON.parse(atob(payload));

console.log(claims.sub);
console.log(signature.length > 0);
```
