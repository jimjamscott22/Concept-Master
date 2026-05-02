---
name: JSON
categories:
- web
tags:
- fundamentals
- javascript
code_lang: javascript
---

JSON (JavaScript Object Notation) is a text format for representing structured data.

It is widely used for API requests and responses because it maps naturally to objects, arrays, strings, numbers, booleans, and `null`.

JSON looks similar to JavaScript object syntax, but it is stricter: property names and strings must use double quotes.

```javascript
const term = {
  name: "Stack",
  categories: ["data-structures"],
  is_favorite: false,
};

const payload = JSON.stringify(term);
const parsed = JSON.parse(payload);
```
