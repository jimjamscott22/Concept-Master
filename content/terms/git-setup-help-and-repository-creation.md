---
name: Git Setup, Help, and Repository Creation
categories:
- git
tags:
- git
- configuration
- repository
related:
- git-inspecting-and-comparing-changes
- git-remotes-and-synchronization
code_lang: bash
---

This command family prepares Git for use and creates a local repository, either from an empty directory or an existing remote repository.

**Mental model:** Git configuration is layered. System settings apply to the machine, global settings apply to the current user, and local settings apply only to one repository. `git init` creates Git metadata around an existing directory, while `git clone` copies a repository and normally gives it an `origin` remote.

| Command | Purpose |
| --- | --- |
| `git config --global user.name "Ada Lovelace"` | Set the author name for the current user. |
| `git config --global user.email "ada@example.com"` | Set the author email for the current user. |
| `git config --global init.defaultBranch main` | Choose the initial branch name for new repositories. |
| `git config --local key value` | Set a repository-only option. `--system`, `--global`, and `--local` select the scope. |
| `git config --list --show-origin` | List effective settings and the file that supplied each value. |
| `git config --get user.email` | Read one effective setting. |
| `git help <command>` | Open the full manual for a command, such as `git help rebase`. |
| `git <command> -h` | Show a short usage summary in the terminal. |
| `git init` | Turn the current directory into a Git repository. |
| `git init -b main` | Initialize a repository with a chosen initial branch. |
| `git clone <url>` | Copy a repository into a new directory. |
| `git clone <url> <directory>` | Clone into a specifically named directory. |
| `git clone --branch <name> --single-branch <url>` | Clone one selected branch. |
| `git clone --depth 1 <url>` | Make a shallow clone with limited history. |

**Useful habits:**
- Set `user.name`, `user.email`, and `init.defaultBranch` once at global scope, then override them locally only when a repository needs a different identity.
- Use `git config --show-origin --get-regexp <pattern>` when a setting behaves unexpectedly.
- Run `git help <command>` before relying on an unfamiliar destructive option.

**Common pitfalls:**
- `git init` does not create a remote or publish anything.
- A shallow clone is smaller, but some history searches, comparisons, and merges may require fetching more history later.
- Do not commit secrets from credential helpers or repository-local configuration files.

```bash
# Configure this user, then create and inspect a new repository
git config --global user.name "Ada Lovelace"
git config --global user.email "ada@example.com"
git config --global init.defaultBranch main

mkdir concept-notes
cd concept-notes
git init
git status
git help status
```
