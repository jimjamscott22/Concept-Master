import textwrap
from pathlib import Path
import pytest
from backend.content_loader_articles import load_article, load_all_articles, ArticleFile, _extract_summary, _reading_time


def _write(tmp_path: Path, slug: str, content: str) -> Path:
    p = tmp_path / "articles" / f"{slug}.md"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")
    return p


def test_load_article_basic(tmp_path):
    content = textwrap.dedent("""\
        ---
        title: My Article
        categories: [algorithms]
        tags: [exam-review]
        ---

        This is the body.
    """)
    p = _write(tmp_path, "my-article", content)
    article = load_article(p)
    assert article.slug == "my-article"
    assert article.title == "My Article"
    assert "This is the body" in article.body
    assert article.categories == ["algorithms"]
    assert article.tags == ["exam-review"]
    assert article.is_published is True
    assert article.subtitle is None


def test_load_article_with_subtitle(tmp_path):
    content = textwrap.dedent("""\
        ---
        title: Big-O
        subtitle: A guide to complexity
        ---

        Body here.
    """)
    p = _write(tmp_path, "big-o", content)
    article = load_article(p)
    assert article.subtitle == "A guide to complexity"


def test_load_article_draft(tmp_path):
    content = textwrap.dedent("""\
        ---
        title: Draft Post
        is_published: false
        ---

        Body.
    """)
    p = _write(tmp_path, "draft-post", content)
    article = load_article(p)
    assert article.is_published is False


def test_load_article_related(tmp_path):
    content = textwrap.dedent("""\
        ---
        title: Test
        related_terms: [binary-search, sorting]
        related_articles: [other-article]
        ---

        Body.
    """)
    p = _write(tmp_path, "test", content)
    article = load_article(p)
    assert article.related_terms == ["binary-search", "sorting"]
    assert article.related_articles == ["other-article"]


def test_load_article_missing_title_raises(tmp_path):
    content = "---\ncategories: []\n---\n\nBody text.\n"
    p = _write(tmp_path, "no-title", content)
    with pytest.raises(ValueError, match="title"):
        load_article(p)


def test_load_all_articles(tmp_path):
    for slug, title in [("aaa", "AAA"), ("bbb", "BBB")]:
        _write(tmp_path, slug, f"---\ntitle: {title}\n---\n\nBody.\n")
    articles = load_all_articles(tmp_path)
    assert [a.slug for a in articles] == ["aaa", "bbb"]


def test_extract_summary_strips_markdown():
    body = "## Heading\n\nThis is **bold** and `code` text."
    summary = _extract_summary(body)
    assert "**" not in summary
    assert "`" not in summary
    assert "This is" in summary


def test_extract_summary_skips_headings():
    body = "# Heading\n\nFirst real paragraph here."
    summary = _extract_summary(body)
    assert "First real paragraph" in summary
    assert "#" not in summary


def test_extract_summary_max_chars():
    body = "Word " * 200
    summary = _extract_summary(body, max_chars=50)
    assert len(summary) <= 50


def test_reading_time_minimum_one():
    assert _reading_time("Short.") == 1


def test_reading_time_five_minutes():
    body = ("word " * 1000)
    assert _reading_time(body) == 5
