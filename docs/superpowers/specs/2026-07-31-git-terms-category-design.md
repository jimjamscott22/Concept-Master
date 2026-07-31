# Git Terms Category Design

Date: 2026-07-31

## Goal

Add a `Git` category to Concept Master's existing category navigation and populate it with ten practical, searchable command-family terms. The first pass covers only the core `git` CLI. GitHub, GitLab, other hosting services, and the `gh` CLI are out of scope.

## User Experience

The new category uses the existing data-driven category UI without a special icon, logo, nested navigation, or custom color. After content synchronization:

- The three-pane Browse layout shows `Git` as a normal left-sidebar category with a count of `10`.
- The two-pane Browse layout shows the same category and count in its horizontal category chip rail.
- Selecting `Git` filters the term list to the ten Git command-family entries.
- Selecting a Git term opens the existing definition reader.
- Each term's primary command workflow appears in the existing Code tab with Bash syntax highlighting.

Superdesign review:

- Canvas: https://superdesign.dev/teams/bab35c49-7728-4f21-a7f9-ac13ec08cc67/projects/16629ec6-1da1-4f83-870a-fca32c39249d
- Current UI reproduction: https://p.superdesign.dev/draft/9fa62032-9abc-47c9-b9ad-c100c095f610
- Git category state: https://p.superdesign.dev/draft/2ef8c420-4d68-4d48-981e-5d06e08a2220

## Content Architecture

Add one canonical category entry to `content/categories.yml`:

```yaml
- name: Git
  slug: git
```

Add ten Markdown term files under `content/terms/`. Each term assigns the `git` category, uses focused Git tags, sets `code_lang: bash`, and links to related Git terms where useful.

The ten terms are:

1. Git Setup, Help, and Repository Creation
2. Inspecting and Comparing Changes
3. Staging and Committing
4. Branching and Switching
5. Merging, Rebasing, and Cherry-Picking
6. Remotes and Synchronization
7. History, Search, and Debugging
8. Stashing and Worktrees
9. Tags and Releases
10. Undoing, Restoring, and Cleaning Up

These are command families, not one-page-per-command entries. "Complete" means broad practical coverage of Git porcelain commands and important options for daily development. Internal plumbing commands are not part of this pass.

## Term Structure

Every Git term follows the same compact learning structure:

1. A plain-language explanation of the command family's purpose.
2. A short mental model describing which Git state or workflow it affects.
3. A Markdown reference table covering the relevant commands and important options.
4. Safety notes or common pitfalls where an operation can discard, rewrite, or publish work.
5. One realistic Bash workflow in a fenced code block.
6. Related-term links to adjacent Git command families.

The loader extracts the first Bash fenced block into `example_code`, which the reader presents in its Code tab. The remaining Markdown is stored as the definition.

## Command Coverage

### Setup, Help, and Repository Creation

Cover `git config`, `git help`, `git init`, and `git clone`, including common configuration scopes and clone options.

### Inspecting and Comparing Changes

Cover `git status`, `git diff`, `git diff --staged`, `git show`, and concise status output.

### Staging and Committing

Cover `git add`, interactive and patch staging, `git commit`, commit amendment, and unstaging without losing working-tree changes.

### Branching and Switching

Cover `git branch`, `git switch`, branch creation, rename, deletion, listing, and the older `git checkout` equivalent where useful for recognition.

### Merging, Rebasing, and Cherry-Picking

Cover `git merge`, conflict continuation and abort flows, `git rebase`, interactive rebase, `git cherry-pick`, and history-rewrite cautions.

### Remotes and Synchronization

Cover `git remote`, `git fetch`, `git pull`, `git push`, upstream tracking, pruning, and force-with-lease safety.

### History, Search, and Debugging

Cover `git log`, `git shortlog`, `git blame`, `git grep`, and `git bisect`, with useful formatting and graph options.

### Stashing and Worktrees

Cover `git stash` create/list/show/apply/pop/drop/branch and `git worktree` add/list/remove/prune.

### Tags and Releases

Cover lightweight and annotated `git tag` workflows, inspection, pushing, deletion, and signature verification awareness.

### Undoing, Restoring, and Cleaning Up

Cover `git restore`, `git reset`, `git revert`, `git reflog`, and `git clean`, clearly distinguishing safe history-preserving recovery from destructive local operations.

## Data Flow

No frontend schema or component changes are required.

1. `backend.content_loader` reads the category YAML and term Markdown files.
2. `backend.sync_content` upserts the new category, terms, tags, and relationships.
3. `/api/categories` returns the Git category and its term count.
4. `/api/terms?category=git` returns the ten Git terms.
5. The existing `Sidebar`, `CategoryChipRail`, term list, and term reader render the new data.

## Validation and Error Handling

- Every Git term must have a unique filename/slug and a non-empty `name`.
- Every term must reference the declared `git` category.
- Related slugs must resolve to another repository term.
- Frontmatter list fields must remain lists of strings.
- The content loader must parse all ten terms and extract their Bash examples.
- Safety-sensitive entries must clearly label destructive commands and prefer safer alternatives such as `--force-with-lease` over `--force`.
- A content regression test will assert that the category exists, exactly ten terms belong to it, and every Git term includes a Bash example.

## Verification

Before completion:

- Run the focused content regression test.
- Run the complete backend test suite.
- Run frontend lint and production build/type-check.
- Synchronize content against an available local database when possible.
- Render the application and verify the Git category count, filtering, term selection, definition, and Code tab at desktop and mobile widths.

If the database or browser runtime is unavailable, report the skipped verification with the exact command needed to reproduce it.

## Acceptance Criteria

- `Git` appears in the category source of truth with slug `git`.
- Exactly ten new terms use the Git category.
- The ten pages collectively cover the approved command families.
- No GitHub-specific or hosting-service-specific commands are included.
- The category and terms load without content parser errors.
- Existing category and term behavior remains unchanged.
- Automated tests protect the new content inventory.

