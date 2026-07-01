---
title: Using Agentic AI to Build Software
subtitle: What tools like Claude Code, Codex, and Cursor actually do under the hood
is_published: true
categories: [ai-assisted-development]
tags: [agentic-ai, tooling, fundamentals]
related_terms: [ai-coding-agent, tool-use, model-context-protocol, context-window, prompt-engineering]
related_articles: [working-effectively-with-ai-coding-agents]
---

A new generation of developer tools — **Claude Code**, **OpenAI Codex**, **Cursor**,
**GitHub Copilot** in agent mode — don't just autocomplete a line of code. Given a
goal in plain English, they read your repository, make a plan, and carry it out:
editing files, running commands, and checking their own work, mostly without you
typing anything but the request.

This article covers what's actually happening when you use one of these tools, so
the rest is less "magic" and more mechanism you can reason about.

## Autocomplete vs. an agent

| | Inline autocomplete | Agentic coding tool |
| --- | --- | --- |
| Unit of work | Next few tokens/lines | A whole task, end to end |
| Sees | The current file | The repo, test output, shell results |
| Acts | Suggests text | Edits files, runs commands, calls tools |
| Supervision | You accept/reject per suggestion | You review a plan and/or diffs |

Autocomplete is reactive — it fills in what you're already typing. An agent is
proactive — it's handed a goal (`ai-coding-agent`) and works toward it across many
steps, deciding what to read, what to change, and how to check its own output.

## The agentic loop

Underneath, every one of these tools runs roughly the same loop:

1. **Read** — the agent inspects relevant files, existing tests, or search results
   to understand the current state.
2. **Plan** — it breaks the goal into steps, sometimes shown to you explicitly as a
   todo list.
3. **Act** — it calls a **tool** (`tool-use`) — edit a file, run a shell command,
   search the web — to make progress on one step.
4. **Observe** — the tool's result (a diff, test output, an error) goes back into
   the model's context, informing the next action.
5. **Repeat** until the goal is met, a step needs your input, or it hits a limit.

Every "action" in that loop is a tool call: the model itself never touches your
filesystem directly. It requests a function call with structured arguments; the
surrounding application decides whether to run it — often after asking your
permission for anything destructive.

```text
you: "fix the failing test in payments/test_refund.py"
  → agent reads the test and the code under test
  → agent forms a plan: reproduce, locate bug, fix, re-run
  → agent edits payments/refund.py
  → agent runs pytest        →  1 passed
  → agent reports back with a summary of the change
```

## What connects an agent to your tools

Early agent integrations were bespoke — a custom connector for every database,
ticket tracker, or API a tool wanted to use. The **Model Context Protocol (MCP)**
standardizes this: an MCP server exposes a system's capabilities in a common
format, and any compliant agent can use it without a custom integration. This is
why the same Claude Code session can, with the right MCP servers configured, read
your Linear board, query a database, and drive a browser — each through the same
protocol rather than three different plugins.

## The budget you're always working within

Everything the model reasons about — your instructions, file contents, tool
output, its own prior reasoning — has to fit in a fixed **context window**
(`context-window`). Long sessions, large files, and verbose tool output (a full
test log, a giant `grep` result) all compete for that same budget. This is the
root cause behind two things every user of these tools eventually notices: agents
that "forget" earlier decisions in a long session, and agents that get slower or
less accurate the more you've asked of them in one sitting.

## Confidence isn't correctness

Language models can produce fluent, confident output that's simply wrong — a
**hallucination** — whether that's an invented API, a mis-remembered file
contents, or a claim that tests passed when they weren't actually run. Nothing
about an agent's tone signals how reliable a given claim is. The practical
consequence: treat agent output the way you'd treat a pull request from a fast,
occasionally overconfident contributor — worth using, always worth checking.

That review habit, and a handful of others that make the difference between an
agent that reliably speeds you up and one that quietly creates work, is the
subject of the companion article on working effectively with these tools.
