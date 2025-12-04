import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchCategories, fetchList, deleteProduct } from "../api";
import { firstTextFromBlocks } from "../utils";

export default function ListPage({ kind, user }) {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [confirmProduct, setConfirmProduct] = useState(null); // modal delete product

  const navigate = useNavigate();

  const categoryParam = searchParams.get("category") || "";
  const subParam = searchParams.get("subCategory") || "";
  const detailParam = searchParams.get("detailCategory") || "";

  const isAdmin = user && user.role === "admin";

  useEffect(() => {
    fetchCategories(kind)
      .then((data) => setCategories(data || []))
      .catch(() => setCategories([]));
  }, [kind]);

  // helper title case
  function toTitle(str) {
    return (str || "")
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ");
  }

  // === CATEGORY OPTIONS (unik, case-insensitive) ===
  const categoryOptions = useMemo(() => {
    const map = new Map(); // key: lower, value: {value, label}
    categories.forEach((c) => {
      const raw = (c.category || "").trim();
      if (!raw) return;
      const key = raw.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          value: key,
          label: toTitle(raw),
        });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [categories]);

  const subOptions = useMemo(() => {
    if (!categoryParam) return [];
    const catKey = categoryParam.toLowerCase();
    const set = new Set();
    categories
      .filter(
        (c) => (c.category || "").trim().toLowerCase() === catKey
      )
      .forEach((c) => set.add(c.sub_category || c.subCategory));
    return Array.from(set);
  }, [categories, categoryParam]);

  const detailOptions = useMemo(() => {
    if (!categoryParam || !subParam) return [];
    const catKey = categoryParam.toLowerCase();
    const set = new Set();
    categories
      .filter(
        (c) =>
          (c.category || "").trim().toLowerCase() === catKey &&
          (c.sub_category || c.subCategory) === subParam
      )
      .forEach((c) => {
        const d = c.detail_category || c.detailCategory;
        if (d) set.add(d);
      });
    return Array.from(set);
  }, [categories, categoryParam, subParam]);

  // === LOAD LIST ===
  function refreshList() {
    if (!categories.length) return;

    let categoryId;

    if (categoryParam && subParam) {
      const catKey = categoryParam.toLowerCase();
      const match = categories.find((c) => {
        const cat = (c.category || "").trim().toLowerCase();
        const sub = c.sub_category || c.subCategory;
        const detail = c.detail_category || c.detailCategory || "";
        return (
          cat === catKey &&
          sub === subParam &&
          (detail || "") === (detailParam || "")
        );
      });
      if (match) categoryId = match.id;
    }

    setLoading(true);
    fetchList(kind, { categoryId })
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, categoryParam, subParam, detailParam, categories]);

  function updateParams(next) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.category != null) {
      if (next.category) params.set("category", next.category);
      else params.delete("category");
    }
    if (next.subCategory != null) {
      if (next.subCategory) params.set("subCategory", next.subCategory);
      else params.delete("subCategory");
    }
    if (next.detailCategory != null) {
      if (next.detailCategory) params.set("detailCategory", next.detailCategory);
      else params.delete("detailCategory");
    }
    setSearchParams(params);
  }

  function onCategoryChange(e) {
    const value = e.target.value; // sudah lower-case dari option.value
    updateParams({
      category: value || "",
      subCategory: "",
      detailCategory: "",
    });
  }

  function onSubCategoryChange(e) {
    const value = e.target.value;
    updateParams({
      subCategory: value || "",
      detailCategory: "",
    });
  }

  function onDetailCategoryChange(e) {
    const value = e.target.value;
    updateParams({
      detailCategory: value || "",
    });
  }

  function openDetail(slug, kindLocal) {
    navigate(kindLocal === "script" ? `/script/${slug}` : `/product/${slug}`);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h1 className="text-xl font-semibold">
          {kind === "product" ? "List Product" : "List Script"}
        </h1>

        {/* Filter Category / Sub / Detail */}
        <div className="flex flex-wrap gap-2 text-xs items-center">
          <select
            className="border rounded px-2 py-1"
            value={categoryParam}
            onChange={onCategoryChange}
          >
            <option value="">Category: Semua</option>
            {categoryOptions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            className="border rounded px-2 py-1"
            value={subParam}
            onChange={onSubCategoryChange}
            disabled={!categoryParam}
          >
            <option value="">Sub Category: Semua</option>
            {subOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            className="border rounded px-2 py-1"
            value={detailParam}
            onChange={onDetailCategoryChange}
            disabled={!categoryParam || !subParam || detailOptions.length === 0}
          >
            <option value="">Detail: Semua</option>
            {detailOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="text-sm text-slate-500 mb-2">Loading...</div>
      )}

      <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4 overflow-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl shadow p-4 text-left hover:shadow-md transition flex flex-col"
          >
            <button
              onClick={() => openDetail(item.slug, item.kind || kind)}
              className="text-left flex-1"
            >
              <div className="text-xs text-slate-500 mb-1">
                {item.category}
              </div>
              <div className="font-semibold text-sm mb-1">{item.title}</div>
              <div className="text-xs text-slate-600 line-clamp-3">
                {firstTextFromBlocks(item.blocks)}
              </div>
            </button>

            {isAdmin && (
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmProduct(item)}
                  className="text-[11px] text-red-600 hover:underline"
                >
                  Hapus
                </button>
              </div>
            )}
          </div>
        ))}
        {!loading && items.length === 0 && (
          <div className="col-span-full text-slate-500 text-sm">
            Data kosong.
          </div>
        )}
      </div>

      {/* MODAL DELETE PRODUCT */}
      {isAdmin && confirmProduct && (
        <DeleteProductModal
          product={confirmProduct}
          onClose={() => setConfirmProduct(null)}
          onDeleted={() => {
            setConfirmProduct(null);
            refreshList();
          }}
        />
      )}
    </div>
  );
}

// ==== MODAL DELETE PRODUCT ====
function DeleteProductModal({ product, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteProduct(product.id);
      onDeleted();
    } catch (err) {
      alert("Gagal delete: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-4 w-full max-w-sm text-xs">
        <h2 className="text-sm font-semibold mb-2">
          Hapus {product.kind === "script" ? "Script" : "Product"}?
        </h2>
        <p className="text-slate-600 mb-3">
          Anda akan menghapus:{" "}
          <span className="font-semibold">"{product.title}"</span>.
        </p>
        <p className="text-[11px] text-slate-500 mb-4">
          Data breaking news yang terkait juga akan ikut terhapus secara
          otomatis jika ada relasi di database (misalnya foreign key ON DELETE
          CASCADE).
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-50"
            disabled={loading}
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400"
            disabled={loading}
          >
            {loading ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}
