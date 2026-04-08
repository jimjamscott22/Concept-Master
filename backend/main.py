from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import create_pool
from .routers import categories, tags, terms, stats


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pool = await create_pool()
    yield
    app.state.pool.close()
    await app.state.pool.wait_closed()


app = FastAPI(title="Concept Master", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(tags.router,       prefix="/api/tags",       tags=["tags"])
app.include_router(terms.router,      prefix="/api/terms",      tags=["terms"])
app.include_router(stats.router,      prefix="/api/stats",      tags=["stats"])
