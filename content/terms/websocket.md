---
name: WebSocket
categories:
- networking
- web
tags:
- advanced
- fundamentals
- javascript
code_lang: javascript
---

WebSocket is a protocol for long-lived, bidirectional communication between a client and server over a single TCP connection.

Unlike standard HTTP request-response traffic, either side can push messages at any time after the connection is established.

```javascript
const socket = new WebSocket("wss://example.com/ws");
socket.addEventListener("open", () => {
  socket.send(JSON.stringify({ type: "ping" }));
});
socket.addEventListener("message", (event) => {
  console.log("received:", event.data);
});
```
