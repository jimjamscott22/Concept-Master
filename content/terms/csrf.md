---
name: Cross-Site Request Forgery (CSRF)
categories:
- cybersecurity
tags:
- attacks
- web-security
code_lang: python
---

CSRF tricks an authenticated user's browser into sending an unwanted request to a site where they are logged in. Because the browser automatically attaches cookies, the server cannot distinguish the forged request from a legitimate one.

**Classic attack flow:**
1. User logs in to `bank.com` — session cookie stored in browser.
2. User visits `evil.com`, which contains `<img src="https://bank.com/transfer?to=attacker&amount=1000">`.
3. Browser fires the request with the bank's cookie attached → transfer executes.

**Defenses:**
- **CSRF token:** server embeds a secret, per-session token in forms; server validates it on every state-changing request.
- **SameSite cookie attribute:** `SameSite=Strict/Lax` prevents cross-site cookie attachment for most browsers.
- **Double-submit cookie:** token sent both as a cookie and a request header; attacker can't read the cookie.

```python
# FastAPI CSRF token middleware example (conceptual)
import secrets

def generate_csrf_token() -> str:
    return secrets.token_urlsafe(32)

def verify_csrf_token(session_token: str, form_token: str) -> bool:
    return secrets.compare_digest(session_token, form_token)
```
