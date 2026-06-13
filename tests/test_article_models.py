from datetime import datetime
from backend.models import ArticleResponse, ArticleDetailResponse, ArticleListResponse, ArticleSummary


def test_article_summary():
    s = ArticleSummary(id=1, title="Big-O", slug="big-o")
    assert s.slug == "big-o"


def test_article_response_coerces_is_published():
    r = ArticleResponse(
        id=1, title="T", slug="t", subtitle=None, body="body",
        summary="sum", reading_time_minutes=1, is_published=1,
        categories=[], tags=[], created_at=datetime.now(), updated_at=datetime.now(),
    )
    assert r.is_published is True


def test_article_detail_response_has_related():
    r = ArticleDetailResponse(
        id=1, title="T", slug="t", subtitle=None, body="body",
        summary="sum", reading_time_minutes=1, is_published=True,
        categories=[], tags=[], related_terms=[], related_articles=[],
        created_at=datetime.now(), updated_at=datetime.now(),
    )
    assert r.related_terms == []
    assert r.related_articles == []


def test_article_list_response():
    lr = ArticleListResponse(articles=[], total=0, limit=20, offset=0)
    assert lr.total == 0
