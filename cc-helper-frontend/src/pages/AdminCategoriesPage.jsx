import { useEffect, useState } from "react";
import { createCategoryMaster, deleteCategory, fetchCategories, fetchCategoryPath } from "../api";

export default function AdminCategoriesPage() {
  const [kind, setKind] = useState("product");
  const [parentId, setParentId] = useState(null);
  const [parentPath, setParentPath] = useState("ROOT");
  const [list, setList] = useState([]);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchCategories({ kind, parentId });
      setList(data || []);
      if (!parentId) {
        setParentPath("ROOT");
      } else {
        const p = await fetchCategoryPath(parentId);
        setParentPath(p.path || "ROOT");
      }
    } catch {
      setList([]);
      setParentPath("ROOT");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setParentId(null);
  }, [kind]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, parentId]);

  async function handleAdd(e) {
    e.preventDefault();
    setMsg("");
    if (!name.trim()) return setMsg("Nama kategori wajib diisi.");

    setSaving(true);
    try {
      await createCategoryMaster({
        kind,
        name: name.trim(),
        parentId: parentId ?? null,
      });
      setName("");
      setMsg("Berhasil tambah kategori.");
      load();
    } catch (err) {
      setMsg("Gagal: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Admin: Master Kategori (Tree)</h1>

      {msg && (
        <div className="text-xs bg-slate-100 border border-slate-300 rounded px-3 py-2">
          {msg}
        </div>
      )}

      <div className="flex gap-2 items-center">
        <label className="text-sm font-medium">Jenis</label>
        <select
          className="border rounded px-2 py-1 text-xs"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          <option value="product">Product</option>
          <option value="script">Script</option>
        </select>

        <button
          onClick={() => setParentId(null)}
          className="ml-auto border px-3 py-1 rounded text-xs"
        >
          Ke ROOT
        </button>
      </div>

      <div className="text-xs text-slate-600">
        Parent saat ini: <b>{parentPath}</b>
      </div>

      <form onSubmit={handleAdd} className="bg-white rounded-xl shadow p-3 space-y-2">
        <label className="block text-xs font-medium">Tambah child di parent ini</label>
        <div className="flex gap-2">
          <input
            className="border rounded px-2 py-1 text-sm flex-1"
            placeholder="contoh: Kredit / KGB / KGB PISAN"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            disabled={saving}
            className="bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white px-4 py-1.5 rounded text-xs"
          >
            {saving ? "Menyimpan..." : "Tambah"}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl shadow p-3">
        <div className="flex justify-between items-center mb-2 text-sm">
          <span className="font-semibold">Children</span>
          {loading && <span className="text-xs text-slate-500">Loading...</span>}
        </div>

        <div className="space-y-2 text-sm">
          {list.map((c) => (
            <div key={c.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
              <div className="flex flex-col">
                <b>{c.name}</b>
                <span className="text-[11px] text-slate-500">id: {c.id}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setParentId(c.id)}
                  className="text-xs text-blue-700 hover:underline"
                >
                  Buka
                </button>
                <button
                  onClick={async () => {
                    if (!confirm(`Hapus kategori "${c.name}"? (Child akan ikut terhapus)`)) return;
                    try {
                      await deleteCategory(c.id);
                      load();
                    } catch (err) {
                      alert("Gagal delete: " + err.message);
                    }
                  }}
                  className="text-xs text-red-600 hover:underline"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}

          {!loading && list.length === 0 && (
            <div className="text-xs text-slate-500">Belum ada child di level ini.</div>
          )}
        </div>
      </div>
    </div>
  );
}
