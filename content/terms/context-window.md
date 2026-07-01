---
name: Context Window
categories:
- ai-assisted-development
tags:
- agentic-ai
- fundamentals
related:
- ai-coding-agent
- context-engineering
- prompt-engineering
code_lang: text
---

The context window is the maximum amount of text — measured in **tokens**, not characters or words — that a language model can "see" at once when generating a response. It includes the system prompt, conversation history, file contents, tool output, and the model's own prior output in the current turn.

Everything the model reasons about has to fit in this window. When a conversation or task grows past it, the oldest or least relevant content has to be dropped, summarized, or compacted — which is why long agentic sessions can lose track of earlier decisions.

**Why it matters for coding agents:**
- Large files, verbose tool output (e.g. full test logs), and long back-and-forth all compete for the same budget.
- Agents that read a whole repository must be selective — searching and quoting relevant snippets — rather than loading everything.
- A model can hit the "needle in a haystack" problem: technically in-context information gets less attention the more unrelated text surrounds it.

**Rule of thumb:** keep an agent's working context lean and relevant — closing finished sub-tasks, summarizing long output, and re-reading only what's needed — rather than relying on the window to hold everything indefinitely.

```text
[ system prompt ][ project instructions ][ conversation history ]
[ file contents read so far ][ tool call results ][ model output ]
                                                        ^
                                          budget shrinks as this grows
```
