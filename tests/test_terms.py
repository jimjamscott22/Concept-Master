def test_list_terms_returns_paginated(client):
    response = client.get("/api/terms")
    assert response.status_code == 200
    data = response.json()
    assert "terms" in data
    assert "total" in data
    assert "limit" in data
    assert "offset" in data


def test_list_terms_default_limit(client):
    response = client.get("/api/terms")
    data = response.json()
    assert len(data["terms"]) <= 20


def test_search_terms(client):
    response = client.get("/api/terms?q=array")
    data = response.json()
    assert data["total"] >= 1
    assert any("array" in t["name"].lower() or "array" in t["definition"].lower()
               for t in data["terms"])


def test_filter_by_category(client):
    response = client.get("/api/terms?category=algorithms")
    data = response.json()
    assert data["total"] >= 1


def test_get_term_by_slug(client):
    response = client.get("/api/terms/array")
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "array"
    assert "related_terms" in data


def test_get_term_not_found(client):
    response = client.get("/api/terms/does-not-exist-xyz")
    assert response.status_code == 404


def test_create_term(client):
    payload = {
        "name": "Test Term XYZ",
        "definition": "A test definition for testing purposes.",
        "example_code": "print('hello')",
        "code_lang": "python",
        "category_ids": [],
        "tag_names": ["test-tag"],
        "related_term_ids": [],
    }
    response = client.post("/api/terms", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["slug"] == "test-term-xyz"
    assert data["name"] == "Test Term XYZ"
    assert any(t["name"] == "test-tag" for t in data["tags"])
    # cleanup
    client.delete(f"/api/terms/{data['slug']}")


def test_create_duplicate_name_fails(client):
    payload = {"name": "Array", "definition": "Duplicate", "category_ids": [], "tag_names": [], "related_term_ids": []}
    response = client.post("/api/terms", json=payload)
    assert response.status_code == 409


def test_update_term(client):
    # create
    create_resp = client.post("/api/terms", json={
        "name": "Update Test XYZ", "definition": "Original",
        "category_ids": [], "tag_names": [], "related_term_ids": [],
    })
    slug = create_resp.json()["slug"]
    # update
    update_resp = client.put(f"/api/terms/{slug}", json={
        "name": "Update Test XYZ", "definition": "Updated definition",
        "category_ids": [], "tag_names": [], "related_term_ids": [],
    })
    assert update_resp.status_code == 200
    assert update_resp.json()["definition"] == "Updated definition"
    # cleanup
    client.delete(f"/api/terms/{slug}")


def test_delete_term(client):
    create_resp = client.post("/api/terms", json={
        "name": "Delete Me XYZ", "definition": "Will be deleted",
        "category_ids": [], "tag_names": [], "related_term_ids": [],
    })
    slug = create_resp.json()["slug"]
    del_resp = client.delete(f"/api/terms/{slug}")
    assert del_resp.status_code == 204
    get_resp = client.get(f"/api/terms/{slug}")
    assert get_resp.status_code == 404


def test_toggle_favorite(client):
    response = client.patch("/api/terms/array/favorite")
    assert response.status_code == 200
    data = response.json()
    original = data["is_favorite"]
    # toggle back
    client.patch("/api/terms/array/favorite")
    final = client.get("/api/terms/array").json()["is_favorite"]
    assert final != original
