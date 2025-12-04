// src/components/BreakingNewsTicker.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchActiveBreakingNews } from "../api";

export default function BreakingNewsTicker() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = () => {
      fetchActiveBreakingNews()
        .then((data) => setItems(data || []))
        .catch(() => setItems([]));
    };

    load();

    // dengarkan event global dari admin
    const handler = () => load();
    window.addEventListener("breaking-news-updated", handler);

    return () => window.removeEventListener("breaking-news-updated", handler);
  }, []);

  const loopItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    // gandakan supaya animasi kelihatan endless
    return [...items, ...items];
  }, [items]);

  if (loopItems.length === 0) return null;

  function handleClick(bn) {
    const slug = bn.product_slug || bn.productSlug || (bn.product && bn.product.slug);
    if (!slug) return;

    const kind = bn.kind || (bn.product && bn.product.kind) || "product";
    const path = kind === "script" ? `/script/${slug}` : `/product/${slug}`;
    navigate(path);
  }

  return (
    <div className="bg-red-700 text-white h-8 flex items-center text-xs">
      <div className="px-3 font-semibold tracking-[0.2em] uppercase">
        BREAKING NEWS
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="animate-marquee flex items-center gap-4">
          {loopItems.map((bn, idx) => (
            <button
              key={`${bn.id}-${idx}`}
              type="button"
              onClick={() => handleClick(bn)}
              className="mx-2 px-3 py-0.5 rounded-full bg-red-600/80 border border-red-300 text-[11px] shadow-sm whitespace-nowrap hover:bg-red-500 hover:border-white transition cursor-pointer"
            >
              {bn.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
