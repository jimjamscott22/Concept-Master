def test_stats_returns_expected_shape(client):
    response = client.get("/api/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_terms" in data
    assert "total_categories" in data
    assert "total_tags" in data
    assert "per_category" in data
    assert "recent_terms" in data
    assert "top_favorites" in data
    assert isinstance(data["recent_terms"], list)
    assert len(data["recent_terms"]) <= 5
    assert len(data["top_favorites"]) <= 5
