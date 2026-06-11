---
name: Content Security Policy
categories:
- cybersecurity
- web
tags:
- fundamentals
- interview-prep
- security
related:
- cross-site-scripting-xss
- csrf
code_lang: javascript
---

Content Security Policy, or CSP, is a browser security feature that restricts which sources a page is allowed to load and execute.

CSP is commonly used to reduce the impact of cross-site scripting by blocking unexpected scripts, images, frames, and connections. It is delivered with an HTTP header or a meta tag.

**Key idea:** declare trusted sources explicitly instead of allowing everything by default.

```javascript
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'"
  );
  next();
});
```
