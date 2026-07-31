---
name: Tags and Releases
categories:
- git
tags:
- git
- tags
- releases
related:
- git-history-search-and-debugging
- git-remotes-and-synchronization
- git-undoing-restoring-and-cleaning-up
code_lang: bash
---

A tag gives a stable name to one Git object, usually a release commit. Unlike a branch, a tag is not expected to move as new commits are created.

**Mental model:** A lightweight tag is a direct reference. An annotated tag is a full Git object containing a tagger, date, message, and optional signature. Annotated tags are usually the better release marker.

| Command | Purpose |
| --- | --- |
| `git tag` | List local tags. |
| `git tag --list "v1.*"` | List tags matching a shell-style pattern. |
| `git tag --sort=-version:refname` | Sort version-like tag names from newest to oldest. |
| `git tag <name> [<commit>]` | Create a lightweight tag. |
| `git tag -a <name> -m "message" [<commit>]` | Create an annotated tag. |
| `git tag -s <name> -m "message" [<commit>]` | Create a cryptographically signed annotated tag. |
| `git show <tag>` | Show tag metadata and the referenced object. |
| `git tag -v <tag>` | Verify a signed tag. |
| `git push <remote> <tag>` | Publish one tag. |
| `git push <remote> --tags` | Publish all local tags missing from the remote. |
| `git push <remote> --follow-tags` | Push commits and reachable annotated tags. |
| `git tag -d <tag>` | Delete a local tag. |
| `git push --delete <remote> <tag>` | Delete a remote tag. |

**Useful habits:**
- Use a consistent scheme such as semantic versions: `v2.3.1`.
- Tag the exact tested commit and inspect it with `git show` before publishing.
- Push a specific release tag when you do not intend to publish every local tag.

**Safety:**
- Tags are local until explicitly pushed.
- Moving or recreating a published tag can leave collaborators with different objects under the same name. Prefer a new version tag.
- Signing proves that the holder of a signing key created the tag; it does not prove that the release is safe.

```bash
# Create, inspect, and publish an annotated release tag
git switch main
git pull --ff-only
git tag -a v2.0.0 -m "Concept Master 2.0.0"
git show v2.0.0
git push origin v2.0.0
```
