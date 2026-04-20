---
name: Cross-Site Scripting (XSS)
categories:
- cybersecurity
- web
tags:
- advanced
- exam-review
- interview-prep
- javascript
code_lang: javascript
---

Cross-site scripting is a vulnerability where attacker-controlled content is rendered as executable script in another user's browser.

**Common types:**
- Stored XSS
- Reflected XSS
- DOM-based XSS

Mitigations include output escaping, content security policy, and avoiding unsafe HTML injection.

```javascript
const message = userSuppliedText;
element.textContent = message; // safe: treats input as text, not HTML
```
