---
name: System Prompt
categories:
- ai-assisted-development
tags:
- agentic-ai
- tooling
related:
- prompt-engineering
- ai-coding-agent
- context-window
code_lang: markdown
---

A system prompt is the instructions given to a language model before the conversation begins, setting its role, constraints, and behavior for the whole session. It sits "above" user messages in priority and is typically invisible to the end user.

For coding agents, the system prompt usually defines things like: how to use available tools, when to ask for confirmation before risky actions, output formatting rules, and safety boundaries. Tools like **Claude Code** layer a second, project-specific instructions file — `CLAUDE.md` (Codex uses `AGENTS.md`) — on top of the base system prompt, so a repository can steer the agent's behavior without touching the tool's own configuration.

**Rule of thumb:** put durable, project-wide rules (coding conventions, commands, architecture notes) in the project instructions file; keep one-off task details in the actual prompt you send. Mixing the two makes both harder to maintain.

```markdown
# CLAUDE.md
## Coding Conventions
- Python: type hints on every function signature.
- Never commit directly to `main`.
- Run `pytest` before declaring a task complete.
```
