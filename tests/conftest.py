import os
import pytest
from fastapi.testclient import TestClient

# Point tests at a separate test database
os.environ.setdefault("DB_NAME", "concept_master_test")

from backend.main import app

@pytest.fixture(scope="session")
def client():
    """Session-scoped FastAPI test client. App lifespan runs once."""
    with TestClient(app) as c:
        yield c
