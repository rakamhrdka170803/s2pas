import { useEffect, useMemo, useState } from "react";
import { fetchS2Nodes, createS2Node, deleteS2Node } from "../api";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const MAIN_OPTIONS = [
  { value: "call", label: "CALL FLOW (Greeting / Input / dsb)" },
  { value: "info", label: "Informasi" },
  { value: "request", label: "Request" },
  { value: "complaint", label: "Complaint" },
];

export default function AdminS2PassPage() {
  const [mainType, setMainType] = useState("call");
  const [parentId, setParentId] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [pathStack, setPathStack] = useState([]); // breadcrumb

  const [label, setLabel] = useState("");
  const [nodeType, setNodeType] = useState("menu"); // menu/step

  // step fields
  const [stepKind, setStepKind] = useState("script"); // script/input/link
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  // input step fields
  const [inputKey, setInputKey] = useState("");
  const [inputLabel, setInputLabel] = useState("");
  const [inputPlaceholder, setInputPlaceholder] = useState("");
  const [inputRequired, setInputRequired] = useState(true);

  // menu ui behavior
  const [uiMode, setUIMode] = useState("tree"); // tree/accordion

  async function load() {
    const data = await fetchS2Nodes({ main: mainType, parentId });
    setNodes(data || []);
  }

  useEffect(() => {
    setParentId(null);
    setPathStack([]);
  }, [mainType]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainType, parentId]);

  const breadcrumb = useMemo(() => {
    if (pathStack.length === 0) return "ROOT";
    return "ROOT / " + pathStack.map((x) => x.label).join(" / ");
  }, [pathStack]);

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      main_type: mainType,
      parent_id: parentId,
      node_type: nodeType,
      label,
      sort_order: 0,
    };

    if (nodeType === "menu") {
      payload.ui_mode = uiMode; // tree/accordion
    } else {
      payload.step_kind = stepKind;

      if (stepKind === "script") {
        payload.title = title || null;
        payload.body = body || "";
      }

      if (stepKind === "input") {
        payload.input_key = inputKey;
        payload.input_label = inputLabel || "Input";
        payload.input_placeholder = inputPlaceholder || "";
        payload.input_required = !!inputRequired;
        payload.title = title || null;
        payload.body = body || "";
      }

      if (stepKind === "link") {
        payload.title = title || null;
        payload.body = body || "";
      }
    }

    await createS2Node(payload);

    // reset form
    setLabel("");
    setTitle("");
    setBody("");
    setInputKey("");
    setInputLabel("");
    setInputPlaceholder("");
    setInputRequired(true);
    setStepKind("script");
    setUIMode("tree");

    load();
  }

  function goRoot() {
    setParentId(null);
    setPathStack([]);
  }

  function goBack() {
    if (pathStack.length === 0) return;
    const next = [...pathStack];
    next.pop();
    setPathStack(next);
    setParentId(next.length ? next[next.length - 1].id : null);
  }

  async function openNode(n) {
    setParentId(n.id);
    setPathStack((prev) => [...prev, { id: n.id, label: n.label }]);
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <h1 className="text-xl font-semibold">
        Admin – S2PASS Navigator (Flow Builder)
      </h1>

      {/* FILTER + BREADCRUMB */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="border px-2 py-1 rounded"
          value={mainType}
          onChange={(e) => setMainType(e.target.value)}
        >
          {MAIN_OPTIONS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        <button onClick={goRoot} className="border px-3 py-1 rounded">
          Root
        </button>

        <button onClick={goBack} className="border px-3 py-1 rounded">
          Back
        </button>

        <div className="text-xs text-slate-500 ml-2">
          <b>Path:</b> {breadcrumb}
        </div>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded-2xl shadow space-y-3"
      >
        <div>
          <label className="text-xs font-semibold">Label tombol/menu *</label>
          <input
            className="border px-3 py-2 w-full rounded"
            placeholder="Contoh: Reset DIGI SMB / Greeting / dll"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />
        </div>

        <div className="grid md:grid-cols-3 gap-2">
          <div>
            <label className="text-xs font-semibold">Node Type</label>
            <select
              className="border px-3 py-2 w-full rounded"
              value={nodeType}
              onChange={(e) => setNodeType(e.target.value)}
            >
              <option value="menu">Menu (pilihan)</option>
              <option value="step">Step (Next)</option>
            </select>
          </div>

          {nodeType === "menu" && (
            <div>
              <label className="text-xs font-semibold">UI Mode</label>
              <select
                className="border px-3 py-2 w-full rounded"
                value={uiMode}
                onChange={(e) => setUIMode(e.target.value)}
              >
                <option value="tree">Tree (expand bebas)</option>
                <option value="accordion">
                  Accordion (pilih 1, yg lain nutup)
                </option>
              </select>
            </div>
          )}

          {nodeType === "step" && (
            <div>
              <label className="text-xs font-semibold">Step Kind</label>
              <select
                className="border px-3 py-2 w-full rounded"
                value={stepKind}
                onChange={(e) => setStepKind(e.target.value)}
              >
                <option value="script">Script (HTML)</option>
                <option value="input">Input (kolom isi agent)</option>
                <option value="link">Link (ke product/script)</option>
              </select>
            </div>
          )}
        </div>

        {nodeType === "step" && (
          <>
            <div>
              <label className="text-xs font-semibold">Judul Step (opsional)</label>
              <input
                className="border px-3 py-2 w-full rounded"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Greeting / Konfirmasi Data / dsb"
              />
            </div>

            {stepKind === "input" && (
              <div className="grid md:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold">Input Key *</label>
                  <input
                    className="border px-3 py-2 w-full rounded"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="contoh: customerName"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold">Input Label</label>
                  <input
                    className="border px-3 py-2 w-full rounded"
                    value={inputLabel}
                    onChange={(e) => setInputLabel(e.target.value)}
                    placeholder="contoh: Nama Nasabah"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold">Placeholder</label>
                  <input
                    className="border px-3 py-2 w-full rounded"
                    value={inputPlaceholder}
                    onChange={(e) => setInputPlaceholder(e.target.value)}
                    placeholder="contoh: ketik nama nasabah..."
                  />
                </div>

                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={inputRequired}
                    onChange={(e) => setInputRequired(e.target.checked)}
                  />
                  Wajib diisi
                </label>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold">Body (HTML / Script)</label>
              <ReactQuill value={body} onChange={setBody} className="bg-white" />
            </div>
          </>
        )}

        <button className="bg-blue-700 text-white px-4 py-2 rounded text-sm">
          Simpan Node
        </button>
      </form>

      {/* LIST */}
      <div className="bg-white rounded-2xl shadow p-3">
        <div className="text-xs text-slate-500 mb-2">
          Klik <b>Buka</b> untuk masuk child menu. (Sekarang step juga bisa punya
          child biar flow fleksibel)
        </div>

        {nodes.map((n) => (
          <div key={n.id} className="flex justify-between border-b py-2 text-sm">
            <div>
              <b>{n.label}</b>{" "}
              <span className="text-xs text-slate-500">
                ({n.node_type}
                {n.node_type === "step" && n.step_kind ? ` / ${n.step_kind}` : ""}
                {n.node_type === "menu" && n.ui_mode ? ` / ${n.ui_mode}` : ""}
                )
              </span>
            </div>

            <div className="flex gap-3">
              {/* ✅ BUKA UNTUK MENU & STEP */}
              <button
                type="button"
                onClick={() => openNode(n)}
                className="text-xs text-blue-600"
              >
                Buka
              </button>

              <button
                type="button"
                onClick={async () => {
                  await deleteS2Node(n.id);
                  load();
                }}
                className="text-xs text-red-600"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}

        {nodes.length === 0 && (
          <div className="text-xs text-slate-500 py-4 text-center">
            Belum ada node.
          </div>
        )}
      </div>
    </div>
  );
}
