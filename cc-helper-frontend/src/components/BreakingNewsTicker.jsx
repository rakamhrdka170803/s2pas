import { useEffect, useState } from "react";
import { fetchActiveBreakingNews } from "../api";
import { useNavigate } from "react-router-dom";

export default function BreakingNewsTicker() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchActiveBreakingNews()
      .then((data) => {
        setItems(data || []);
        setError("");
      })
      .catch(() => {
        setItems([]);
        setError("Failed to load breaking news");
      });
  }, []);

  if (!items.length) return null; // tidak ada banner kalau kosong

  function onClickItem(item) {
    // asumsi API kirim product info di item.product (slug & kind)
    if (item.product && item.product.slug) {
      const kind = item.kind === "script" ? "script" : "product";
      navigate(kind === "product"
        ? `/product/${item.product.slug}`
        : `/script/${item.product.slug}`);
    }
  }

  return (
    <div className="h-8 bg-red-700 text-white text-xs flex items-center px-4 overflow-hidden">
      <div className="font-bold mr-3 uppercase tracking-[0.2em]">
        Breaking News
      </div>
      <div className="flex-1 whitespace-nowrap overflow-hidden">
        <div className="animate-[marquee_20s_linear_infinite] flex gap-6">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onClickItem(item)}
              className="hover:underline"
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
