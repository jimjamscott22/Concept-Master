---
name: Inspecting and Comparing Changes
categories:
- git
tags:
- git
- inspection
- diff
related:
- git-staging-and-committing
- git-history-search-and-debugging
- git-undoing-restoring-and-cleaning-up
code_lang: bash
---

Inspection commands answer two questions before you change history: **what state is the repository in, and what content differs between two states?**

**Mental model:** A normal workflow has three important snapshots: the working tree on disk, the index (staging area), and `HEAD` (the current commit). Different `git diff` forms compare different pairs.

| Command | Purpose |
| --- | --- |
| `git status` | Explain the current branch, staged changes, unstaged changes, and untracked files. |
| `git status --short` | Show the same state in a compact two-column format. |
| `git status --short --branch` | Add branch and upstream information to compact status output. |
| `git diff` | Compare the working tree with the index; this shows unstaged tracked changes. |
| `git diff --staged` | Compare the index with `HEAD`; this shows what the next commit would contain. |
| `git diff HEAD` | Compare the working tree and index together against `HEAD`. |
| `git diff --stat` | Summarize changed files and line counts instead of showing every patch. |
| `git diff <base>...<branch>` | Compare a branch with the point where it diverged from a base branch. |
| `git show <object>` | Display a commit, tag, or other object with its metadata and patch. |
| `git show --stat <commit>` | Summarize the files changed by one commit. |

The two columns in `git status --short` describe index state first and working-tree state second. For example, `M ` means staged modification, ` M` means unstaged modification, and `MM` means both versions differ.

**Useful habits:**
- Run `git status --short --branch` before starting work and before committing.
- Review both `git diff` and `git diff --staged`; they answer different questions.
- Use the three-dot comparison when reviewing all work introduced by a topic branch.

**Common pitfalls:**
- Untracked file contents do not appear in a normal `git diff` until the files are staged.
- `git show` defaults to `HEAD`; name the object explicitly when precision matters.
- A clean working tree does not mean the branch is synchronized with its remote.

```bash
# Review every layer before committing
git status --short --branch
git diff
git add src/parser.py
git diff --staged
git show --stat HEAD
git diff main...HEAD
```
