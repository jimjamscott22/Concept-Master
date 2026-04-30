"""POST/PUT/DELETE/PATCH endpoints persist changes back to ``content/*.md``."""
from __future__ import annotations

from pathlib import Path

import pytest

from backend.routers.terms import CONTENT_ROOT


def _term_path(slug: str) -> Path:
    return CONTENT_ROOT / "terms" / f"{slug}.md"


def test_create_writes_file(client):
    payload = {
        "name": "Writeback Create XYZ",
        "definition": "A file-written definition.",
        "example_code": "print('write')",
        "code_lang": "python",
        "category_ids": [],
        "tag_names": [],
        "related_term_ids": [],
    }
    resp = client.post("/api/terms", json=payload)
    assert resp.status_code == 201
    slug = resp.json()["slug"]
    try:
        path = _term_path(slug)
        assert path.is_file(), f"expected {path} to exist"
        text = path.read_text(encoding="utf-8")
        assert "Writeback Create XYZ" in text
        assert "print('write')" in text
    finally:
        client.delete(f"/api/terms/{slug}")


def test_update_rewrites_file(client):
    create = client.post(
        "/api/terms",
        json={
            "name": "Writeback Update XYZ",
            "definition": "Original",
            "category_ids": [],
            "tag_names": [],
            "related_term_ids": [],
        },
    )
    slug = create.json()["slug"]
    try:
        client.put(
            f"/api/terms/{slug}",
            json={
                "name": "Writeback Update XYZ",
                "definition": "Updated body text",
                "category_ids": [],
                "tag_names": [],
                "related_term_ids": [],
            },
        )
        text = _term_path(slug).read_text(encoding="utf-8")
        assert "Updated body text" in text
        assert "Original" not in text
    finally:
        client.delete(f"/api/terms/{slug}")


def test_update_related_terms_rewrites_file(client):
    first = client.post(
        "/api/terms",
        json={
            "name": "Writeback Related Source XYZ",
            "definition": "Source term",
            "category_ids": [],
            "tag_names": [],
            "related_term_ids": [],
        },
    )
    second = client.post(
        "/api/terms",
        json={
            "name": "Writeback Related Target XYZ",
            "definition": "Target term",
            "category_ids": [],
            "tag_names": [],
            "related_term_ids": [],
        },
    )
    source = first.json()
    target = second.json()
    try:
        resp = client.put(
            f"/api/terms/{source['slug']}",
            json={
                "name": source["name"],
                "definition": source["definition"],
                "category_ids": [],
                "tag_names": [],
                "related_term_ids": [target["id"]],
            },
        )
        assert resp.status_code == 200
        text = _term_path(source["slug"]).read_text(encoding="utf-8")
        assert "related:" in text
        assert f"- {target['slug']}" in text
    finally:
        client.delete(f"/api/terms/{source['slug']}")
        client.delete(f"/api/terms/{target['slug']}")


def test_delete_removes_file(client):
    create = client.post(
        "/api/terms",
        json={
            "name": "Writeback Delete XYZ",
            "definition": "To be removed",
            "category_ids": [],
            "tag_names": [],
            "related_term_ids": [],
        },
    )
    slug = create.json()["slug"]
    path = _term_path(slug)
    assert path.is_file()
    resp = client.delete(f"/api/terms/{slug}")
    assert resp.status_code == 204
    assert not path.exists()


def test_favorite_toggle_rewrites_file(client):
    create = client.post(
        "/api/terms",
        json={
            "name": "Writeback Favorite XYZ",
            "definition": "Toggle me",
            "category_ids": [],
            "tag_names": [],
            "related_term_ids": [],
        },
    )
    slug = create.json()["slug"]
    try:
        client.patch(f"/api/terms/{slug}/favorite")
        text = _term_path(slug).read_text(encoding="utf-8")
        assert "is_favorite: true" in text
        client.patch(f"/api/terms/{slug}/favorite")
        text = _term_path(slug).read_text(encoding="utf-8")
        assert "is_favorite: true" not in text
    finally:
        client.delete(f"/api/terms/{slug}")
