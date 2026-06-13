---
name: API
categories:
- networking
- web
tags:
- fundamentals
- interview-prep
- javascript
code_lang: javascript
---

An API (Application Programming Interface) is a contract that lets one piece of software interact with another.

In web development, an API often exposes endpoints that clients call with HTTP requests and receive structured responses such as JSON.

**Key idea:** the client should not need to know how the server is implemented, only what requests are supported and what responses to expect.

```javascript
async function fetchTerms() {
  const response = await fetch("/api/terms");
  if (!response.ok) {
    throw new Error("Failed to load terms");
  }
  return response.json();
}
```
