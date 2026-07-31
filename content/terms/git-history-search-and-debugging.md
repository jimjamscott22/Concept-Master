---
name: History, Search, and Debugging
categories:
- git
tags:
- git
- history
- debugging
related:
- git-inspecting-and-comparing-changes
- git-tags-and-releases
- git-undoing-restoring-and-cleaning-up
code_lang: bash
---

History tools explore how a repository changed, search tracked content and patches, attribute lines, and locate the commit that introduced a regression.

**Mental model:** Most Git history commands accept a revision range and optional path filter. Start broad, then narrow by branch, date, author, content, or file path.

| Command | Purpose |
| --- | --- |
| `git log` | Show commits reachable from the current commit. |
| `git log --oneline --graph --decorate --all` | Draw a compact graph of all local references. |
| `git log <base>..<tip>` | Show commits reachable from `tip` but not `base`. |
| `git log -p -- <path>` | Show patches that changed one path. |
| `git log -S<string>` | Find commits where the number of occurrences of a string changed. |
| `git log -G<regex>` | Find commits whose patch text matches a regular expression. |
| `git shortlog -sn` | Summarize commit counts by author. |
| `git blame -L <start>,<end> <file>` | Attribute a selected line range to commits. |
| `git grep -n <pattern> [<revision>]` | Search tracked content, optionally at another revision. |
| `git bisect start` | Start a binary search for a behavior-changing commit. |
| `git bisect bad [<commit>]` | Mark a known bad commit. |
| `git bisect good <commit>` | Mark a known good commit. |
| `git bisect run <command>` | Test candidate commits automatically using the command's exit status. |
| `git bisect reset` | End the session and return to the original branch or commit. |

**Useful habits:**
- Add `--` before a path to disambiguate it from a revision name.
- Use `git show <commit>` after search results to inspect the full change and metadata.
- Make an automated bisect command deterministic: exit `0` for good, a nonzero test-failure code for bad, and `125` when a commit cannot be tested.

**Common pitfalls:**
- `git blame` identifies the last commit to touch a line, not the author of the idea or the person responsible for a bug.
- History that is not reachable from the current branch may still be visible with `--all` or through reflogs.
- A noisy, flaky test makes `git bisect run` unreliable.

```bash
# Find and inspect the commit that introduced a regression
git log --oneline --graph --decorate --all
git bisect start
git bisect bad HEAD
git bisect good v1.4.0
git bisect run uv run pytest tests/test_parser.py

# Record the reported first-bad commit, then leave bisect mode
git bisect reset
```
