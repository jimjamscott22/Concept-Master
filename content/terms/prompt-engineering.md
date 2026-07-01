---
name: Prompt Engineering
categories:
- ai-assisted-development
tags:
- agentic-ai
- fundamentals
related:
- system-prompt
- context-engineering
- hallucination
code_lang: text
---

Prompt engineering is the practice of writing and structuring input to a language model to reliably get the output you want. It covers wording, examples, formatting, and how much context or constraint to include in a single request.

**Techniques that generalize well:**
- **Be specific about the goal and constraints** — "add a test" is weaker than "add a pytest unit test covering the empty-input case."
- **Show, don't just tell** — a short example of the desired output format is often worth several sentences of description.
- **Break large asks into steps** — a vague, sprawling request produces a vague, sprawling result; a scoped one produces a scoped result.
- **State what "done" looks like** — for coding agents, this might mean "and make sure the test suite passes."

**vs. context engineering:** prompt engineering optimizes one message; context engineering manages everything the model sees across an entire task. In agentic coding, both matter, but context engineering tends to dominate for long or multi-step work.

```text
Weak:   "fix the bug"
Better: "the /login endpoint returns 500 when the password field is
         missing; it should return a 400 with a validation error"
```
