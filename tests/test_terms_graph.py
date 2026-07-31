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


def test_terms_graph_related_count_reflects_relationship(client):
    # Self-contained: create two terms linked via related_term_ids, rather than
    # depending on content/ seed data — test_sync_content.py's prune test resets
    # the DB to backend/seed.sql (which has no related_terms rows) between test
    # modules, so any assertion tied to specific seeded content is order-dependent.
    a = client.post("/api/terms", json={
        "name": "Graph Test Node A", "definition": "A.",
        "category_ids": [], "tag_names": [], "related_term_ids": [],
    }).json()
    b = client.post("/api/terms", json={
        "name": "Graph Test Node B", "definition": "B.",
        "category_ids": [], "tag_names": [], "related_term_ids": [a["id"]],
    }).json()
    try:
        graph = client.get("/api/terms/graph").json()
        node_a = next(n for n in graph if n["slug"] == a["slug"])
        node_b = next(n for n in graph if n["slug"] == b["slug"])
        assert node_a["related_count"] >= 1
        assert node_b["related_count"] >= 1
    finally:
        client.delete(f"/api/terms/{b['slug']}")
        client.delete(f"/api/terms/{a['slug']}")


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
