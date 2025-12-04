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

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  const data = await res.json();
  setToken(data.token);
  return data;
}

export async function fetchMe() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Not logged in");
  return res.json();
}

/**
 * GET /categories?kind=product|script
 * Response: [{id, kind, category, sub_category, detail_category, ...}, ...]
 */
export async function fetchCategories(kind) {
  const url = new URL(`${API_BASE}/categories`);
  url.searchParams.set("kind", kind);
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

/**
 * List product/script
 * backend: GET /products?categoryId=...&q=...
 */
export async function fetchList(
  kind,
  { categoryId, q } = {}
) {
  const path = kind === "product" ? "products" : "scripts";
  const url = new URL(`${API_BASE}/${path}`);
  if (categoryId) url.searchParams.set("categoryId", String(categoryId));
  if (q) url.searchParams.set("q", q);
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch list");
  return res.json();
}

export async function fetchDetail(kind, slug) {
  const path = kind === "product" ? "products" : "scripts";
  const res = await fetch(`${API_BASE}/${path}/slug/${slug}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Not found");
  return res.json();
}

export async function searchAll(q) {
  const url = new URL(`${API_BASE}/search`);
  url.searchParams.set("q", q);
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

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

/**
 * Create product/script
 * backend expect:
 * { title, categoryId, blocks, isBreaking, breakingTitle }
 */
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
  return res.json(); // {id, slug}
}

/**
 * Master kategori (admin)
 * POST /admin/categories
 */
export async function createCategoryMaster({
  kind,
  category,
  subCategory,
  detailCategory,
}) {
  const res = await fetch(`${API_BASE}/admin/categories`, {
    method: "POST",
    headers: jsonHeaders(), // sudah ada Content-Type: application/json
    body: JSON.stringify({
      kind,
      category,
      sub_category: subCategory,       // <-- snake_case
      detail_category: detailCategory, // <-- snake_case
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Create category failed");
  }
  return res.json();
}


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

/**
 * Breaking news (running text di header)
 * GET /breaking-news        -> active untuk agent
 * GET /admin/breaking-news  -> semua untuk admin
 * DELETE /admin/breaking-news/:id
 */

export async function fetchActiveBreakingNews() {
  const res = await fetch(`${API_BASE}/breaking-news`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch breaking news");
  return res.json(); // array
}

export async function fetchAllBreakingNews() {
  const res = await fetch(`${API_BASE}/admin/breaking-news`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch breaking news (admin)");
  return res.json();
}

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
