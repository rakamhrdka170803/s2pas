import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { searchAll } from "../api";
import { firstTextFromBlocks } from "../utils";

export default function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [error, setError] = useState("");

  const params = new URLSearchParams(location.search);
  const q = params.get("q") || "";

  useEffect(() => {
    if (!q) return;
    searchAll(q)
      .then((data) => {
        setProducts(data.products || []);
        setScripts(data.scripts || []);
        setError("");
      })
      .catch(() => {
        setError("Search gagal");
        setProducts([]);
        setScripts([]);
      });
  }, [q]);

  function open(kind, slug) {
    navigate(kind === "product" ? `/product/${slug}` : `/script/${slug}`);
  }

  if (!q) {
    return (
      <div className="text-sm text-slate-500">
        Masukkan keyword di search bar atas.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <h1 className="text-xl font-semibold">Hasil untuk: “{q}”</h1>
      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="flex flex-1 gap-4 min-h-[300px]">
        {/* Produk kiri */}
        <div className="flex-1 flex flex-col">
          <h2 className="font-semibold mb-2 text-sm">Produk terkait</h2>
          <div className="flex-1 border rounded-xl bg-white overflow-auto">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => open("product", p.slug)}
                className="w-full text-left px-3 py-2 border-b hover:bg-slate-50"
              >
                <div className="text-xs text-slate-500">{p.category}</div>
                <div className="font-semibold text-sm">{p.title}</div>
                <div className="text-xs text-slate-600 line-clamp-2">
                  {firstTextFromBlocks(p.blocks)}
                </div>
              </button>
            ))}
            {products.length === 0 && (
              <div className="text-xs text-slate-500 p-3">
                Tidak ada produk yang match.
              </div>
            )}
          </div>
        </div>

        {/* Script kanan */}
        <div className="flex-1 flex flex-col">
          <h2 className="font-semibold mb-2 text-sm">Script terkait</h2>
          <div className="flex-1 border rounded-xl bg-white overflow-auto">
            {scripts.map((s) => (
              <button
                key={s.id}
                onClick={() => open("script", s.slug)}
                className="w-full text-left px-3 py-2 border-b hover:bg-slate-50"
              >
                <div className="text-xs text-slate-500">{s.category}</div>
                <div className="font-semibold text-sm">{s.title}</div>
                <div className="text-xs text-slate-600 line-clamp-2">
                  {firstTextFromBlocks(s.blocks)}
                </div>
              </button>
            ))}
            {scripts.length === 0 && (
              <div className="text-xs text-slate-500 p-3">
                Tidak ada script yang match.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
