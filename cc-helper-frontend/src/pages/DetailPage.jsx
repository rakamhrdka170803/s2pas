import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchDetail } from "../api";
import BlockRenderer from "../components/BlockRenderer";

export default function DetailPage({ kind }) {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDetail(kind, slug)
      .then((data) => {
        setItem(data);
        setError("");
      })
      .catch(() => {
        setError("Data tidak ditemukan");
        setItem(null);
      });
  }, [kind, slug]);

  if (error) return <div className="text-red-500 text-sm">{error}</div>;
  if (!item) return <div className="text-sm text-slate-500">Loading...</div>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold mb-1">{item.title}</h1>
      <div className="text-xs text-slate-500 mb-4">
        {kind.toUpperCase()} • {item.category}
      </div>
      <div className="bg-white rounded-2xl shadow p-4">
        <BlockRenderer blocks={item.blocks} />
      </div>
    </div>
  );
}
