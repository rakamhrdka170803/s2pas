-- 002_categories_breaking_news.sql

-- Bersihkan dulu (aman untuk dev, bisa rerun)
DROP TABLE IF EXISTS breaking_news;
DROP TABLE IF EXISTS categories;

-- Master kategori (category + sub + detail)
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('product','script')),
    category TEXT NOT NULL,
    sub_category TEXT NOT NULL,
    detail_category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kombinasi kind + category + sub + detail unik
CREATE UNIQUE INDEX idx_categories_unique
    ON categories (
        kind,
        category,
        sub_category,
        COALESCE(detail_category, '')
    );

-- Tabel untuk breaking news (ticker merah)
CREATE TABLE breaking_news (
    id BIGSERIAL PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('product','script')),
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_breaking_news_active
    ON breaking_news(is_active, kind);
