---
title: Setting Up Your Optimal Codex Environment
subtitle: A practical Windows-first workspace for learning, building, and verifying software
is_published: true
categories: [ai-assisted-development]
tags: [codex, agentic-ai, tooling, workflow]
related_terms: [ai-coding-agent, context-engineering, model-context-protocol, prompt-engineering, tool-use, context-window]
related_articles: [using-agentic-ai-to-build-software, working-effectively-with-ai-coding-agents]
---

An optimal Codex setup is not the one with the most tools or the broadest
permissions. It is the one that gives Codex the right context, lets it perform
routine work safely, and makes the result easy for you to verify.

This guide is designed for a hands-on learner and solo builder working on
several web projects—often React on the frontend, Python on the backend, Git for
version control, and Windows as the daily development machine. The same design
works for a team, but the emphasis here is on a setup one person can understand
and maintain.

## The environment has five layers

Think of your Codex environment as a stack. Each layer has one job:

| Layer | What belongs there |
| --- | --- |
| Machine | Git, PowerShell or WSL2, language runtimes, package managers |
| Personal Codex settings | Your default permissions, reasoning level, and cross-project preferences |
| Repository guidance | `AGENTS.md`, project docs, commands, conventions, and definitions of done |
| Reusable capabilities | Skills for repeatable procedures; plugins and MCP for external systems |
| Verification | Tests, linting, type checks, builds, diffs, and human review |

Start at the top of this table and move downward. A connector cannot compensate
for a repository that does not say how to run its tests, and a detailed prompt
cannot compensate for a development environment that cannot build the project.

## 1. Make each repository reproducible first

Codex uses the same tools your project uses. Before optimizing Codex itself,
make sure a fresh terminal can perform the project's normal workflow.

For a React and Python project, that usually means:

- Git is installed and the project is a real Git repository.
- Node.js and the package manager named by the project are on `PATH`.
- Python projects declare their dependencies and use an isolated environment.
- The README or `docs/` folder explains how to start each service.
- Build, lint, type-check, and test commands work without hidden manual steps.
- Secrets live in ignored environment files or a secret manager, never in
  prompts, source files, or `AGENTS.md`.

On Windows, native PowerShell is a good default when that is where you actually
develop. Use WSL2 when a project depends heavily on Linux tooling, but avoid
maintaining two subtly different setups for the same repository unless you need
both. Codex can use the native Windows sandbox in PowerShell and the Linux
sandbox inside WSL2.

## 2. Set conservative personal defaults

Codex reads personal settings from `~/.codex/config.toml`. In Windows,
`~` refers to your user home directory. The desktop app, CLI, and IDE extension
share these configuration layers, so a small set of defaults can make all three
surfaces behave consistently.

This is a sensible starting point for local development:

```toml
approval_policy = "on-request"
sandbox_mode = "workspace-write"
model_reasoning_effort = "high"

[windows]
sandbox = "elevated"
```

`workspace-write` lets Codex edit the active project while keeping the rest of
the machine outside its normal write boundary. `on-request` means Codex can ask
before crossing that boundary. The elevated Windows sandbox is the recommended
native implementation; `unelevated` is the fallback when elevated setup is not
available.

Notice that the example does **not** pin a model. Leaving the model choice to the
current product default is a good general setup. Pin one only when you have a
measured reason—such as a stable evaluation, a cost constraint, or a specialized
workflow—and revisit that choice as models change.

Use a repository-level `.codex/config.toml` only for settings that really belong
to that project. Codex loads project configuration only for repositories you
trust, and a setting closer to the current working directory takes precedence.

## 3. Give every project a concise `AGENTS.md`

`AGENTS.md` is the durable operating guide Codex reads before working in a
repository. It should describe facts and rules that apply repeatedly—not the
details of today's task.

A useful file for a small full-stack project might look like this:

```markdown
# Project guide

- `frontend/` is React; `backend/` is Python; project notes live in `docs/`.
- Install and run each app using the commands in `docs/local-development.md`.
- Run the frontend build and backend tests after relevant changes.
- Preserve existing user changes and do not commit or push unless asked.
- Prefer small, focused modules over large files.
- After implementation, add a short summary under `docs/`.
- Work is done only when the requested behavior is implemented and the
  relevant checks pass.
```

Keep the root file short. Put detailed architecture, setup instructions, and
future plans in `docs/`, then point Codex to the relevant files. Add nested
`AGENTS.md` files only when a subdirectory genuinely needs different rules.

