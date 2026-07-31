---
name: Merging, Rebasing, and Cherry-Picking
categories:
- git
tags:
- git
- merge
- rebase
related:
- git-branching-and-switching
- git-remotes-and-synchronization
- git-undoing-restoring-and-cleaning-up
code_lang: bash
---

These commands integrate commits. Merging joins histories, rebasing replays commits onto a new base, and cherry-picking copies selected commits onto the current branch.

**Mental model:** A merge usually preserves the existing commit graph. A rebase and a cherry-pick create new commits with new IDs, even when the file changes are equivalent.

| Command | Purpose |
| --- | --- |
| `git merge <branch>` | Integrate another branch into the current branch. |
| `git merge --no-ff <branch>` | Create a merge commit even when a fast-forward is possible. |
| `git merge --squash <branch>` | Stage the branch's combined changes without creating a merge commit. |
| `git merge --continue` | Finish a merge after conflicts are resolved and staged. |
| `git merge --abort` | Restore the pre-merge state when possible. |
| `git rebase <new-base>` | Replay the current branch's unique commits on a new base. |
| `git rebase -i <upstream>` | Reorder, edit, squash, or drop local commits interactively. |
| `git rebase --onto <new-base> <old-base> [<branch>]` | Move a selected commit range to a different base. |
| `git rebase --continue` | Continue after resolving and staging conflicts. |
| `git rebase --skip` | Omit the current patch and continue. |
| `git rebase --abort` | Return the branch to its state before the rebase. |
| `git cherry-pick <commit>` | Apply one existing commit as a new commit on the current branch. |
| `git cherry-pick -x <commit>` | Add the source commit ID to the new commit message. |
| `git cherry-pick -n <commit>` | Apply changes to the index and working tree without committing. |
| `git cherry-pick --continue` / `--abort` | Continue or cancel a conflicted cherry-pick sequence. |

**Conflict workflow:** inspect `git status`, edit each conflicted file, stage resolved files with `git add`, then run the operation's `--continue`. Use `--abort` when the integration should be abandoned.

**Safety:**
- Do not casually rebase commits that other people have based work on.
- A squash merge records one combined commit and does not preserve individual topic commits as ancestors.
- `--skip` permanently omits the current rebase patch; inspect it before choosing to skip.

```bash
# Refresh a local topic branch, then merge it with an explicit merge commit
git switch feature/git-glossary
git fetch origin
git rebase origin/main

# If conflicts occur: edit files, then
git add content/terms
git rebase --continue

git switch main
git merge --no-ff feature/git-glossary
```
