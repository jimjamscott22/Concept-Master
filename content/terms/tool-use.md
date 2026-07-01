---
name: Tool Use (Function Calling)
categories:
- ai-assisted-development
tags:
- agentic-ai
- tooling
- api
related:
- ai-coding-agent
- model-context-protocol
- json
code_lang: json
---

Tool use — also called function calling — is a model capability where the LLM can request that a specific, developer-defined function be run, with structured arguments, instead of only producing free-form text. The calling application executes the function and feeds the result back to the model, which continues reasoning with that new information.

This is the mechanism that turns a chat model into an agent: every "action" a coding agent takes — reading a file, running a shell command, editing code, searching the web — is a tool call under the hood. The model doesn't execute anything itself; it only requests a call, and the surrounding application decides whether to run it, often after a permission check.

**Anatomy of a tool call:**
- **Name** — which registered tool to invoke (e.g. `read_file`).
- **Schema** — the JSON structure the model must fill in (parameters, types).
- **Result** — the tool's output, appended back into context for the next step.

**Rule of thumb:** give each tool a narrow, single-purpose job with a clear schema and description — vague or overlapping tools make the model more likely to pick the wrong one.

```json
{
  "name": "read_file",
  "description": "Read the contents of a file at the given path.",
  "parameters": {
    "type": "object",
    "properties": {
      "path": { "type": "string" }
    },
    "required": ["path"]
  }
}
```
