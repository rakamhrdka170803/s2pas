import { useEffect, useMemo, useState } from "react";
import {
  fetchS2Nodes,
  createS2Node,
  updateS2Node,
  deleteS2Node,
} from "../api";

const MAIN_OPTIONS = [
  { key: "call", label: "CALL" },
  { key: "info", label: "Informasi" },
  { key: "request", label: "Request" },
  { key: "complaint", label: "Complaint" },
];

function safeHtml(html) {
  return html || "";
}

export default function S2PassPage({ user }) {
  const isAdmin = user?.role === "admin";

  const [mainType, setMainType] = useState("call");

  // stack untuk wizard (history path)
  // setiap item: { id, label }
  const [stack, setStack] = useState([]); // empty = root
  const currentParentId = stack.length ? stack[stack.length - 1].id : null;

  // children nodes dari current parent
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);

  // kalau di current parent ada STEP, kita tampilkan “step pertama” (default) sebagai currentStep
  const [currentStep, setCurrentStep] = useState(null);

  // -------------------- Admin Quick Edit state --------------------
  const [showAdminPanel, setShowAdminPanel] = useState(true);

  // edit current node (yang lagi tampil di card)
  const [editId, setEditId] = useState(null);
  const [editNodeType, setEditNodeType] = useState("step"); // step/menu
  const [editLabel, setEditLabel] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  // create child form
  const [newNodeType, setNewNodeType] = useState("step");
  const [newLabel, setNewLabel] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");

  const pathText = useMemo(() => {
    const p = stack.map((x) => x.label);
    return `${mainType.toUpperCase()} / ${p.length ? p.join(" / ") : "ROOT"}`;
  }, [mainType, stack]);

  async function load() {
    setLoading(true);
    try {
      const list = await fetchS2Nodes({ main: mainType, parentId: currentParentId });
      const arr = list || [];
      setChildren(arr);

      // cari step pertama untuk ditampilkan
      const firstStep = arr.find((x) => x.node_type === "step") || null;
      setCurrentStep(firstStep);

      // sync admin editor ke node yang tampil
      if (isAdmin) {
        const focus = firstStep || null;
        if (focus) {
          hydrateEditorFromNode(focus);
        } else {
          // kalau tidak ada step, kosongkan editor
          clearEditor();
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function hydrateEditorFromNode(n) {
    setEditId(n.id);
    setEditNodeType(n.node_type || "step");
    setEditLabel(n.label || "");
    setEditTitle(n.title || "");
    setEditBody(n.body || "");
  }

  function clearEditor() {
    setEditId(null);
    setEditNodeType("step");
    setEditLabel("");
    setEditTitle("");
    setEditBody("");
  }

  useEffect(() => {
    // reset path ketika ganti main
    setStack([]);
  }, [mainType]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainType, currentParentId]);

  // -------------------- Wizard behavior --------------------
  function goHome() {
    setStack([]);
  }

  function goBack() {
    setStack((prev) => prev.slice(0, -1));
  }

  async function openChildNode(n) {
    // masuk ke child sebagai parent baru
    setStack((prev) => [...prev, { id: n.id, label: n.label }]);
  }

  async function onNext() {
    // behavior:
    // - kalau ada menu child: tampilkan menu list (klik menu -> masuk)
    // - kalau ada step child: otomatis masuk ke step pertama child (kita treat step juga boleh punya child)
    //
    // simple rule:
    // 1) kalau ada menu pertama -> masuk menu pertama (biar agent enak)
    // 2) else kalau ada step pertama -> masuk step pertama
    const menus = children.filter((x) => x.node_type === "menu");
    const steps = children.filter((x) => x.node_type === "step");

    const nextTarget = menus[0] || steps[0];
    if (!nextTarget) return;
    await openChildNode(nextTarget);
  }

  // -------------------- Admin Actions --------------------
  async function adminSaveEdit(e) {
    e.preventDefault();
    if (!editId) return;

    await updateS2Node(editId, {
      main_type: mainType,
      parent_id: currentParentId,
      node_type: editNodeType,
      label: editLabel,
      title: editNodeType === "step" ? (editTitle || null) : null,
      body: editNodeType === "step" ? (editBody || "") : null,
      sort_order: 0,
    });

    await load();
  }

  async function adminCreateChild(e) {
    e.preventDefault();
    if (!newLabel.trim()) return;

    await createS2Node({
      main_type: mainType,
      parent_id: currentParentId, // bikin node di “posisi sekarang”
      node_type: newNodeType,
      label: newLabel,
      title: newNodeType === "step" ? (newTitle || null) : null,
      body: newNodeType === "step" ? (newBody || "") : null,
      sort_order: 0,
    });

    setNewLabel("");
    setNewTitle("");
    setNewBody("");
    setNewNodeType("step");

    await load();
  }

  async function adminDeleteCurrent() {
    // hapus node yang sedang ditampilkan (currentStep)
    if (!currentStep?.id) return;

    const ok = window.confirm(`Hapus node "${currentStep.label}"?`);
    if (!ok) return;

    await deleteS2Node(currentStep.id);
    await load();
  }

  // UI helpers
  const menuChildren = children.filter((x) => x.node_type === "menu");
  const stepChildren = children.filter((x) => x.node_type === "step");

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">Path</div>
            <div className="font-semibold">{pathText}</div>
          </div>

          <div className="flex gap-2">
            <select
              className="border rounded px-2 py-1 text-sm"
              value={mainType}
              onChange={(e) => setMainType(e.target.value)}
            >
              {MAIN_OPTIONS.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>

            <button onClick={goBack} className="border px-3 py-1 rounded text-sm">
              Back
            </button>
            <button
              onClick={goHome}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              Back to Home
            </button>
          </div>
        </div>

        {/* Menu list (kalau ada menu) */}
        {menuChildren.length > 0 && (
          <div className="border-t pt-3">
            <div className="text-xs text-slate-500 mb-2">Menu</div>
            <div className="flex flex-wrap gap-2">
              {menuChildren.map((m) => (
                <button
                  key={m.id}
                  onClick={() => openChildNode(m)}
                  className="bg-slate-50 hover:bg-blue-50 border rounded-xl px-3 py-2 text-sm"
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main content area: left (agent) + right (admin editor) */}
      <div className={`grid gap-4 ${isAdmin ? "lg:grid-cols-[1fr_420px]" : "grid-cols-1"}`}>
        {/* Agent View */}
        <div className="space-y-3">
          {/* Step card */}
          {currentStep ? (
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="text-lg font-semibold mb-2">
                {currentStep.title || currentStep.label}
              </div>

              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: safeHtml(currentStep.body) }}
              />

              <div className="mt-4">
                <button
                  onClick={onNext}
                  className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-6 text-sm text-slate-500">
              {loading ? "Loading..." : "Belum ada STEP di posisi ini. (Admin bisa tambah step di panel kanan)"}
            </div>
          )}

          {/* Child steps list (optional quick jump) */}
          {stepChildren.length > 1 && (
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="text-xs text-slate-500 mb-2">Steps di level ini</div>
              <div className="flex flex-wrap gap-2">
                {stepChildren.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setCurrentStep(s);
                      if (isAdmin) hydrateEditorFromNode(s);
                    }}
                    className={`border rounded-xl px-3 py-2 text-sm ${
                      currentStep?.id === s.id ? "bg-blue-50 border-blue-300" : "bg-slate-50"
                    }`}
                  >
                    {s.title || s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Admin Inline Editor */}
        {isAdmin && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Admin Quick Edit</div>
                <button
                  className="text-xs text-slate-600 underline"
                  onClick={() => setShowAdminPanel((v) => !v)}
                  type="button"
                >
                  {showAdminPanel ? "Hide" : "Show"}
                </button>
              </div>

              {showAdminPanel && (
                <div className="mt-3 space-y-4">
                  {/* EDIT current step */}
                  <form onSubmit={adminSaveEdit} className="border rounded-xl p-3 space-y-2">
                    <div className="text-xs font-semibold text-slate-700">
                      Edit node yang sedang tampil
                    </div>

                    {!editId ? (
                      <div className="text-xs text-slate-500">
                        Tidak ada STEP yang tampil untuk diedit.
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-medium">Node Type</label>
                            <select
                              className="border rounded px-2 py-1 w-full"
                              value={editNodeType}
                              onChange={(e) => setEditNodeType(e.target.value)}
                            >
                              <option value="step">Step</option>
                              <option value="menu">Menu</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs font-medium">Label</label>
                            <input
                              className="border rounded px-2 py-1 w-full"
                              value={editLabel}
                              onChange={(e) => setEditLabel(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        {editNodeType === "step" && (
                          <>
                            <div>
                              <label className="text-xs font-medium">Title (opsional)</label>
                              <input
                                className="border rounded px-2 py-1 w-full"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                              />
                            </div>

                            <div>
                              <label className="text-xs font-medium">Body (HTML)</label>
                              <textarea
                                className="border rounded px-2 py-2 w-full text-sm min-h-[140px]"
                                value={editBody}
                                onChange={(e) => setEditBody(e.target.value)}
                                placeholder="Isi HTML/script..."
                              />
                              <div className="text-[10px] text-slate-500 mt-1">
                                (Pakai HTML sederhana. Kalau mau ReactQuill juga bisa, bilang aja.)
                              </div>
                            </div>
                          </>
                        )}

                        <div className="flex gap-2">
                          <button className="bg-blue-700 text-white px-3 py-1.5 rounded text-sm">
                            Save Edit
                          </button>

                          <button
                            type="button"
                            onClick={adminDeleteCurrent}
                            className="bg-red-600 text-white px-3 py-1.5 rounded text-sm"
                          >
                            Hapus Node Ini
                          </button>
                        </div>
                      </>
                    )}
                  </form>

                  {/* CREATE child */}
                  <form onSubmit={adminCreateChild} className="border rounded-xl p-3 space-y-2">
                    <div className="text-xs font-semibold text-slate-700">
                      Tambah node baru di level ini
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium">Node Type</label>
                        <select
                          className="border rounded px-2 py-1 w-full"
                          value={newNodeType}
                          onChange={(e) => setNewNodeType(e.target.value)}
                        >
                          <option value="step">Step (Next)</option>
                          <option value="menu">Menu (Pilihan)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium">Label *</label>
                        <input
                          className="border rounded px-2 py-1 w-full"
                          value={newLabel}
                          onChange={(e) => setNewLabel(e.target.value)}
                          placeholder="Contoh: Greeting / Reset DIGI SMB"
                          required
                        />
                      </div>
                    </div>

                    {newNodeType === "step" && (
                      <>
                        <div>
                          <label className="text-xs font-medium">Title (opsional)</label>
                          <input
                            className="border rounded px-2 py-1 w-full"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Judul step"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium">Body (HTML)</label>
                          <textarea
                            className="border rounded px-2 py-2 w-full text-sm min-h-[120px]"
                            value={newBody}
                            onChange={(e) => setNewBody(e.target.value)}
                            placeholder="Isi HTML/script..."
                          />
                        </div>
                      </>
                    )}

                    <button className="bg-emerald-600 text-white px-3 py-1.5 rounded text-sm">
                      Tambah Node
                    </button>
                  </form>

                  {/* LIST children quick open */}
                  <div className="border rounded-xl p-3">
                    <div className="text-xs font-semibold text-slate-700 mb-2">
                      Children node di level ini
                    </div>

                    {children.length === 0 ? (
                      <div className="text-xs text-slate-500">Belum ada node.</div>
                    ) : (
                      <div className="space-y-2">
                        {children.map((n) => (
                          <div key={n.id} className="flex items-center justify-between text-sm border-b pb-2">
                            <div>
                              <b>{n.label}</b>{" "}
                              <span className="text-xs text-slate-500">({n.node_type})</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="text-xs text-blue-700 underline"
                                onClick={() => openChildNode(n)}
                              >
                                Buka
                              </button>
                              <button
                                type="button"
                                className="text-xs text-red-600 underline"
                                onClick={async () => {
                                  const ok = window.confirm(`Hapus "${n.label}"?`);
                                  if (!ok) return;
                                  await deleteS2Node(n.id);
                                  await load();
                                }}
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
