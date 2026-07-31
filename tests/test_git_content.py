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
    categories = {
        category.slug: category.name
        for category in load_categories(CONTENT_ROOT / "categories.yml")
    }
    git_terms = [
        term for term in load_all_terms(CONTENT_ROOT) if "git" in term.categories
    ]

    assert categories["git"] == "Git"
    assert {term.slug for term in git_terms} == EXPECTED_GIT_SLUGS
    assert all(term.code_lang == "bash" for term in git_terms)
    assert all(
        term.example_code and "git " in term.example_code for term in git_terms
    )
    assert all("git" in term.tags for term in git_terms)
    assert all(set(term.related) <= EXPECTED_GIT_SLUGS for term in git_terms)
