// src/api.js
const API_BASE = "http://localhost:8080/api";

let token = null;

export function setToken(t) {
  token = t;
}

export function getToken() {
  return token;
}

function jsonHeaders() {
  const h = {
    "Content-Type": "application/json",
  };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

function authHeaders() {
  const h = {};
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

// ===================== AUTH =====================
export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  const data = await res.json();

  setToken(data.token);
  localStorage.setItem("cc-helper-token", data.token);

  return data;
}

export async function fetchMe() {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Not logged in");
  return res.json();
}

// ===================== CATEGORIES (TREE) =====================
// GET /categories?kind=product|script&parentId=...
export async function fetchCategories({ kind = "product", parentId } = {}) {
  const url = new URL(`${API_BASE}/categories`);
  url.searchParams.set("kind", kind);
  if (parentId) url.searchParams.set("parentId", String(parentId));

  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json(); // [{id, kind, name, parent_id}, ...]
}

// GET /categories/path/:id  -> { path: "A / B / C" }
export async function fetchCategoryPath(id) {
  const res = await fetch(`${API_BASE}/categories/path/${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch category path");
  return res.json();
}

// ADMIN: POST /admin/categories
// body: { kind, name, parent_id }
export async function createCategoryMaster({ kind, name, parentId }) {
  const res = await fetch(`${API_BASE}/admin/categories`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({
      kind,
      name,
      parent_id: parentId ?? null,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Create category failed");
  }
  return res.json(); // { id }
}

// ADMIN: DELETE /admin/categories/:id
export async function deleteCategory(id) {
  const res = await fetch(`${API_BASE}/admin/categories/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Delete category failed");
  }
  return res.json();
}

// ===================== LIST & DETAIL =====================
// GET /products?categoryId=...&q=...
// GET /scripts?categoryId=...&q=...
export async function fetchList(kind, { categoryId, q } = {}) {
  const path = kind === "product" ? "products" : "scripts";
  const url = new URL(`${API_BASE}/${path}`);
  if (categoryId) url.searchParams.set("categoryId", String(categoryId));
  if (q) url.searchParams.set("q", q);

  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch list");
  return res.json();
}

// GET /products/slug/:slug
// GET /scripts/slug/:slug
export async function fetchDetail(kind, slug) {
  const path = kind === "product" ? "products" : "scripts";
  const res = await fetch(`${API_BASE}/${path}/slug/${slug}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Not found");
  return res.json();
}

// GET /search?q=...
export async function searchAll(q) {
  const url = new URL(`${API_BASE}/search`);
  url.searchParams.set("q", q);

  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error("Search failed");
  return res.json(); // { products: [...], scripts: [...] }
}

// ===================== UPLOAD =====================
export async function uploadImage(file) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!res.ok) throw new Error("Upload failed");
  return res.json(); // { url: "http://localhost:8080/static/..." }
}

// ===================== CONTENT CRUD (ADMIN) =====================
// POST /admin/products or /admin/scripts
// body: { title, categoryId, blocks, isBreaking, breakingTitle }
export async function createContent(
  kind,
  { title, categoryId, blocks, isBreaking, breakingTitle }
) {
  const path = kind === "product" ? "products" : "scripts";

  const res = await fetch(`${API_BASE}/admin/${path}`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({
      title,
      categoryId,
      blocks,
      isBreaking: !!isBreaking,
      breakingTitle: breakingTitle || "",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Create failed");
  }
  return res.json(); // { id, slug }
}

// PUT /admin/products/:id  or  /admin/scripts/:id
// body: { title, categoryId, blocks }
export async function updateContent(kind, id, { title, categoryId, blocks }) {
  const path = kind === "product" ? "products" : "scripts";

  const res = await fetch(`${API_BASE}/admin/${path}/${id}`, {
    method: "PUT",
    headers: jsonHeaders(),
    body: JSON.stringify({
      title,
      categoryId,
      blocks,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Update failed");
  }
  return res.json(); // { ok: true, slug }
}

// DELETE /admin/products/:id  or  /admin/scripts/:id
export async function deleteContent(kind, id) {
  const path = kind === "product" ? "products" : "scripts";

  const res = await fetch(`${API_BASE}/admin/${path}/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Delete failed");
  }
  return res.json();
}

// ===================== BREAKING NEWS =====================
// GET /breaking-news (agent: active)
export async function fetchActiveBreakingNews() {
  const res = await fetch(`${API_BASE}/breaking-news`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch breaking news");
  return res.json();
}

// GET /admin/breaking-news (admin: all)
export async function fetchAllBreakingNews() {
  const res = await fetch(`${API_BASE}/admin/breaking-news`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch breaking news (admin)");
  return res.json();
}

// DELETE /admin/breaking-news/:id
export async function deleteBreakingNews(id) {
  const res = await fetch(`${API_BASE}/admin/breaking-news/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Delete breaking news failed");
  }
  return res.json();
}

// ===================== S2PASS (AGENT + ADMIN) =====================
// GET /s2pass/nodes?main=info|request|complaint&parentId=...
export async function fetchS2Nodes({ main, parentId } = {}) {
  if (!main) throw new Error("main is required");

  const url = new URL(`${API_BASE}/s2pass/nodes`);
  url.searchParams.set("main", main);
  if (parentId) url.searchParams.set("parentId", String(parentId));

  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch S2PASS nodes");
  return res.json();
}

// POST /admin/s2pass/nodes
export async function createS2Node(payload) {
  const res = await fetch(`${API_BASE}/admin/s2pass/nodes`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Create S2 node failed");
  }
  return res.json(); // { id }
}

// PUT /admin/s2pass/nodes/:id
export async function updateS2Node(id, payload) {
  const res = await fetch(`${API_BASE}/admin/s2pass/nodes/${id}`, {
    method: "PUT",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Update S2 node failed");
  }
  return res.json();
}

// DELETE /admin/s2pass/nodes/:id
export async function deleteS2Node(id) {
  const res = await fetch(`${API_BASE}/admin/s2pass/nodes/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Delete S2 node failed");
  }
  return res.json();
}

// ===== BACKWARD COMPAT (biar file lama ga error) =====
export async function deleteProduct(id) {
  return deleteContent("product", id);
}
export async function deleteScript(id) {
  return deleteContent("script", id);
}
export async function updateProduct(id, payload) {
  return updateContent("product", id, payload);
}
export async function updateScript(id, payload) {
  return updateContent("script", id, payload);
}
export async function createProduct(payload) {
  return createContent("product", payload);
}
export async function createScript(payload) {
  return createContent("script", payload);
}
