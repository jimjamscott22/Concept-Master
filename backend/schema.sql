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
CREATE INDEX IF NOT EXISTS idx_terms_favorite  ON terms(is_favorite);
CREATE INDEX IF NOT EXISTS idx_terms_created   ON terms(created_at);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_tags_name       ON tags(name);
