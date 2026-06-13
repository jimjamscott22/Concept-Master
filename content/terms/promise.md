---
name: Promise
categories:
- functional-programming
- web
tags:
- fundamentals
- javascript
code_lang: javascript
---

A Promise is a JavaScript object that represents a value that may be available now, later, or never.

Promises are used for asynchronous work such as HTTP requests, timers, and file operations. A promise can be pending, fulfilled, or rejected.

`async` and `await` are syntax built on top of promises that make asynchronous code read more like synchronous code.

```javascript
function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

await wait(500);
console.log("Half a second passed");
```