The best time to add a rule is after a pattern repeats. If Codex guesses the
wrong test command twice, update the guidance. If it repeatedly reads the wrong
folder, add a routing note. This turns real friction into better future sessions
without filling the context window with speculative rules.

## 4. Use the right Codex surface for the task

There is no need to choose one surface forever:

- **Desktop app:** best as the main workspace for planning, inspecting diffs,
  managing several tasks, and working with browser or desktop capabilities.
- **IDE extension:** best when the work is tightly connected to the files you
  are already editing.
- **CLI:** best for terminal-first work, quick repository tasks, and scripted or
  non-interactive runs.
- **Cloud tasks:** best for work you want to offload in an isolated environment,
  especially when the repository has a documented setup script and checks.

Whichever surface you use, open the correct repository as the workspace. The
wrong working directory is a surprisingly common cause of missing guidance,
incorrect commands, and edits in the wrong project.

## 5. Connect tools in a deliberate order

Codex can be extended in several ways, but they solve different problems:

1. Use `AGENTS.md` for rules Codex should follow in one repository.
2. Install a **plugin** when a proven reusable workflow or integration already
   exists.
3. Create a **skill** when you repeat a procedure that needs instructions,
   examples, references, or helper scripts.
4. Add **MCP** when Codex needs live access to an external system such as GitHub,
   Figma, documentation, an issue tracker, or an internal service.
5. Add an **automation** only after the workflow is predictable enough to run on
   a schedule without constant supervision.

For a web-development learner, current library documentation is especially
valuable. A documentation connector can keep React, Python, framework, and SDK
answers grounded in the versions you are actually using. GitHub access becomes
useful when you want Codex to inspect issues, checks, pull requests, or review
feedback. Add each capability because it closes a recurring gap, not because it
is available.

Keep external access narrow. Prefer read-only tools until a workflow truly needs
write actions, and review any tool that can create issues, send messages, modify
cloud data, or publish code.

## 6. Use a repeatable prompt shape

Your environment carries durable context, but the task prompt still needs to
say what should happen now. A strong default has four parts:

```text
Goal: Add filtering to the article list.
Context: Start with ArticleList.tsx and the articles API route.
Constraints: Preserve the existing visual style and URL behavior.
Done when: Category and tag filters work, relevant tests pass, and the
implementation summary is added to docs/.
```

Use Plan mode when the goal is ambiguous, crosses several systems, or involves
an important design choice. For a narrow change with an obvious implementation,
go directly to the task. Start a fresh task when the subject changes
substantially; unrelated history consumes context without helping the work.

## 7. Make verification part of the environment

The strongest setup is one where correctness is cheap to check. Give Codex exact
commands and ask it to report what actually ran:

```text
Frontend: npm run lint && npm run build
Backend:  run the project's test command
Review:   inspect git diff and git status
```

Do not treat a polished final message as evidence. Read the diff, look for
unexpected files, and confirm the relevant checks. Use a branch or worktree for
larger experiments so the main working copy stays easy to recover.

A practical definition of done is:

- the requested behavior exists;
- focused tests cover important logic;
- lint, type checks, tests, and builds pass where relevant;
- the diff contains no secrets or unrelated edits;
- documentation changed when behavior or setup changed;
- you understand the result well enough to maintain it.

That last point matters for learning. Ask Codex to explain one design decision,
trace the data flow, or compare the chosen approach with one alternative. The
goal is not only to produce more code—it is to leave you with a clearer mental
model of the system.

## A good first-week rollout

Avoid rebuilding your whole workflow at once. Introduce the environment in this
order:

1. Confirm every active repository has reliable setup and verification commands.
2. Add a short, accurate `AGENTS.md` to each repository.
3. Set `workspace-write` and `on-request` as personal defaults.
4. Practice the goal/context/constraints/done-when prompt format.
5. Review every diff and rerun important checks yourself.
6. Add one plugin, skill, or MCP connection only when you can name the repeated
   problem it will solve.
7. Revisit the setup monthly and remove stale guidance.

The result is intentionally modest: Codex knows how you work, stays inside a
clear boundary, can reach the tools you actually use, and has an objective way
to prove that a task is finished. That is a better environment than a highly
automated one you cannot easily inspect or trust.

## Further reading

- [Codex best practices](https://learn.chatgpt.com/guides/best-practices)
- [Config basics](https://learn.chatgpt.com/docs/config-file/config-basic)
- [Custom instructions with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Sandboxing and approvals](https://learn.chatgpt.com/docs/sandboxing)
- [Codex customization](https://learn.chatgpt.com/docs/customization/overview)

