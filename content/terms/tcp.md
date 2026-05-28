---
name: TCP
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

Transmission Control Protocol is a connection-oriented transport protocol that prioritizes reliable, ordered delivery of bytes between hosts.

**TCP features:**
- Three-way handshake before data transfer
- Retransmission of lost packets
- Flow control and congestion control
- Commonly used by HTTP, HTTPS, SSH, and databases

**Java example:**
```java
try (Socket socket = new Socket("example.com", 80);
     BufferedWriter out = new BufferedWriter(new OutputStreamWriter(socket.getOutputStream()));
     BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()))) {
    out.write("GET / HTTP/1.1
Host: example.com

");
    out.flush();
    System.out.println(in.readLine());
}
```

```python
import socket

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
    sock.connect(("example.com", 80))
    sock.sendall(b"GET / HTTP/1.1\r\nHost: example.com\r\n\r\n")
    print(sock.recv(1024).decode())
```
