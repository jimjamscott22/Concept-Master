---
name: Stashing and Worktrees
categories:
- git
tags:
- git
- stash
- worktree
related:
- git-branching-and-switching
- git-inspecting-and-comparing-changes
- git-undoing-restoring-and-cleaning-up
code_lang: bash
---

Stashes temporarily store uncommitted changes. Worktrees attach additional working directories to one repository so multiple branches can remain checked out at the same time.

**Mental model:** A stash is a stack of commit-like snapshots referenced as `stash@{0}`, `stash@{1}`, and so on. A linked worktree shares the repository's object database but has its own checked-out branch, index, and working files.

| Command | Purpose |
| --- | --- |
| `git stash push -m "message"` | Stash tracked changes with a descriptive label. |
| `git stash push -u` | Include untracked files as well as tracked changes. |
| `git stash push -p` | Interactively choose hunks to stash. |
| `git stash list` | List saved stashes. |
| `git stash show -p [<stash>]` | Inspect the patch stored in a stash. |
| `git stash apply [<stash>]` | Reapply a stash while keeping it in the stash list. |
| `git stash pop [<stash>]` | Reapply a stash and drop it if application succeeds. |
| `git stash drop <stash>` | Delete one stash entry. |
| `git stash clear` | Delete all stash entries. |
| `git stash branch <branch> [<stash>]` | Create a branch at the stash's original base and apply it there. |
| `git worktree list` | List the primary and linked worktrees. |
| `git worktree add <path> -b <branch> [<start-point>]` | Create a new branch in another working directory. |
| `git worktree add <path> <branch>` | Check out an existing available branch in another worktree. |
| `git worktree remove <path>` | Remove a clean linked worktree. |
| `git worktree prune` | Remove stale administrative records for missing worktrees. |

**Choosing between them:**
- Use a stash for a short interruption when you want the same directory back afterward.
- Use a worktree when two tasks need to stay available, run concurrently, or use separate build artifacts.

**Safety:**
- Name stashes and inspect them before `drop` or `clear`.
- `pop` can produce conflicts; the stash is normally kept when it cannot be applied cleanly.
- Git usually prevents the same branch from being checked out in two worktrees.
- Use `git worktree remove` rather than manually deleting a linked directory so Git can clean up its metadata.

```bash
# Keep the current task intact while handling a second branch
git stash push -u -m "WIP glossary edits"
git worktree add ../concept-master-hotfix -b hotfix/parser main
git worktree list

# Later, return to the original worktree
git stash list
git stash show -p stash@{0}
git stash apply stash@{0}
```
