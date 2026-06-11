---
name: OAuth
categories:
- cybersecurity
- web
tags:
- fundamentals
- interview-prep
- security
related:
- authentication
- authorization
code_lang: javascript
---

OAuth is an authorization framework that lets an application access a user's resources without handling the user's password directly.

A common flow redirects the user to an identity provider, receives an authorization code, and exchanges that code for tokens. The application then uses an access token to call protected APIs.

**Important distinction:** OAuth is mainly about delegated authorization; OpenID Connect adds identity information on top.

```javascript
const params = new URLSearchParams({
  response_type: "code",
  client_id: "client-123",
  redirect_uri: "https://app.example.com/callback",
  scope: "read:profile",
});

location.href = `https://auth.example.com/authorize?${params}`;
```
