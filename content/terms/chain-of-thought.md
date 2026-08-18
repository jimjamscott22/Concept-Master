---
name: Chain of Thought
categories:
- ai-assisted-development
tags:
- agentic-ai
- fundamentals
related:
- ai-coding-agent
- prompt-engineering
code_lang: text
---

Chain of thought (CoT) is a prompting and decoding style where the model writes intermediate reasoning steps before the final answer, instead of jumping straight to a conclusion.

Asking the model to "think step by step" — or providing a few worked examples that show the reasoning — often improves multi-step math, debugging, and planning. Many coding agents keep a hidden or visible scratchpad that is the same idea: plan, then act.

**What it is not:** a guarantee of truth. The written steps can still be wrong, post-hoc, or confidently invented. Treat CoT as a *trace you can inspect*, not as a proof.

**Related ideas:**
- **Few-shot CoT:** show example problems with worked steps.
- **Tool-using agents:** the "thought" is often a plan, then a tool call, then observation — a loop rather than one long monologue.

```text
Prompt: "The test fails with IndexError on line 42. Think step by step,
then propose a one-line fix."

Useful CoT: identify the list, when it is empty, which call indexes it,
then name the guard to add.
Unhelpful CoT: a long story that never names the failing expression.
```
