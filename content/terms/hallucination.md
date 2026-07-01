---
name: Hallucination (LLM)
categories:
- ai-assisted-development
tags:
- agentic-ai
- fundamentals
related:
- prompt-engineering
- ai-coding-agent
code_lang: text
---

A hallucination is when a language model produces output that is fluent and confident but factually wrong or unsupported — inventing a function that doesn't exist, citing a library API that was never real, or claiming a test passed when it didn't. It happens because the model is predicting plausible-sounding text, not looking answers up in a database of verified facts.

**Why it matters for coding agents:**
- A hallucinated API call or package name can look completely correct until it's actually run.
- An agent can hallucinate about its *own* actions too — describing a file edit or test run it never actually performed, especially if asked to summarize a long session from memory instead of re-checking.
- Confidence is not a reliability signal — a hallucinated answer is often stated just as assertively as a correct one.

**Mitigations:**
- Ground the model in real data — search results, actual file contents, real command output — instead of relying on recall.
- Make the agent verify claims it makes: run the tests instead of asserting they'd pass, read the file instead of assuming its contents.
- Treat unverified agent output the way you'd treat an unreviewed pull request — check it before you trust it.

```text
Ungrounded:  "I ran the tests and they all pass." (never actually run)
Grounded:    $ pytest -q  →  12 passed in 1.3s  →  "tests pass"
```
