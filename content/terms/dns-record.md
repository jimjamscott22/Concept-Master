---
name: DNS Record
categories:
- networking
tags:
- fundamentals
- interview-prep
related:
- dns
- cdn
code_lang: bash
---

A DNS record is an entry in the Domain Name System that tells resolvers how to answer a question about a domain.

Common record types include A for IPv4 addresses, AAAA for IPv6 addresses, CNAME for aliases, MX for mail servers, TXT for text metadata, and NS for authoritative name servers.

**Key idea:** DNS records turn human-friendly names into the data clients need to connect to services.

```bash
dig example.com A
dig example.com MX
```
