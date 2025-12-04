import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchCategories, fetchList } from "../api";
import { firstTextFromBlocks } from "../utils";

export default function ListPage({ kind }) {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const categoryParam = searchParams.get("category") || "";
  const subParam = searchParams.get("subCategory") || "";
  const detailParam = searchParams.get("detailCategory") || "";

  useEffect(() => {
    fetchCategories(kind)
      .then((data) => setCategories(data || []))
      .catch(() => setCategories([]));
  }, [kind]);

  const categoryOptions = useMemo(() => {
    const set = new Set();
    categories.forEach((c) => set.add(c.category));
    return Array.from(set);
  }, [categories]);

  const subOptions = useMemo(() => {
    if (!categoryParam) return [];
    const set = new Set();
    categories
      .filter((c) => c.category === categoryParam)
      .forEach((c) => set.add(c.sub_category || c.subCategory));
    return Array.from(set);
  }, [categories, categoryParam]);

  const detailOptions = useMemo(() => {
    if (!categoryParam || !subParam) return [];
    const set = new Set();
    categories
      .filter(
        (c) =>
          c.category === categoryParam &&
          (c.sub_category || c.subCategory) === subParam
      )
      .forEach((c) => {
        const d = c.detail_category || c.detailCategory;
        if (d) set.add(d);
      });
    return Array.from(set);
  }, [categories, categoryParam, subParam]);

  useEffect(() => {
    if (!categories.length) {
      // tunggu kategori dulu biar bisa hitung categoryId
      return;
    }

    let categoryId;

    if (categoryParam && subParam) {
      const match = categories.find((c) => {
        const sub = c.sub_category || c.subCategory;
        const detail = c.detail_category || c.detailCategory || "";
        return (
          c.category === categoryParam &&
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
    const value = e.target.value;
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

  function openDetail(slug) {
    navigate(kind === "product" ? `/product/${slug}` : `/script/${slug}`);
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
              <option key={c} value={c}>
                {c}
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
          <button
            key={item.id}
            onClick={() => openDetail(item.slug)}
            className="bg-white rounded-2xl shadow p-4 text-left hover:shadow-md transition"
          >
            <div className="text-xs text-slate-500 mb-1">
              {item.category}
            </div>
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
