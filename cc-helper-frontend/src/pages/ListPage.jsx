import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchCategories, fetchList } from "../api";
import { firstTextFromBlocks } from "../utils";

export default function ListPage({ kind }) {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const category = searchParams.get("category") || "";
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories(kind)
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [kind]);

  useEffect(() => {
    setLoading(true);
    fetchList(kind, { category })
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [kind, category]);

  function onCategoryChange(e) {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("category", value);
    else params.delete("category");
    setSearchParams(params);
  }

  function openDetail(slug) {
    navigate(kind === "product" ? `/product/${slug}` : `/script/${slug}`);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-xl font-semibold">
          {kind === "product" ? "List Product" : "List Script"}
        </h1>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={category}
          onChange={onCategoryChange}
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="text-sm text-slate-500 mb-2">Loading...</div>}

      <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4 overflow-auto">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => openDetail(item.slug)}
            className="bg-white rounded-2xl shadow p-4 text-left hover:shadow-md transition"
          >
            <div className="text-xs text-slate-500 mb-1">{item.category}</div>
            <div className="font-semibold text-sm mb-1">{item.title}</div>
            <div className="text-xs text-slate-600 line-clamp-3">
              {firstTextFromBlocks(item.blocks)}
            </div>
          </button>
        ))}
        {!loading && items.length === 0 && (
          <div className="col-span-full text-slate-500 text-sm">
            Data kosong.
          </div>
        )}
      </div>
    </div>
  );
}
