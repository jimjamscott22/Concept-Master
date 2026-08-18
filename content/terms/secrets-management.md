---
name: Secrets Management
categories:
- devops
tags:
- infrastructure
- operations
- security
related:
- ci-cd
- infrastructure-as-code
code_lang: bash
---

Secrets management is the practice of storing, distributing, rotating, and auditing credentials — API keys, database passwords, TLS private keys, tokens — so they never live in source code or unencrypted config.

A secrets system typically encrypts values at rest, grants access by identity (a CI job, a Kubernetes service account, a human role), injects them at runtime, and records who read or changed them. Rotation and short-lived credentials shrink the damage if a secret leaks.

**What not to do:**
- Commit `.env` files, PEM keys, or cloud access keys to Git.
- Bake secrets into container images or IaC state that is shared.
- Share one long-lived production password across every environment.

**Common tools:** HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager, Azure Key Vault, Kubernetes Secrets (better with encryption and an external store), and CI secret stores for pipeline credentials.

```bash
# Inject a secret at runtime instead of writing it into the repo
export DATABASE_URL="$(vault kv get -field=url secret/prod/db)"
uv run uvicorn backend.main:app --port 8000
```
