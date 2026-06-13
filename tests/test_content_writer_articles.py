from pathlib import Path
from backend.content_loader_articles import ArticleFile, load_article
from backend.content_writer_articles import write_article, delete_article


def _make_article(**kwargs) -> ArticleFile:
    defaults = dict(
        slug="test-article",
        title="Test Article",
        body="## Heading\n\nSome body text.\n",
        subtitle="A subtitle",
        is_published=True,
        categories=["algorithms"],
        tags=["exam-review"],
        related_terms=["binary-search"],
        related_articles=[],
    )
    defaults.update(kwargs)
    return ArticleFile(**defaults)


def test_write_article_creates_file(tmp_path):
    article = _make_article()
    path = write_article(article, tmp_path)
    assert path.exists()
    assert path.name == "test-article.md"


def test_write_article_round_trips(tmp_path):
    original = _make_article()
    write_article(original, tmp_path)
    reloaded = load_article(tmp_path / "articles" / "test-article.md")
    assert reloaded.title == original.title
    assert reloaded.subtitle == original.subtitle
    assert reloaded.categories == original.categories
    assert reloaded.tags == original.tags
    assert reloaded.related_terms == original.related_terms
    assert reloaded.is_published == original.is_published
    assert reloaded.body.strip() == original.body.strip()


def test_write_article_no_subtitle(tmp_path):
    article = _make_article(subtitle=None)
    write_article(article, tmp_path)
    reloaded = load_article(tmp_path / "articles" / "test-article.md")
    assert reloaded.subtitle is None


def test_write_article_draft(tmp_path):
    article = _make_article(is_published=False)
    write_article(article, tmp_path)
    reloaded = load_article(tmp_path / "articles" / "test-article.md")
    assert reloaded.is_published is False


def test_delete_article(tmp_path):
    article = _make_article()
    path = write_article(article, tmp_path)
    assert path.exists()
    delete_article("test-article", tmp_path)
    assert not path.exists()


def test_delete_article_missing_ok(tmp_path):
    delete_article("nonexistent", tmp_path)  # must not raise
