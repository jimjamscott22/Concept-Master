---
name: UDP
categories:
- networking
tags:
- exam-review
- interview-prep
- java
- python
- systems
code_lang: python
---

User Datagram Protocol is a connectionless transport protocol that sends independent datagrams without guaranteeing delivery, ordering, or duplicate protection.

**Why use UDP?**
- Lower latency than TCP
- Minimal protocol overhead
- Useful for DNS, VoIP, live video, and online games where speed matters more than perfect delivery

**Java example:**
```java
try (DatagramSocket socket = new DatagramSocket()) {
    byte[] data = "ping".getBytes(StandardCharsets.UTF_8);
    DatagramPacket packet = new DatagramPacket(
        data, data.length, InetAddress.getByName("127.0.0.1"), 9999
    );
    socket.send(packet);
}
```

```python
import socket

with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
    sock.sendto(b"ping", ("127.0.0.1", 9999))
```
