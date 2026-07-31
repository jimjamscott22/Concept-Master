---
name: Undoing, Restoring, and Cleaning Up
categories:
- git
tags:
- git
- recovery
- cleanup
related:
- git-inspecting-and-comparing-changes
- git-staging-and-committing
- git-history-search-and-debugging
code_lang: bash
---

Git has different undo tools because "undo" can mean restoring a file, moving a local branch, recording a new inverse commit, recovering an old reference, or removing untracked files.

**Mental model:** Choose the narrowest tool that matches the state you want to change. `restore` changes file content, `reset` moves a branch and optionally changes the index or working tree, `revert` adds inverse history, `reflog` finds previous reference values, and `clean` removes untracked files.

| Command | Purpose |
| --- | --- |
| `git restore <path>` | Replace an unstaged working-tree path with its index version. |
| `git restore --staged <path>` | Reset an index path to `HEAD` without changing the working file. |
| `git restore --source <commit> <path>` | Restore a path from another commit. |
| `git reset --soft <commit>` | Move the current branch while leaving the index and working tree unchanged. |
| `git reset [--mixed] <commit>` | Move the branch and reset the index; keep working-tree changes. |
| `git reset --hard <commit>` | Move the branch and make tracked files match the commit. |
| `git revert <commit>` | Create a new commit that reverses one earlier commit. |
| `git revert -m <parent> <merge-commit>` | Revert a merge relative to the selected mainline parent. |
| `git revert --no-commit <range>` | Apply inverse changes to the index and working tree without committing yet. |
| `git reflog` | Show recent values of `HEAD` and other local references. |
| `git branch <recovery-name> <reflog-entry>` | Preserve a recovered commit under a new branch name. |
| `git clean -n` | Preview untracked files that would be removed. |
| `git clean -nd` | Preview untracked files and directories. |
| `git clean -f` / `git clean -fd` | Remove previewed untracked files, optionally including directories. |
| `git clean -fdx` | Remove untracked and ignored files and directories. |

**Safe decision guide:**
- To unstage: `git restore --staged <path>`.
- To discard one unstaged file: inspect it, then `git restore <path>`.
- To undo a published commit: use `git revert`.
- To revise unpublished local commits: choose the appropriate `git reset` mode or interactive rebase.
- To recover a lost branch tip: inspect `git reflog`, then create a recovery branch before changing anything else.

**Safety:**
- `git reset --hard` discards tracked working-tree and index changes. It can also make commits unreachable.
- `git clean` targets untracked content that normal commit history cannot restore. Always run the matching `-n` dry run first.
- `git clean -fdx` also removes ignored build artifacts, caches, local configuration, and other ignored files.
- Reverting a merge requires the correct mainline parent; inspect the merge before using `-m`.

```bash
# Recover a branch tip after an accidental hard reset
git reflog
git show HEAD@{1}
git branch recovery/accidental-reset HEAD@{1}

# Preview cleanup before deleting any untracked content
git clean -nd
# Only after reviewing the preview:
git clean -fd
```
