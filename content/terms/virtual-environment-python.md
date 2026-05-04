---
name: Virtual Environment (Python)
categories:
- memory-management
tags:
- fundamentals
- python
- tooling
related:
- dependency-injection
code_lang: bash
---

A Python virtual environment is an isolated directory that contains a Python interpreter and project-specific packages. It lets different projects use different dependency versions without installing everything globally.

Virtual environments make projects more reproducible and reduce "works on my machine" dependency conflicts.

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install requests
```
