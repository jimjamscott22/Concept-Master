---
name: Subnet
categories:
- networking
tags:
- fundamentals
- infrastructure
code_lang: bash
---

A subnet (subnetwork) is a logical subdivision of an IP network. Subnetting divides a large address block into smaller, manageable chunks, improving routing efficiency and isolating broadcast domains.

**CIDR notation:** `192.168.1.0/24` — the `/24` is the prefix length (subnet mask bits). A `/24` gives 256 addresses (254 usable: subtract network address and broadcast).

**Subnet mask:** a 32-bit mask where 1s identify the network portion and 0s the host portion. `/24` = `255.255.255.0`.

| CIDR | Mask | Usable hosts |
|---|---|---|
| /24 | 255.255.255.0 | 254 |
| /25 | 255.255.255.128 | 126 |
| /30 | 255.255.255.252 | 2 (point-to-point links) |

**Private ranges (RFC 1918):** `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` — not routable on the public Internet.

```bash
# ipcalc is a handy CLI subnet calculator
ipcalc 192.168.10.0/24

# Check your machine's IP and subnet
ip addr show
# or on macOS/older Linux:
ifconfig

# Determine if two IPs are on the same subnet (Python one-liner)
python3 -c "
import ipaddress
net = ipaddress.IPv4Network('192.168.1.0/24')
print('192.168.1.50' in [str(h) for h in net.hosts()])  # True
"
```
