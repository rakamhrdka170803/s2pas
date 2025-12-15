-- extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin','agent')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- categories (TREE UNLIMITED DEPTH)
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('product','script')),
    name TEXT NOT NULL,
    parent_id BIGINT REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- unik per sibling (nama tidak boleh sama di level yang sama)
CREATE UNIQUE INDEX categories_unique_sibling
ON categories(kind, parent_id, lower(name));

-- products (supports product & script)
-- NOTE: kamu sebelumnya punya products.kind & slug di code, jadi kita benerin table-nya sesuai backend kamu
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('product','script')),
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    blocks JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX products_kind_slug_unique
ON products(kind, slug);

CREATE INDEX idx_products_title_trgm
ON products USING GIN (title gin_trgm_ops);

CREATE INDEX idx_products_blocks_gin
ON products USING GIN (blocks);

-- breaking news
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

-- S2PASS enums & table
DO $$ BEGIN
    CREATE TYPE s2_main_type AS ENUM ('info', 'request', 'complaint');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE s2_node_type AS ENUM ('menu', 'step');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE s2_link_kind AS ENUM ('product', 'script');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE s2_nodes (
    id              BIGSERIAL PRIMARY KEY,
    main_type       s2_main_type       NOT NULL,
    parent_id       BIGINT REFERENCES s2_nodes(id) ON DELETE CASCADE,
    node_type       s2_node_type       NOT NULL,
    label           TEXT               NOT NULL,
    title           TEXT,
    body            TEXT,
    link_kind       s2_link_kind,
    link_slug       TEXT,
    sort_order      INT                NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_s2_nodes_main_parent ON s2_nodes(main_type, parent_id);
