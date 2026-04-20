---
name: DNS
categories:
- networking
tags:
- exam-review
- interview-prep
- systems
code_lang: bash
---

Domain Name System translates human-readable domain names into IP addresses so clients can locate servers on a network.

**DNS records include:**
- `A` / `AAAA` for IP addresses
- `CNAME` for aliases
- `MX` for mail routing
- `TXT` for verification and policy metadata

```bash
nslookup example.com
```
