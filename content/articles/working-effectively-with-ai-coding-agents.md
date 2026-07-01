---
title: Working Effectively with AI Coding Agents
subtitle: Context hygiene, verification, and staying in the loop
is_published: true
categories: [ai-assisted-development]
tags: [agentic-ai, tooling, interview-prep]
related_terms: [context-engineering, prompt-engineering, hallucination, system-prompt, tool-use]
related_articles: [using-agentic-ai-to-build-software]
---

The companion article covers *what* tools like Claude Code, Codex, and Cursor are
doing under the hood. This one is about *how* to work with them so they're
consistently useful instead of occasionally impressive — the habits that separate
"this agent saved me an hour" from "I spent longer fixing what it did than doing
it myself."

## Scope the task, not just the goal

An agent given "improve the error handling" will wander — it has to guess at
scope, and it will guess wrong at least some of the time. An agent given "add a
400 response with a validation message when `/signup` is called with a missing
email" has a concrete, checkable target. This isn't unique to AI — it's the same
reason a well-scoped ticket beats a vague one for a human engineer — but agents
lack a colleague's shared context to fill the gaps, so the effect is larger.

**Rule of thumb:** if you can't describe what "done" looks like in one sentence,
the agent probably can't either.

## Give it durable context once, not every time

Repeating the same conventions in every prompt — "use type hints," "we use raw
SQL, no ORM," "run the tests before you're done" — wastes your time and the
model's context budget. Most agentic tools support a persistent instructions file
(`system-prompt`) read at the start of every session — `CLAUDE.md` for Claude
Code, `AGENTS.md` for Codex and several other tools. Put project-wide rules there;
keep prompts focused on the specific task.

```markdown
# CLAUDE.md
- Backend: Python 3.12, FastAPI, raw SQL via aiomysql — no ORM.
- Run `pytest` before declaring any task complete.
- Never commit directly to main.
```

This is **context engineering** in practice: deliberately deciding what the model
should always see versus what belongs in a one-off request.

## Don't let context rot over a long session

The longer a session runs, the more of its context window fills with finished
work — old file reads, superseded plans, verbose command output. Left unmanaged,
this crowds out room for the current task and can make an agent less accurate,
not more capable, the longer you talk to it. A few concrete habits help:

- Start a fresh session for a genuinely new task rather than tacking it onto an
  unrelated, already-long conversation.
- Ask the agent to summarize or "compact" a finished sub-task instead of leaving
  its full exploration in context.
- Point it at specific files or search terms instead of asking it to read an
  entire large codebase up front.

## Treat permissions as a real decision, not a formality

Most agentic tools ask before running commands that write, delete, or push.
Auto-approving everything trades safety for speed — sometimes the right trade for
a low-stakes prototype, rarely the right default for anything touching production
data, secrets, or a shared branch. Know what mode you're in before you start a
session, not after an unwanted command has already run.

| Situation | Reasonable default |
| --- | --- |
| Local prototype, disposable branch | Broad auto-approval is fine |
| Shared repo, main branch | Review before commit/push |
| Anything touching prod data or secrets | Manual approval, every time |

## Verify — don't just review the summary

An agent's own account of what it did is, itself, model output — and subject to
the same **hallucination** risk as anything else it produces. It can describe
running a test suite it never ran, or summarize a diff slightly differently than
what actually changed. Two verification habits catch almost everything:

- **Read the diff**, not just the prose summary of the diff.
- **Re-run the check yourself** — the test suite, the linter, the build — rather
  than trusting a claim that it already passed.

```text
Agent says: "I added the test and confirmed it passes."
You run:    $ pytest -q  →  confirm independently, every time
```

## The pattern underneath all of this

Every one of these habits — scoping tasks, curating context, treating permissions
deliberately, verifying instead of trusting — comes down to the same idea: an
agent is a fast, capable collaborator with no real stake in the outcome and no
memory beyond what's in its context window. Manage it the way you'd manage any
new team member doing unsupervised work: clear tasks, the right information, and
a review step before anything ships.
