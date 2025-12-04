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

export async function fetchCategories(kind) {
  const url = new URL(`${API_BASE}/categories`);
  url.searchParams.set("kind", kind);
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function fetchList(kind, { category, q } = {}) {
  const path = kind === "product" ? "products" : "scripts";
  const url = new URL(`${API_BASE}/${path}`);
  if (category) url.searchParams.set("category", category);
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

export async function createContent(kind, { title, category, blocks }) {
  const path = kind === "product" ? "products" : "scripts";
  const res = await fetch(`${API_BASE}/admin/${path}`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ title, category, blocks }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Create failed");
  }
  return res.json(); // {id, slug}
}
