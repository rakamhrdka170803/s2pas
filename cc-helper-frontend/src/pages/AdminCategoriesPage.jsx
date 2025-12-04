import { useEffect, useState } from "react";
import { createCategoryMaster, deleteCategory, fetchCategories } from "../api";

export default function AdminCategoriesPage() {
  const [kind, setKind] = useState("product");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [detailCategory, setDetailCategory] = useState("");

  const [confirmItem, setConfirmItem] = useState(null);

  function load() {
    setLoading(true);
    fetchCategories(kind)
      .then((data) => setList(data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [kind]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");

    if (!category.trim() || !subCategory.trim()) {
      setMsg("Category & Sub Category wajib diisi");
      return;
    }

    setSaving(true);
    try {
      await createCategoryMaster({
        kind,
        category: category.trim(),
        subCategory: subCategory.trim(),
        detailCategory: detailCategory.trim() || undefined,
      });
      setCategory("");
      setSubCategory("");
      setDetailCategory("");
      load();
      setMsg("Berhasil membuat kategori");
    } catch (err) {
      setMsg("Gagal create: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete(id) {
    try {
      await deleteCategory(id);
      setConfirmItem(null);
      load();
    } catch (err) {
      alert("Gagal delete: " + err.message);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Admin: Master Kategori</h1>

      {msg && (
        <div className="text-xs bg-slate-100 border border-slate-300 rounded px-3 py-2">
          {msg}
        </div>
      )}

      {/* Form create */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow p-3 space-y-3 text-sm"
      >
        <div className="flex gap-3 items-center">
          <label className="text-sm font-medium">Jenis</label>
          <select
            className="border rounded px-2 py-1 text-xs"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="product">Product</option>
            <option value="script">Script</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium mb-1">
              Category *
            </label>
            <input
              className="border rounded px-2 py-1 text-xs w-full"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Contoh: Kredit"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">
              Sub Category *
            </label>
            <input
              className="border rounded px-2 py-1 text-xs w-full"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              placeholder="Contoh: KGB"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">
              Detail Category (opsional)
            </label>
            <input
              className="border rounded px-2 py-1 text-xs w-full"
              value={detailCategory}
              onChange={(e) => setDetailCategory(e.target.value)}
              placeholder="Contoh: KGB PISAN"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-1 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white px-4 py-1.5 rounded text-xs"
        >
          {saving ? "Menyimpan..." : "Tambah Kategori"}
        </button>
      </form>

      {/* List */}
      <div className="bg-white rounded-xl shadow p-3">
        <div className="flex justify-between items-center mb-2 text-sm">
          <span className="font-semibold">Daftar Kategori ({kind})</span>
          {loading && (
            <span className="text-xs text-slate-500">Loading...</span>
          )}
        </div>
        <div className="max-h-[320px] overflow-auto text-xs">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="border px-2 py-1 text-left">Category</th>
                <th className="border px-2 py-1 text-left">Sub</th>
                <th className="border px-2 py-1 text-left">Detail</th>
                <th className="border px-2 py-1 text-left w-20">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td className="border px-2 py-1">{c.category}</td>
                  <td className="border px-2 py-1">
                    {c.sub_category || c.subCategory}
                  </td>
                  <td className="border px-2 py-1">
                    {c.detail_category || c.detailCategory || "-"}
                  </td>
                  <td className="border px-2 py-1">
                    <button
                      onClick={() => setConfirmItem(c)}
                      className="text-[11px] text-red-600 hover:underline"
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
                    Belum ada kategori.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DELETE CATEGORY */}
      {confirmItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-4 w-full max-w-sm text-xs">
            <h2 className="text-sm font-semibold mb-2">
              Hapus Kategori?
            </h2>
            <p className="text-slate-600 mb-3">
              Anda akan menghapus kategori:
              <br />
              <span className="font-semibold">
                {confirmItem.category} /{" "}
                {confirmItem.sub_category || confirmItem.subCategory}
                {confirmItem.detail_category || confirmItem.detailCategory
                  ? " / " +
                    (confirmItem.detail_category ||
                      confirmItem.detailCategory)
                  : ""}
              </span>
            </p>
            <p className="text-[11px] text-slate-500 mb-4">
              Jika kategori masih digunakan oleh produk/script, database bisa
              menolak penghapusan (constraint foreign key).
            </p>
            <div className="flex justify-end gap-2">
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
