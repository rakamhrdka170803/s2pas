import { useEffect, useMemo, useState } from "react";
import { createContent, fetchCategories, fetchCategoryPath, uploadImage } from "../api";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    [{ color: [] }, { background: [] }],
    ["link"],
    ["clean"],
  ],
};
const quillFormats = ["header","bold","italic","underline","strike","list","bullet","align","color","background","link"];

export default function AdminEditor({ user }) {
  const [kind, setKind] = useState("product");

  // browse categories tree
  const [parentId, setParentId] = useState(null);
  const [parentPath, setParentPath] = useState("ROOT");
  const [cats, setCats] = useState([]);

  // chosen leaf
  const [categoryId, setCategoryId] = useState("");
  const [categoryPath, setCategoryPath] = useState("");

  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [isBreaking, setIsBreaking] = useState(false);
  const [breakingTitle, setBreakingTitle] = useState("");

  useEffect(() => {
    setParentId(null);
    setCategoryId("");
    setCategoryPath("");
  }, [kind]);

  async function loadCats() {
    try {
      const list = await fetchCategories({ kind, parentId });
      setCats(list || []);
      if (!parentId) setParentPath("ROOT");
      else {
        const p = await fetchCategoryPath(parentId);
        setParentPath(p.path || "ROOT");
      }
    } catch {
      setCats([]);
      setParentPath("ROOT");
    }
  }

  useEffect(() => {
    loadCats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, parentId]);

  const leafOptions = useMemo(() => {
    // “leaf” di UI ini: admin boleh pilih node manapun sebagai leaf
    // (kalau mau strict: hanya node tanpa children -> butuh endpoint leaf-check; nanti kita tambah)
    return cats.map((c) => ({ id: c.id, name: c.name }));
  }, [cats]);

  if (!user || user.role !== "admin") {
    return <div className="text-sm text-red-500">Hanya admin yang bisa membuat product/script.</div>;
  }

  function addTextBlock() { setBlocks((p) => [...p, { type: "text", text: "" }]); }
  function addImageBlock() { setBlocks((p) => [...p, { type: "image", imageUrl: "", altText: "" }]); }
  function updateBlock(idx, patch) { setBlocks((p) => p.map((b,i)=> i===idx?{...b,...patch}:b)); }
  function removeBlock(idx) { setBlocks((p)=> p.filter((_,i)=> i!==idx)); }

  async function handleUpload(idx, file) {
    try {
      const res = await uploadImage(file);
      updateBlock(idx, { imageUrl: res.url });
    } catch {
      alert("Upload gagal");
    }
  }

  async function handleChooseCategory(idStr) {
    setCategoryId(idStr);
    setCategoryPath("");
    if (!idStr) return;
    try {
      const res = await fetchCategoryPath(Number(idStr));
      setCategoryPath(res.path || "");
    } catch {
      setCategoryPath("");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (!categoryId) return setMessage("Kategori wajib dipilih.");
    if (!title.trim()) return setMessage("Judul wajib diisi.");
    if (blocks.length === 0) return setMessage("Minimal 1 blok konten (text / image).");

    setSaving(true);
    try {
      const payloadBlocks = blocks.map((b) => {
        if (b.type === "text") return { type: "text", text: b.text || "" };
        return { type: "image", imageUrl: b.imageUrl || "", altText: b.altText || "" };
      });

      const res = await createContent(kind, {
        title: title.trim(),
        categoryId: Number(categoryId),
        blocks: payloadBlocks,
        isBreaking,
        breakingTitle,
      });

      if (isBreaking) window.dispatchEvent(new Event("breaking-news-updated"));

      setMessage(`Berhasil membuat ${kind} (slug: ${res.slug})`);
      setTitle("");
      setBlocks([]);
      setIsBreaking(false);
      setBreakingTitle("");
      setCategoryId("");
      setCategoryPath("");
    } catch (err) {
      setMessage("Gagal create: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold mb-4">Admin: Create Product / Script</h1>

      {message && (
        <div className="mb-3 text-sm bg-slate-100 border border-slate-300 rounded px-3 py-2">
          {message}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-4 mb-4 space-y-2">
        <div className="flex gap-2 items-center">
          <label className="text-xs font-medium">Jenis:</label>
          <select className="border rounded px-2 py-1 text-xs" value={kind} onChange={(e)=>setKind(e.target.value)}>
            <option value="product">Product</option>
            <option value="script">Script</option>
          </select>
          <button onClick={()=>setParentId(null)} className="ml-auto border px-3 py-1 rounded text-xs">Ke ROOT</button>
        </div>

        <div className="text-xs text-slate-600">
          Browse kategori — Parent: <b>{parentPath}</b>
        </div>

        <div className="flex gap-2">
          <select
            className="border rounded px-2 py-2 text-sm flex-1"
            value=""
            onChange={(e)=> setParentId(Number(e.target.value))}
          >
            <option value="">Buka child…</option>
            {cats.map((c)=> (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            className="border rounded px-2 py-2 text-sm flex-1"
            value={categoryId}
            onChange={(e)=> handleChooseCategory(e.target.value)}
          >
            <option value="">Pilih sebagai kategori untuk konten…</option>
            {leafOptions.map((c)=> (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {categoryPath && (
          <div className="text-[11px] text-slate-500">
            Dipilih: <b>{categoryPath}</b>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl shadow p-4">
        <div>
          <label className="block text-sm font-medium mb-1">Judul</label>
          <input className="border rounded px-2 py-1 text-sm w-full" value={title} onChange={(e)=>setTitle(e.target.value)} />
        </div>

        <div className="border rounded-xl p-3 bg-red-50 flex flex-col gap-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" className="w-4 h-4" checked={isBreaking} onChange={(e)=>setIsBreaking(e.target.checked)} />
            <span>Tandai sebagai Breaking News</span>
          </label>
          {isBreaking && (
            <input
              className="border rounded px-2 py-1 text-xs w-full"
              value={breakingTitle}
              onChange={(e)=>setBreakingTitle(e.target.value)}
              placeholder="Judul ticker"
            />
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Isi Konten</span>
            <div className="flex gap-2">
              <button type="button" onClick={addTextBlock} className="text-xs px-2 py-1 rounded border border-blue-600 text-blue-700">
                + Text
              </button>
              <button type="button" onClick={addImageBlock} className="text-xs px-2 py-1 rounded border border-emerald-600 text-emerald-700">
                + Image
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {blocks.map((b, idx) => (
              <div key={idx} className="border rounded-xl p-3 bg-slate-50 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium uppercase text-slate-500">{b.type}</span>
                  <button type="button" onClick={()=>removeBlock(idx)} className="text-xs text-red-500 hover:underline">Hapus</button>
                </div>

                {b.type === "text" ? (
                  <ReactQuill
                    theme="snow"
                    value={b.text || ""}
                    onChange={(value)=>updateBlock(idx,{text:value})}
                    modules={quillModules}
                    formats={quillFormats}
                    className="bg-white"
                  />
                ) : (
                  <div className="space-y-2">
                    <input type="file" accept="image/*" onChange={(e)=>{const f=e.target.files?.[0]; if(f) handleUpload(idx,f);}} />
                    {b.imageUrl && <img src={b.imageUrl} alt={b.altText || ""} className="max-h-40 rounded border" />}
                    <input className="border rounded px-2 py-1 text-xs w-full" value={b.altText || ""} onChange={(e)=>updateBlock(idx,{altText:e.target.value})} placeholder="Alt text (opsional)" />
                  </div>
                )}
              </div>
            ))}
            {blocks.length === 0 && <div className="text-xs text-slate-500">Belum ada konten.</div>}
          </div>
        </div>

        <button type="submit" disabled={saving} className="bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white px-4 py-2 rounded text-sm">
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </form>
    </div>
  );
}
