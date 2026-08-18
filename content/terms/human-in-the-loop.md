---
name: Human-in-the-Loop
categories:
- ai-assisted-development
tags:
- agentic-ai
- tooling
related:
- ai-coding-agent
- hallucination
- tool-use
code_lang: bash
---

Human-in-the-loop (HITL) means a person stays in the decision path for actions that are risky, irreversible, or hard to verify automatically. The model proposes; a human approves, edits, or rejects before the system continues.

In coding agents this shows up as permission prompts for `git push`, deleting files, running unknown shell commands, or applying a large diff. The agent still does the mechanical work — search, draft, test — but a person owns the merge.

**Why it matters:** tool-using models can be fluent and wrong. HITL is a control, not a lack of automation. You tighten the loop (auto-approve tests, require approval for deploys) based on blast radius.

**Spectrum:**
- **Fully supervised:** every tool call waits.
- **Policy gated:** safe tools run; destructive ones wait.
- **Review after the fact:** the agent acts, then a human reviews the PR.

**Rule of thumb:** if you would not let a new intern do it unsupervised, do not let the agent do it unsupervised.

```bash
# Typical HITL gate in an agent session
$ claude "reset the production database to last night's backup"
# Agent plans the command, then waits:
#   Allow: pg_restore --clean ... ?  [y/N]
```
