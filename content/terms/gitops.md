---
name: GitOps
categories:
- devops
tags:
- automation
- git
- infrastructure
related:
- ci-cd
- infrastructure-as-code
- orchestration
code_lang: yaml
---

GitOps is an operations model where Git is the source of truth for desired system state, and an automated controller continuously reconciles the live environment to match that repository.

Instead of applying changes by running deploy commands by hand, you commit a declarative config (Kubernetes manifests, Helm values, Terraform). A GitOps agent notices the commit, applies it, and reports drift if production no longer matches Git.

**Typical properties:**
- **Declarative:** you describe the desired end state, not a script of imperative steps.
- **Versioned:** every change is a Git commit with review, history, and rollback.
- **Pulled:** a controller in the cluster (or pipeline) pulls config, rather than a human pushing credentials from a laptop.
- **Reconciled:** if someone changes production out of band, the controller can detect and correct drift.

**Common tools:** Argo CD, Flux, and GitHub Actions or GitLab CI as the path that updates the GitOps repo after CI succeeds.

```yaml
# Argo CD Application: cluster state follows this Git path
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: concept-master
spec:
  source:
    repoURL: https://github.com/example/gitops
    path: apps/concept-master
    targetRevision: main
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```
