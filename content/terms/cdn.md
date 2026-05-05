---
name: CDN (Content Delivery Network)
categories:
- web
tags:
- infrastructure
- performance
code_lang: bash
---

A CDN is a geographically distributed network of edge servers (PoPs — Points of Presence) that cache and serve static assets (images, JS, CSS, videos) from the location closest to the user.

**How it works:**
1. First request → edge server misses cache → fetches from origin, stores a copy.
2. Subsequent requests → served directly from the edge.

**Benefits:**
- **Latency:** physical proximity reduces round-trip time.
- **Throughput:** CDN absorbs traffic spikes, shielding the origin server.
- **Availability:** edge caches still serve content if origin is briefly down.
- **Security:** DDoS mitigation, TLS termination, WAF (Web Application Firewall) at the edge.

**Cache-Control header** is how you tell CDNs (and browsers) how long to cache an asset:
- `Cache-Control: public, max-age=31536000, immutable` — static asset with a content hash in the filename; cache forever.
- `Cache-Control: no-cache` — revalidate with origin on every request.

**Popular CDNs:** Cloudflare, AWS CloudFront, Fastly, Akamai.

```bash
# Check which CDN edge served your request
curl -I https://example.com/app.js | grep -i 'cf-ray\|x-cache\|server'

# Purge a Cloudflare cache entry (requires API token)
curl -X DELETE "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
  -H "Authorization: Bearer CF_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://example.com/app.js"]}'
```
