-- Concept Master — MariaDB/MySQL Schema

CREATE TABLE IF NOT EXISTS terms (
    id           INT          NOT NULL AUTO_INCREMENT,
    name         VARCHAR(255) NOT NULL,
    slug         VARCHAR(255) NOT NULL,
    definition   LONGTEXT     NOT NULL,
    example_code LONGTEXT,
    code_lang    VARCHAR(50),
    is_favorite  TINYINT(1)   NOT NULL DEFAULT 0,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_terms_name (name),
    UNIQUE KEY uq_terms_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
    id   INT          NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_categories_name (name),
    UNIQUE KEY uq_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tags (
    id   INT          NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tags_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS term_categories (
    term_id     INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (term_id, category_id),
    CONSTRAINT fk_tc_term     FOREIGN KEY (term_id)     REFERENCES terms(id)      ON DELETE CASCADE,
    CONSTRAINT fk_tc_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS term_tags (
    term_id INT NOT NULL,
    tag_id  INT NOT NULL,
    PRIMARY KEY (term_id, tag_id),
    CONSTRAINT fk_tt_term FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE,
    CONSTRAINT fk_tt_tag  FOREIGN KEY (tag_id)  REFERENCES tags(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS related_terms (
    term_a INT NOT NULL,
    term_b INT NOT NULL,
    PRIMARY KEY (term_a, term_b),
    CONSTRAINT fk_rt_a       FOREIGN KEY (term_a) REFERENCES terms(id) ON DELETE CASCADE,
    CONSTRAINT fk_rt_b       FOREIGN KEY (term_b) REFERENCES terms(id) ON DELETE CASCADE,
    CONSTRAINT chk_rt_order  CHECK (term_a < term_b)
) ENGINE=InnoDB;

CREATE INDEX IF NOT EXISTS idx_terms_name      ON terms(name);
CREATE INDEX IF NOT EXISTS idx_terms_slug      ON terms(slug);
CREATE FULLTEXT INDEX IF NOT EXISTS idx_terms_fulltext ON terms (name, definition);
CREATE INDEX IF NOT EXISTS idx_terms_favorite  ON terms(is_favorite);
CREATE INDEX IF NOT EXISTS idx_terms_created   ON terms(created_at);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_tags_name       ON tags(name);

-- ── Spaced-repetition / retention tables ─────────────────────────────────────

-- Per-term scheduling state (SM-2 lite). One row per term that has ever been
-- reviewed; missing rows imply "new, due immediately".
CREATE TABLE IF NOT EXISTS term_reviews (
    term_id          INT          NOT NULL,
    ease             FLOAT        NOT NULL DEFAULT 2.5,
    interval_days    INT          NOT NULL DEFAULT 0,
    reps             INT          NOT NULL DEFAULT 0,
    lapses           INT          NOT NULL DEFAULT 0,
    due_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_rating      VARCHAR(10),
    last_reviewed_at DATETIME,
    PRIMARY KEY (term_id),
    CONSTRAINT fk_tr_term FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_term_reviews_due ON term_reviews(due_at);

-- One row per calendar date the user studied; powers the streak + heatmap.
CREATE TABLE IF NOT EXISTS review_sessions (
    session_date    DATE NOT NULL,
    reviewed_count  INT  NOT NULL DEFAULT 0,
    correct_count   INT  NOT NULL DEFAULT 0,
    PRIMARY KEY (session_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Article tables ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS articles (
    id                   INT          NOT NULL AUTO_INCREMENT,
    title                VARCHAR(255) NOT NULL,
    slug                 VARCHAR(255) NOT NULL,
    subtitle             VARCHAR(500),
    body                 LONGTEXT     NOT NULL,
    summary              VARCHAR(500),
    reading_time_minutes INT          NOT NULL DEFAULT 1,
    is_published         TINYINT(1)   NOT NULL DEFAULT 1,
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_articles_title (title),
    UNIQUE KEY uq_articles_slug  (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS article_categories (
    article_id  INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (article_id, category_id),
    CONSTRAINT fk_ac_article  FOREIGN KEY (article_id)  REFERENCES articles(id)   ON DELETE CASCADE,
    CONSTRAINT fk_ac_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS article_tags (
    article_id INT NOT NULL,
    tag_id     INT NOT NULL,
    PRIMARY KEY (article_id, tag_id),
    CONSTRAINT fk_at_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    CONSTRAINT fk_at_tag     FOREIGN KEY (tag_id)     REFERENCES tags(id)     ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS article_related_terms (
    article_id INT NOT NULL,
    term_id    INT NOT NULL,
    PRIMARY KEY (article_id, term_id),
    CONSTRAINT fk_art_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    CONSTRAINT fk_art_term    FOREIGN KEY (term_id)    REFERENCES terms(id)    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS article_related_articles (
    article_a INT NOT NULL,
    article_b INT NOT NULL,
    PRIMARY KEY (article_a, article_b),
    CONSTRAINT fk_ara_a     FOREIGN KEY (article_a) REFERENCES articles(id) ON DELETE CASCADE,
    CONSTRAINT fk_ara_b     FOREIGN KEY (article_b) REFERENCES articles(id) ON DELETE CASCADE,
    CONSTRAINT chk_ara_order CHECK (article_a < article_b)
) ENGINE=InnoDB;

CREATE INDEX IF NOT EXISTS idx_articles_slug      ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(is_published);
CREATE INDEX IF NOT EXISTS idx_articles_created   ON articles(created_at);

-- Daily Concept is independent of glossary/review identity. Additive MVP tables.
CREATE TABLE IF NOT EXISTS concepts (
    id            VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    title         TEXT NOT NULL,
    domain        VARCHAR(50) NOT NULL,
    tags          JSON NOT NULL,
    difficulty    TINYINT NOT NULL,
    prerequisites JSON NOT NULL,
    related       JSON NOT NULL,
    angle         TEXT,
    active        TINYINT(1) NOT NULL DEFAULT 1,
    synced_at     DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT chk_concept_difficulty CHECK (difficulty BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS daily_lessons (
    id             INT NOT NULL AUTO_INCREMENT,
    concept_id     VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    scheduled_date DATE NOT NULL,
    title          TEXT NOT NULL,
    domain         VARCHAR(50) NOT NULL,
    status         ENUM('scheduled', 'ready', 'published', 'completed', 'failed', 'pending_review') NOT NULL DEFAULT 'scheduled',
    payload        JSON,
    raw_output     LONGTEXT,
    prompt_version VARCHAR(100),
    model          VARCHAR(255),
    attempts       INT NOT NULL DEFAULT 0,
    claim_token    CHAR(36) CHARACTER SET ascii COLLATE ascii_bin,
    claim_expires_at DATETIME(6),
    created_at     DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    completed_at   DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_daily_date (scheduled_date),
    UNIQUE KEY uq_daily_concept (concept_id),
    CONSTRAINT fk_daily_concept FOREIGN KEY (concept_id) REFERENCES concepts(id),
    CONSTRAINT chk_daily_attempts CHECK (attempts >= 0),
    CONSTRAINT chk_daily_claim CHECK (
        (claim_token IS NULL AND claim_expires_at IS NULL) OR
        (claim_token IS NOT NULL AND claim_expires_at IS NOT NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_responses (
    id             INT NOT NULL AUTO_INCREMENT,
    lesson_id      INT NOT NULL,
    item_index     INT NOT NULL,
    selected_index INT NOT NULL,
    correct        TINYINT(1) NOT NULL,
    answered_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    source         ENUM('daily', 'review') NOT NULL DEFAULT 'daily',
    -- NULL permits multiple v2 review attempts while daily answers stay unique.
    daily_item_index INT GENERATED ALWAYS AS
        (CASE WHEN source = 'daily' THEN item_index ELSE NULL END) STORED,
    PRIMARY KEY (id),
    UNIQUE KEY uq_daily_response (lesson_id, daily_item_index),
    CONSTRAINT fk_quiz_lesson FOREIGN KEY (lesson_id) REFERENCES daily_lessons(id),
    CONSTRAINT chk_quiz_indices CHECK (item_index >= 0 AND selected_index >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS streaks (
    id                  TINYINT NOT NULL,
    `current`           INT NOT NULL DEFAULT 0,
    longest             INT NOT NULL DEFAULT 0,
    last_completed_date DATE,
    PRIMARY KEY (id),
    CONSTRAINT chk_streak_singleton CHECK (id = 1),
    CONSTRAINT chk_streak_counts CHECK (`current` >= 0 AND longest >= `current`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO streaks (id) VALUES (1);
