def test_terms_graph_returns_related_counts(client):
    response = client.get("/api/terms/graph")
    assert response.status_code == 200
    nodes = response.json()
    assert isinstance(nodes, list)
    assert len(nodes) > 0
    node = nodes[0]
    assert set(node.keys()) >= {"id", "name", "slug", "is_favorite", "categories", "related_count"}
    assert isinstance(node["related_count"], int)
    assert isinstance(node["categories"], list)


def test_terms_graph_all_nodes_have_valid_structure(client):
    # Verify each node has all required fields with correct types
    graph = client.get("/api/terms/graph").json()
    for node in graph:
        assert isinstance(node["id"], int)
        assert isinstance(node["name"], str)
        assert isinstance(node["slug"], str)
        assert isinstance(node["is_favorite"], bool)
        assert isinstance(node["categories"], list)
        assert isinstance(node["related_count"], int)
        # All related_counts should be >= 0
        assert node["related_count"] >= 0
