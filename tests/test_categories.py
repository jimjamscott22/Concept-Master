def test_db_reachable(client):
    """Categories endpoint returns 200 when DB is connected."""
    response = client.get("/api/categories")
    assert response.status_code == 200
