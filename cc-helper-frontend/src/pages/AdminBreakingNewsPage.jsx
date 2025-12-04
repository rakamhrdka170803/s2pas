import { useEffect, useState } from "react";
import { deleteBreakingNews, fetchAllBreakingNews } from "../api";

export default function AdminBreakingNewsPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirmItem, setConfirmItem] = useState(null);

  function load() {
    setLoading(true);
    fetchAllBreakingNews()
      .then((data) => {
        setList(data || []);
        setMsg("");
      })
      .catch(() => {
        setList([]);
        setMsg("Gagal load breaking news");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleConfirmDelete(id) {
    try {
      await deleteBreakingNews(id);
      setConfirmItem(null);
      load();
      // beritahu ticker utk refresh tanpa reload
      window.dispatchEvent(new Event("breaking-news-updated"));
    } catch (err) {
      alert("Gagal delete: " + err.message);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Admin: Breaking News</h1>
      {msg && (
        <div className="text-xs bg-slate-100 border border-slate-300 rounded px-3 py-2">
          {msg}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-3 text-xs">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold">Daftar Breaking News</span>
          {loading && <span className="text-slate-500">Loading...</span>}
        </div>
        <div className="max-h-[320px] overflow-auto">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="border px-2 py-1 text-left">Title</th>
                <th className="border px-2 py-1 text-left">Jenis</th>
                <th className="border px-2 py-1 text-left">Produk</th>
                <th className="border px-2 py-1 text-left w-20">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.id}>
                  <td className="border px-2 py-1">{b.title}</td>
                  <td className="border px-2 py-1">{b.kind}</td>
                  <td className="border px-2 py-1">
                    {b.product && b.product.title ? b.product.title : "-"}
                  </td>
                  <td className="border px-2 py-1">
                    <button
                      onClick={() => setConfirmItem(b)}
                      className="text-red-600 hover:underline text-[11px]"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && list.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="border px-2 py-2 text-slate-500 text-center"
                  >
                    Belum ada breaking news.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal konfirmasi */}
      {confirmItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-4 w-full max-w-sm">
            <h2 className="text-sm font-semibold mb-2">
              Hapus Breaking News?
            </h2>
            <p className="text-xs text-slate-600 mb-4">
              Anda akan menghapus:{" "}
              <span className="font-semibold">
                "{confirmItem.title}"
              </span>
              . Produk aslinya tidak akan terhapus.
            </p>
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setConfirmItem(null)}
                className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={() => handleConfirmDelete(confirmItem.id)}
                className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
