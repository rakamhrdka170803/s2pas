import { useEffect, useState } from "react";
import { createContent, fetchCategories, uploadImage } from "../api";
import CategoryChips from "../components/CategoryChips";

export default function AdminEditor({ user }) {
  const [kind, setKind] = useState("product");
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCategories(kind)
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [kind]);

  if (!user || user.role !== "admin") {
    return (
      <div className="text-sm text-red-500">
        Hanya admin yang bisa membuat product/script.
      </div>
    );
  }

  function addTextBlock() {
    setBlocks((prev) => [
      ...prev,
      { type: "text", text: "" },
    ]);
  }

  function addImageBlock() {
    setBlocks((prev) => [
      ...prev,
      { type: "image", imageUrl: "", altText: "" },
    ]);
  }

  function updateBlock(idx, patch) {
    setBlocks((prev) =>
      prev.map((b, i) => (i === idx ? { ...b, ...patch } : b))
    );
  }

  function removeBlock(idx) {
    setBlocks((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleUpload(idx, file) {
    try {
      const res = await uploadImage(file);
      updateBlock(idx, { imageUrl: res.url });
    } catch (err) {
      alert("Upload gagal");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setSaving(true);
    try {
      const payloadBlocks = blocks.map((b) => {
        if (b.type === "text") {
          return {
            type: "text",
            text: b.text || "",
          };
        }
        return {
          type: "image",
          imageUrl: b.imageUrl || "",
          altText: b.altText || "",
        };
      });

      const res = await createContent(kind, {
        title,
        category,
        blocks: payloadBlocks,
      });

      setMessage(
        `Berhasil membuat ${kind} dengan slug: ${res.slug || "(lihat backend)"}`
      );
      // reset ringan
      setTitle("");
      setBlocks([]);
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
      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl shadow p-4">
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium">Jenis</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="product">Product</option>
            <option value="script">Script</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Kategori</label>
          <input
            className="border rounded px-2 py-1 text-sm w-full"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Contoh: Kredit Konsumtif, Tabungan, dll"
          />
          <CategoryChips
            categories={categories}
            value={category}
            onSelect={setCategory}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Judul</label>
          <input
            className="border rounded px-2 py-1 text-sm w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Misal: bjb T-Samsat"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Isi Konten (urutan sesuai input)</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addTextBlock}
                className="text-xs px-2 py-1 rounded border border-blue-600 text-blue-700 hover:bg-blue-50"
              >
                + Text
              </button>
              <button
                type="button"
                onClick={addImageBlock}
                className="text-xs px-2 py-1 rounded border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              >
                + Image
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {blocks.map((b, idx) => (
              <div
                key={idx}
                className="border rounded-xl p-3 bg-slate-50 flex flex-col gap-2"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium uppercase text-slate-500">
                    {b.type === "text" ? "TEXT" : "IMAGE"}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeBlock(idx)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Hapus
                  </button>
                </div>

                {b.type === "text" ? (
                  <textarea
                    className="border rounded px-2 py-1 text-sm w-full min-h-[80px]"
                    value={b.text || ""}
                    onChange={(e) =>
                      updateBlock(idx, { text: e.target.value })
                    }
                    placeholder="Isi script / deskripsi di sini..."
                  />
                ) : (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(idx, file);
                      }}
                      className="text-xs"
                    />
                    {b.imageUrl && (
                      <img
                        src={b.imageUrl}
                        alt={b.altText || ""}
                        className="max-h-40 rounded border"
                      />
                    )}
                    <input
                      className="border rounded px-2 py-1 text-xs w-full"
                      value={b.altText || ""}
                      onChange={(e) =>
                        updateBlock(idx, { altText: e.target.value })
                      }
                      placeholder="Alt text (opsional)"
                    />
                  </div>
                )}
              </div>
            ))}
            {blocks.length === 0 && (
              <div className="text-xs text-slate-500">
                Belum ada konten. Tambahkan Text / Image.
              </div>
            )}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white px-4 py-2 rounded text-sm"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
