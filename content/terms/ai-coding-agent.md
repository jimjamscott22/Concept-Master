---
name: AI Coding Agent
categories:
- ai-assisted-development
tags:
- agentic-ai
- tooling
- automation
related:
- tool-use
- context-window
- model-context-protocol
- prompt-engineering
code_lang: bash
---

An AI coding agent is a large-language-model-driven tool that can read a codebase, plan a sequence of actions, and carry them out with minimal supervision — running shell commands, editing files, and calling external tools — rather than just returning a text suggestion. **Claude Code**, **OpenAI Codex**, **Cursor**, and **GitHub Copilot** (agent mode) are current examples.

**What makes it "agentic":**
- It observes real state — file contents, test output, error messages — instead of guessing.
- It plans multi-step work and revises the plan as new information comes in.
- It calls **tools** (shell, file edit, search, browser) to act on the world, not just chat.
- It loops — act, observe the result, decide the next action — until the task is done or it needs input.

**vs. autocomplete-style AI:** inline completion predicts the next few tokens as you type; an agent is handed a goal and works toward it across many steps on its own.

**Rule of thumb:** the more autonomy you grant an agent — auto-approving commands, letting it push code — the more you need guardrails (sandboxing, permission prompts, code review) to catch mistakes before they matter.

```bash
# A typical agentic loop, driven from the terminal
$ claude "add input validation to the signup form and add a test for it"
# the agent reads the relevant files, writes the change, runs the test
# suite, and reports back — asking permission before risky actions
```
