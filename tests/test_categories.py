def test_db_reachable(client):
    response = client.get("/api/categories")
    assert response.status_code == 200


def test_categories_returns_list(client):
    response = client.get("/api/categories")
    data = response.json()
    assert isinstance(data, list)


def test_categories_have_required_fields(client):
    response = client.get("/api/categories")
    data = response.json()
    if data:
        cat = data[0]
        assert "id" in cat
        assert "name" in cat
        assert "slug" in cat
        assert "term_count" in cat
