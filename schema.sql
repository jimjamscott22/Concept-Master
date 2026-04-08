-- Interactive Glossary of Programming Concepts
-- SQLite Schema
-- Run once to initialize the database

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ============================================================
-- Core Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS terms (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL UNIQUE,
    slug         TEXT    NOT NULL UNIQUE,
    definition   TEXT    NOT NULL,          -- Markdown content
    example_code TEXT,                       -- Optional code snippet
    code_lang    TEXT,                       -- Language identifier (python, java, javascript, etc.)
    is_favorite  INTEGER NOT NULL DEFAULT 0, -- 0 = no, 1 = yes
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT    NOT NULL UNIQUE,
    slug TEXT    NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS tags (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT    NOT NULL UNIQUE
);

-- ============================================================
-- Join Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS term_categories (
    term_id     INTEGER NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (term_id, category_id)
);

CREATE TABLE IF NOT EXISTS term_tags (
    term_id INTEGER NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    tag_id  INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (term_id, tag_id)
);

CREATE TABLE IF NOT EXISTS related_terms (
    term_a INTEGER NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    term_b INTEGER NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    PRIMARY KEY (term_a, term_b),
    CHECK (term_a < term_b)  -- Enforce ordering to prevent duplicate pairs
);

-- ============================================================
-- Indexes for Search Performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_terms_name       ON terms(name);
CREATE INDEX IF NOT EXISTS idx_terms_slug       ON terms(slug);
CREATE INDEX IF NOT EXISTS idx_terms_favorite   ON terms(is_favorite);
CREATE INDEX IF NOT EXISTS idx_terms_created     ON terms(created_at);
CREATE INDEX IF NOT EXISTS idx_categories_slug  ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_tags_name        ON tags(name);

-- ============================================================
-- Trigger: Auto-update updated_at on term modification
-- ============================================================

CREATE TRIGGER IF NOT EXISTS trg_terms_updated_at
AFTER UPDATE ON terms
FOR EACH ROW
BEGIN
    UPDATE terms SET updated_at = datetime('now') WHERE id = OLD.id;
END;
