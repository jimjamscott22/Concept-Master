---
name: CI/CD
categories:
- devops
tags:
- automation
- deployment
- pipelines
code_lang: yaml
---

CI/CD combines **Continuous Integration** and **Continuous Delivery** so code changes are built, tested, and prepared for release automatically.

**Continuous Integration (CI)** focuses on merging small changes frequently and validating them with automated checks. **Continuous Delivery (CD)** extends that pipeline so a passing build can be released reliably with minimal manual work.

**Typical stages:**
- **Build:** install dependencies and compile or bundle the app.
- **Test:** run unit, integration, lint, and security checks.
- **Package:** create deployable artifacts such as containers or release bundles.
- **Deploy:** promote the artifact to staging or production.

Good CI/CD pipelines make releases smaller, faster, and easier to roll back.

```yaml
name: ci

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
```
