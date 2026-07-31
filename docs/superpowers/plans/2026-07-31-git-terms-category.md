# Git Terms Category Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a data-driven Git category with ten practical Git CLI command-family glossary terms.

**Architecture:** Keep the feature entirely in the repository's content source of truth. Add one category record and ten Markdown term records; the existing loader, sync layer, API, sidebar, category rail, term list, and reader will surface them automatically. Protect the inventory and frontmatter contract with a focused repository-content regression test.

**Tech Stack:** YAML, Markdown with YAML frontmatter, Python 3.12, pytest, existing `backend.content_loader`.

## Global Constraints

- Cover only the core `git` CLI; exclude GitHub, GitLab, hosting-service features, and `gh`.
- Create exactly ten command-family terms assigned to category slug `git`.
- Use `code_lang: bash` and one realistic Bash example per term.
- Prefer modern commands such as `git switch` and `git restore`, while noting older `git checkout` forms for recognition.
- Clearly warn about destructive history or working-tree operations.
- Recommend `git push --force-with-lease` instead of unqualified `--force`.
- Do not change frontend schemas or components.

---

### Task 1: Add the Git content contract test

**Files:**
- Create: `tests/test_git_content.py`

**Interfaces:**
- Consumes: `backend.content_loader.load_categories(Path)` and `backend.content_loader.load_all_terms(Path)`.
- Produces: A repository-level assertion for the `git` category, exact term slug set, Bash examples, Git tags, and valid intra-Git related links.

- [ ] **Step 1: Write the failing content inventory test**

```python
from pathlib import Path

from backend.content_loader import load_all_terms, load_categories


CONTENT_ROOT = Path(__file__).resolve().parents[1] / "content"
EXPECTED_GIT_SLUGS = {
    "git-setup-help-and-repository-creation",
    "git-inspecting-and-comparing-changes",
    "git-staging-and-committing",
    "git-branching-and-switching",
    "git-merging-rebasing-and-cherry-picking",
    "git-remotes-and-synchronization",
    "git-history-search-and-debugging",
    "git-stashing-and-worktrees",
    "git-tags-and-releases",
    "git-undoing-restoring-and-cleaning-up",
}


def test_git_category_and_terms_are_complete():
    categories = {category.slug: category.name for category in load_categories(CONTENT_ROOT / "categories.yml")}
    git_terms = [term for term in load_all_terms(CONTENT_ROOT) if "git" in term.categories]

    assert categories["git"] == "Git"
    assert {term.slug for term in git_terms} == EXPECTED_GIT_SLUGS
    assert all(term.code_lang == "bash" for term in git_terms)
    assert all(term.example_code and "git " in term.example_code for term in git_terms)
    assert all("git" in term.tags for term in git_terms)
    assert all(set(term.related) <= EXPECTED_GIT_SLUGS for term in git_terms)
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `uv run pytest tests/test_git_content.py -v`

Expected: FAIL because `categories["git"]` does not exist and no Git terms are present.

- [ ] **Step 3: Leave the failing test in place for Task 2**

Do not weaken the expected slug set or example assertions to make the test pass.

---

### Task 2: Add the Git category and ten command-family terms

**Files:**
- Modify: `content/categories.yml`
- Create: `content/terms/git-setup-help-and-repository-creation.md`
- Create: `content/terms/git-inspecting-and-comparing-changes.md`
- Create: `content/terms/git-staging-and-committing.md`
- Create: `content/terms/git-branching-and-switching.md`
- Create: `content/terms/git-merging-rebasing-and-cherry-picking.md`
- Create: `content/terms/git-remotes-and-synchronization.md`
- Create: `content/terms/git-history-search-and-debugging.md`
- Create: `content/terms/git-stashing-and-worktrees.md`
- Create: `content/terms/git-tags-and-releases.md`
- Create: `content/terms/git-undoing-restoring-and-cleaning-up.md`

**Interfaces:**
- Consumes: Existing `TermFile` frontmatter contract: `name`, `categories`, `tags`, `related`, and `code_lang`.
- Produces: Ten parseable `TermFile` records under category `git`, each with a definition and extracted Bash example.

- [ ] **Step 1: Add the canonical category**

Insert this entry alphabetically between Functional Programming and Memory Management:

```yaml
- name: Git
  slug: git
```

- [ ] **Step 2: Create every term with canonical frontmatter**

Use this exact shape, substituting the approved name, related slugs, and focused tags:

```yaml
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
```

Each body must contain:

- A concise command-family explanation.
- A `**Mental model:**` paragraph.
- A `| Command | Purpose |` GFM table.
- A `**Useful habits:**`, `**Safety:**`, or `**Common pitfalls:**` section.
- Exactly one fenced `bash` workflow for extraction into the Code tab.

- [ ] **Step 3: Cover the approved command inventory**

| Term file | Required command coverage |
| --- | --- |
| `git-setup-help-and-repository-creation.md` | `config`, `help`, `init`, `clone` |
| `git-inspecting-and-comparing-changes.md` | `status`, `diff`, `diff --staged`, `show` |
| `git-staging-and-committing.md` | `add`, `add -p`, `commit`, `commit --amend`, `restore --staged` |
| `git-branching-and-switching.md` | `branch`, `switch`, `switch -c`, `switch -`, legacy `checkout` |
| `git-merging-rebasing-and-cherry-picking.md` | `merge`, `rebase`, `rebase -i`, `cherry-pick`, abort/continue flows |
| `git-remotes-and-synchronization.md` | `remote`, `fetch`, `pull`, `push`, tracking, pruning, `--force-with-lease` |
| `git-history-search-and-debugging.md` | `log`, `shortlog`, `blame`, `grep`, `bisect` |
| `git-stashing-and-worktrees.md` | `stash` lifecycle and `worktree` lifecycle |
| `git-tags-and-releases.md` | lightweight, annotated, signed, listed, pushed, verified, and deleted tags |
| `git-undoing-restoring-and-cleaning-up.md` | `restore`, `reset`, `revert`, `reflog`, `clean` with dry-run guidance |

- [ ] **Step 4: Run the focused test**

Run: `uv run pytest tests/test_git_content.py -v`

Expected: PASS with one test.

---

### Task 3: Verify the content and application contracts

**Files:**
- Verify: `content/categories.yml`
- Verify: `content/terms/git-*.md`
- Verify: `tests/test_git_content.py`

**Interfaces:**
- Consumes: The completed content inventory.
- Produces: Evidence that content parsing, backend behavior, frontend build/type-check, lint, and rendered category filtering remain healthy.

- [ ] **Step 1: Run all backend tests**

Run: `uv run pytest`

Expected: All available tests pass. Database-dependent tests may require the configured MariaDB service.

- [ ] **Step 2: Run frontend lint**

Run from `frontend/`: `npm run lint`

Expected: Exit code 0.

- [ ] **Step 3: Run frontend build and TypeScript project check**

Run from `frontend/`: `npm run build`

Expected: `tsc -b` and Vite production build both exit successfully.

- [ ] **Step 4: Run content synchronization when MariaDB is available**

Run: `uv run python -m backend.sync_content`

Expected: The Git category and ten terms are inserted or reported unchanged without unknown-category or unresolved-related-term warnings.

- [ ] **Step 5: Verify the rendered interaction**

Run the backend and frontend, then exercise:

```text
Browse -> Git sidebar category (count 10) -> ten filtered term cards ->
select a term -> Definition tab -> Code tab with Bash example
```

Check desktop three-pane layout and a mobile-width viewport. Confirm no framework overlay, console error, clipping, overlap, or unreadable command table.
