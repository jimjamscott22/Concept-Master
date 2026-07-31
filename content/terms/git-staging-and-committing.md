---
name: Staging and Committing
categories:
- git
tags:
- git
- staging
- commits
related:
- git-inspecting-and-comparing-changes
- git-branching-and-switching
- git-undoing-restoring-and-cleaning-up
code_lang: bash
---

Staging chooses the exact content for the next snapshot; committing records that staged snapshot in the current branch's history.

**Mental model:** `git add` copies content into the index. `git commit` turns the index into a new commit and advances the current branch name to that commit. A commit contains the complete project snapshot, its parent commit, author information, and a message.

| Command | Purpose |
| --- | --- |
| `git add <path>` | Stage the current content of a file or directory. |
| `git add -p` | Interactively stage selected hunks instead of whole files. |
| `git add -A` | Stage additions, modifications, and deletions across the repository. |
| `git add -u` | Stage changes to already tracked files, including deletions. |
| `git restore --staged <path>` | Unstage a path while keeping its working-tree changes. |
| `git commit` | Commit the index and open the configured message editor. |
| `git commit -m "message"` | Commit with a message supplied on the command line. |
| `git commit -a` | Stage modified and deleted tracked files, then commit; untracked files are not included. |
| `git commit --amend` | Replace the latest commit with the current index and/or a new message. |
| `git commit --fixup <commit>` | Create a fixup commit intended for a later autosquash rebase. |

**Useful habits:**
- Build small, coherent commits that explain one change.
- Review `git diff --staged` immediately before committing.
- Write messages that explain intent, not just the filenames that changed.

**Safety:**
- `git commit --amend` creates a new commit ID. Avoid amending a commit that collaborators may already use.
- `git commit -a` does not include untracked files.
- Staging is reversible; `git restore --staged` does not discard the working copy.

```bash
# Build one focused commit
git status --short
git add -p
git diff --staged
git commit -m "fix: preserve parser token boundaries"

# Correct the latest local commit without losing working-tree changes
git add tests/test_parser.py
git commit --amend --no-edit
```
