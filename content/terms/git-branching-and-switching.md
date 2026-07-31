---
name: Branching and Switching
categories:
- git
tags:
- git
- branches
- workflow
related:
- git-staging-and-committing
- git-merging-rebasing-and-cherry-picking
- git-remotes-and-synchronization
code_lang: bash
---

A branch is a movable name for a commit. Branching creates an independent line of work; switching updates `HEAD`, the index, and the working tree to another branch.

**Mental model:** Creating a branch is cheap because Git initially creates only a new reference. New commits move the currently checked-out branch forward. `git switch` is the focused modern command for changing branches; older material often uses `git checkout`.

| Command | Purpose |
| --- | --- |
| `git branch` | List local branches; the current branch is marked with `*`. |
| `git branch --all` | List local and remote-tracking branches. |
| `git branch -vv` | Show each local branch's tip and upstream tracking status. |
| `git branch <name> [<start-point>]` | Create a branch without switching to it. |
| `git switch <name>` | Switch to an existing branch. |
| `git switch -c <name> [<start-point>]` | Create a branch and switch to it. |
| `git switch -` | Return to the previously checked-out branch. |
| `git branch -m <new-name>` | Rename the current branch. |
| `git branch -d <name>` | Delete a fully merged local branch. |
| `git branch -D <name>` | Force-delete a local branch even when it is not merged. |
| `git branch --merged` | List branches already merged into the current commit. |
| `git checkout <branch>` | Older, broader equivalent for switching branches. |
| `git checkout -b <name>` | Older equivalent of `git switch -c <name>`. |

Git normally refuses a switch that would overwrite local changes. Commit, stash, or deliberately resolve those changes instead of forcing the switch.

**Safety:**
- Prefer `git branch -d` to `-D`; the safe form checks whether work is merged.
- A deleted branch name may be recoverable through `git reflog`, but recovery is easier before reflog entries expire.
- Do not reuse a branch name just to hide that its previous history was rewritten.

```bash
# Create a focused branch, work on it, and return to main
git switch main
git switch -c feature/git-glossary
git branch -vv

# After the feature is merged
git switch main
git branch --merged
git branch -d feature/git-glossary
```
