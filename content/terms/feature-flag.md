---
name: Feature Flag
categories:
- devops
tags:
- deployment
- release-strategy
- rollback
related:
- canary-deployment
- ci-cd
- incident-response
code_lang: python
---

A feature flag (also called a feature toggle) is a runtime switch that turns a behavior on or off without deploying new code. The code for both the old and new path ships together; configuration, not a binary rollout, decides which path users hit.

Flags let teams **decouple deploy from release**: merge and ship dark code, then enable it for staff, a percentage of users, or everyone. They are also a fast incident lever — disable a broken feature without rolling back the whole release.

**Common kinds:**
- **Release flags:** hide unfinished work until it is ready.
- **Ops flags:** kill switches for expensive or risky behavior.
- **Experiment flags:** A/B tests that assign users to variants.
- **Permission flags:** enable a feature for a customer or role.

**Rule of thumb:** treat flags as temporary unless they are true product settings. Long-lived flags accumulate dead branches and make the code harder to reason about. Remove them once the rollout is complete.

```python
def checkout(cart, user, flags):
    if flags.enabled("new_tax_engine", user):
        return new_tax_engine.total(cart, user)
    return legacy_tax.total(cart, user)
```
