---
name: Context Engineering
categories:
- ai-assisted-development
tags:
- agentic-ai
- tooling
related:
- context-window
- ai-coding-agent
- prompt-engineering
code_lang: text
---

Context engineering is the practice of deliberately curating what a language model can see — instructions, file contents, tool output, prior decisions — so it has exactly the information it needs to do a task well, and nothing that distracts it. It's a broader discipline than **prompt engineering**: prompt engineering shapes a single message, while context engineering manages an agent's entire working memory across a multi-step task.

**Common techniques:**
- **Retrieval** — pull in only the files or docs relevant to the current step, rather than the whole repository.
- **Summarization / compaction** — condense finished sub-tasks into a short summary once their detail is no longer needed.
- **Structured instructions** — persistent project rules (e.g. `CLAUDE.md`, `AGENTS.md`) instead of repeating conventions in every prompt.
- **Sub-agents** — hand a self-contained chunk of work to a separate agent with its own clean context, so the parent isn't cluttered with intermediate exploration.

**Rule of thumb:** if an agent starts making mistakes on a long task, suspect the context before the model — irrelevant or stale information crowding the window is a more common cause than the model "not being smart enough."

```text
Poor context: entire repo dumped into every prompt, full raw test logs kept forever
Good context: relevant files only, failing tests summarized, old sub-tasks compacted
```
