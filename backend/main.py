import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import create_pool
from .routers import articles, categories, tags, terms, stats, review
from .sync_articles import sync_articles
from .sync_content import DEFAULT_CONTENT_ROOT, sync_content


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pool = await create_pool()
    if os.getenv("SYNC_ON_START") == "1":
        report = await sync_content(app.state.pool, DEFAULT_CONTENT_ROOT)
        print(report.format())
        article_report = await sync_articles(app.state.pool, DEFAULT_CONTENT_ROOT)
        print(article_report.format())
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
app.include_router(review.router,     prefix="/api/review",     tags=["review"])
app.include_router(articles.router,   prefix="/api/articles",   tags=["articles"])
