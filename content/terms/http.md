---
name: HTTP
categories:
- networking
- web
tags:
- exam-review
- fundamentals
code_lang: bash
---

Hypertext Transfer Protocol, the request-response protocol that powers most web communication. Clients send requests to servers using methods like `GET` and `POST`, and servers return status codes, headers, and a response body.

**Common building blocks:**
- Methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
- Status codes: `2xx`, `3xx`, `4xx`, `5xx`
- Headers: `Content-Type`, `Authorization`, `Cache-Control`

```bash
curl -i https://example.com/api/terms \
  -H "Accept: application/json"
```
