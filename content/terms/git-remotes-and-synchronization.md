---
name: Remotes and Synchronization
categories:
- git
tags:
- git
- remotes
- synchronization
related:
- git-setup-help-and-repository-creation
- git-branching-and-switching
- git-merging-rebasing-and-cherry-picking
code_lang: bash
---

A remote is a named repository location. Fetching updates local knowledge of a remote, pulling fetches and integrates, and pushing asks a remote to update its references from local commits.

**Mental model:** A name such as `origin/main` is a local remote-tracking reference updated by fetch. It is not the remote branch itself. Fetching is inspection-friendly; pulling adds an integration step; pushing publishes local history.

| Command | Purpose |
| --- | --- |
| `git remote -v` | List remote names and their fetch/push URLs. |
| `git remote add <name> <url>` | Register another repository location. |
| `git remote get-url <name>` | Show a remote's configured URL. |
| `git remote set-url <name> <url>` | Change a remote's URL. |
| `git remote rename <old> <new>` | Rename a remote and its tracking references. |
| `git remote remove <name>` | Remove a remote and its remote-tracking references. |
| `git fetch <remote>` | Download objects and update remote-tracking references without integrating. |
| `git fetch --all --prune` | Fetch every remote and remove stale remote-tracking references. |
| `git pull --ff-only` | Fetch and update only when the current branch can fast-forward. |
| `git pull --rebase` | Fetch and rebase local commits on the fetched upstream. |
| `git push <remote> <branch>` | Publish a local branch to a remote. |
| `git push -u <remote> <branch>` | Push and record the upstream for later short-form pull/push commands. |
| `git push --tags <remote>` | Push all local tags. |
| `git push --follow-tags <remote>` | Push commits plus reachable annotated tags that are missing remotely. |
| `git push --delete <remote> <branch>` | Delete a remote branch. |
| `git push --force-with-lease` | Replace remote history only if the expected remote value has not changed. |

**Useful habits:**
- Prefer `git fetch` followed by inspection when you are not ready to integrate.
- Use `git branch -vv` to see upstream and ahead/behind information.
- Choose a team policy such as fast-forward-only merges or rebase-on-pull instead of accepting accidental merge commits.

**Safety:**
- `git pull` performs fetch plus integration. Do not use it when you only want to inspect remote work.
- Plain `git push --force` disables important safety checks and can discard remote commits. When rewritten history truly must be published, use `--force-with-lease` and coordinate with collaborators.
- Deleting a remote locally does not delete the repository on a hosting service.

```bash
# Inspect remote work before integrating and publishing
git remote -v
git fetch origin --prune
git log --oneline --graph --decorate HEAD..origin/main
git rebase origin/main
git push -u origin feature/git-glossary

# After an intentional rebase of an already-published branch
git push --force-with-lease origin feature/git-glossary
```
