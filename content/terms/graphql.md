---
name: GraphQL
categories:
- web
tags:
- api
- fundamentals
code_lang: bash
---

GraphQL is a query language for APIs and a runtime for executing those queries. Clients describe exactly the data they need in a single request — no over-fetching (getting unused fields) or under-fetching (needing multiple round-trips).

**Core concepts:**
- **Schema:** typed contract between client and server (`type Query { … }`).
- **Query:** read data — client specifies fields and nested relationships.
- **Mutation:** write data.
- **Subscription:** real-time updates over a WebSocket.
- **Resolver:** server-side function that fetches data for each field.

**vs. REST:**
| | REST | GraphQL |
|---|---|---|
| Endpoints | One per resource | Single `/graphql` |
| Data shape | Fixed by server | Defined by client |
| Versioning | `/v1`, `/v2` | Evolve schema |

**Downsides:** N+1 query problem (use DataLoader), complex query analysis for DoS protection, caching is harder than with REST.

```bash
# Query a public GraphQL API with curl
curl -X POST https://api.github.com/graphql \
  -H "Authorization: bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ viewer { login name } }"
  }'

# Typical GraphQL query syntax (sent as JSON string)
# {
#   user(id: "42") {
#     name
#     email
#     posts { title createdAt }
#   }
# }
```
