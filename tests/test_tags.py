def test_tags_returns_list(client):
    response = client.get("/api/tags")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_tags_have_required_fields(client):
    response = client.get("/api/tags")
    data = response.json()
    if data:
        tag = data[0]
        assert "id" in tag
        assert "name" in tag
        assert "term_count" in tag
