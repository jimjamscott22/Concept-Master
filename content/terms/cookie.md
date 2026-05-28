---
name: Cookie
categories:
- cybersecurity
- web
tags:
- fundamentals
- javascript
- security
code_lang: javascript
---

A cookie is a small piece of data stored by the browser and sent with matching HTTP requests.

Cookies are commonly used for sessions, preferences, and tracking. Security-sensitive cookies should use flags such as `HttpOnly`, `Secure`, and `SameSite`.

**Important flags:**

- `HttpOnly` prevents JavaScript from reading the cookie.
- `Secure` sends the cookie only over HTTPS.
- `SameSite` limits when cookies are sent with cross-site requests.

```javascript
document.cookie = "theme=dark; Max-Age=2592000; SameSite=Lax";
```
