---
name: CORS
categories:
- cybersecurity
- web
tags:
- advanced
- fundamentals
- javascript
code_lang: javascript
---

CORS (Cross-Origin Resource Sharing) is a browser security mechanism that controls whether a web page can request resources from a different origin.

An origin is the combination of protocol, domain, and port. For example, `http://localhost:5173` and `http://localhost:8000` are different origins.

Servers allow cross-origin requests by sending headers such as `Access-Control-Allow-Origin`.

```javascript
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});
```
