import { useEffect, useMemo, useState } from "react";
import { fetchS2Nodes, fetchDetail } from "../api";

const MAIN_OPTIONS = [
  { key: "info", label: "Informasi" },
  { key: "request", label: "Request" },
  { key: "complaint", label: "Complaint" },
];

function renderStep(node, context) {
  // simple template replace: {{customerName}}
  const name = context.customerName || "";
  const safe = (s) => (s || "").replaceAll("{{customerName}}", name);

  return (
    <div className="bg-white border rounded-2xl p-4">
      {node.title && <h3 className="font-semibold mb-2">{safe(node.title)}</h3>}
      {node.body && (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: safe(node.body) }}
        />
      )}
    </div>
  );
}

export default function S2PassPage() {
  const [context, setContext] = useState({
    customerName: "",
  });

  // navigator stack: setiap item = { main, parentId, label }
  const [stack, setStack] = useState([{ main: "call", parentId: null, label: "CALL" }]);
  const current = stack[stack.length - 1];

  const [nodes, setNodes] = useState([]);
  const [selectedAccordion, setSelectedAccordion] = useState(null); // untuk ui_mode=accordion
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchS2Nodes({ main: current.main, parentId: current.parentId });
      setNodes(data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSelectedAccordion(null);
    load();
  }, [current.main, current.parentId]);

  const breadcrumb = useMemo(() => {
    return stack.map((x) => x.label).join(" / ");
  }, [stack]);

  function goHome() {
    setContext({ customerName: "" });
    setStack([{ main: "call", parentId: null, label: "CALL" }]);
  }

  function goBack() {
    if (stack.length <= 1) return;
    const next = [...stack];
    next.pop();
    setStack(next);
  }

  // Next rule: kalau step punya child -> masuk child pertama (sort_order kecil)
  async function goNextFromStep(stepNode) {
    const children = await fetchS2Nodes({ main: current.main, parentId: stepNode.id });
    if (children && children.length > 0) {
      // masuk ke parent = stepNode.id, tapi layar berikutnya akan show children
      setStack((prev) => [...prev, { main: current.main, parentId: stepNode.id, label: stepNode.label }]);
    } else {
      // kalau ga punya child, balik satu level
      goBack();
    }
  }

  async function openMenu(menuNode) {
    setStack((prev) => [
      ...prev,
      { main: current.main, parentId: menuNode.id, label: menuNode.label },
    ]);
  }

  async function openLinkStep(stepNode) {
    // link_kind + link_slug => fetchDetail product/script
    const kind = stepNode.link_kind; // product/script
    const slug = stepNode.link_slug;
    if (!kind || !slug) return;

    const detail = await fetchDetail(kind, slug);

    // tampilkan detail sebagai "step virtual"
    const htmlBlocks = (detail.blocks || [])
      .map((b) => {
        if (b.type === "text") return b.text || "";
        if (b.type === "image") {
          const alt = b.altText || "";
          return `<img src="${b.imageUrl}" alt="${alt}" style="max-width:100%;border-radius:12px;border:1px solid #ddd;" />`;
        }
        return "";
      })
      .join("<div style='height:8px'></div>");

    const virtualNode = {
      title: detail.title,
      body: htmlBlocks,
    };

    // tampil in place: set nodes jadi 1 step virtual (tanpa nyentuh DB)
    setNodes([
      {
        id: -999,
        node_type: "step",
        step_kind: "script",
        label: detail.title,
        title: virtualNode.title,
        body: virtualNode.body,
      },
    ]);
  }

  // =============== UI RENDER ===============
  const hasCallFlow = current.main === "call";

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="bg-slate-50 border rounded-2xl p-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] text-slate-500">Path</div>
          <div className="text-sm font-semibold">{breadcrumb}</div>
          <div className="text-[11px] text-slate-500">
            Nasabah: <b>{context.customerName || "-"}</b>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={goBack} className="border px-3 py-1 rounded text-xs">
            Back
          </button>
          <button onClick={goHome} className="bg-red-600 text-white px-3 py-1 rounded text-xs">
            Back to Home
          </button>
        </div>
      </div>

      {/* Jika sudah selesai call flow, arahkan pilih main */}
      {!hasCallFlow && current.parentId === null && (
        <div className="grid md:grid-cols-3 gap-3">
          {MAIN_OPTIONS.map((m) => (
            <button
              key={m.key}
              onClick={() => setStack([{ main: m.key, parentId: null, label: m.label }])}
              className="bg-white hover:bg-blue-50 border rounded-2xl p-4 text-left"
            >
              <div className="font-semibold">{m.label}</div>
              <div className="text-xs text-slate-500">Klik untuk mulai navigasi</div>
            </button>
          ))}
        </div>
      )}

      {/* LIST */}
      <div className="space-y-3">
        {loading && <div className="text-xs text-slate-500">Loading...</div>}

        {nodes.map((n) => {
          // ===== MENU NODE =====
          if (n.node_type === "menu") {
            const mode = n.ui_mode || "tree";

            // Accordion mode: hanya 1 child menu dibuka
            return (
              <div key={n.id} className="bg-white border rounded-2xl p-3">
                <button
                  onClick={() => {
                    if (mode === "accordion") {
                      setSelectedAccordion((prev) => (prev === n.id ? null : n.id));
                    } else {
                      openMenu(n);
                    }
                  }}
                  className="w-full text-left flex items-center justify-between"
                >
                  <div className="font-semibold">{n.label}</div>
                  <div className="text-xs text-slate-500">
                    {mode === "accordion" ? (selectedAccordion === n.id ? "▲" : "▼") : "▶"}
                  </div>
                </button>

                {/* Accordion children render */}
                {mode === "accordion" && selectedAccordion === n.id && (
                  <AccordionChildren
                    main={current.main}
                    parentId={n.id}
                    context={context}
                    setContext={setContext}
                    onOpenMenu={(child) => openMenu(child)}
                    onNextStep={(step) => goNextFromStep(step)}
                    onOpenLink={(step) => openLinkStep(step)}
                  />
                )}
              </div>
            );
          }

          // ===== STEP NODE =====
          const sk = n.step_kind || "script";

          // input step
          if (sk === "input") {
            const key = n.input_key || "input";
            const label = n.input_label || "Input";
            const placeholder = n.input_placeholder || "";
            const required = !!n.input_required;

            return (
              <div key={n.id} className="space-y-2">
                {renderStep(n, context)}
                <div className="bg-white border rounded-2xl p-4 space-y-2">
                  <label className="text-xs font-semibold">{label}</label>
                  <input
                    className="border rounded px-3 py-2 text-sm w-full"
                    placeholder={placeholder}
                    value={context[key] || ""}
                    onChange={(e) => setContext((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                  <button
                    onClick={() => {
                      if (required && !(context[key] || "").trim()) return;
                      // kalau inputKey customerName, sync juga ke customerName biar dipakai template
                      if (key === "customerName") {
                        setContext((prev) => ({
                          ...prev,
                          customerName: prev[key] || "",
                        }));
                      }
                      goNextFromStep(n);
                    }}
                    className="bg-blue-700 text-white px-4 py-2 rounded text-sm"
                  >
                    Next
                  </button>
                  {required && !(context[key] || "").trim() && (
                    <div className="text-xs text-red-600">Wajib diisi dulu.</div>
                  )}
                </div>
              </div>
            );
          }

          // link step
          if (sk === "link") {
            return (
              <div key={n.id} className="space-y-2">
                {renderStep(n, context)}
                <button
                  onClick={() => openLinkStep(n)}
                  className="bg-emerald-700 text-white px-4 py-2 rounded text-sm"
                >
                  Buka Detail
                </button>
              </div>
            );
          }

          // script step
          return (
            <div key={n.id} className="space-y-2">
              {renderStep(n, context)}
              <button
                onClick={() => goNextFromStep(n)}
                className="bg-blue-700 text-white px-4 py-2 rounded text-sm"
              >
                Next
              </button>
            </div>
          );
        })}

        {!loading && nodes.length === 0 && (
          <div className="text-xs text-slate-500 text-center py-6">
            Belum ada node di level ini. (Admin belum bikin flow)
          </div>
        )}
      </div>
    </div>
  );
}

// ====== COMPONENT: AccordionChildren ======
function AccordionChildren({ main, parentId, context, setContext, onOpenMenu, onNextStep, onOpenLink }) {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetchS2Nodes({ main, parentId });
      setChildren(res || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [main, parentId]);

  if (loading) return <div className="text-xs text-slate-500 mt-2">Loading...</div>;

  return (
    <div className="mt-3 space-y-2">
      {children.map((c) => {
        if (c.node_type === "menu") {
          return (
            <button
              key={c.id}
              onClick={() => onOpenMenu(c)}
              className="w-full text-left border rounded-xl px-3 py-2 hover:bg-blue-50"
            >
              <div className="font-semibold text-sm">{c.label}</div>
            </button>
          );
        }

        const sk = c.step_kind || "script";

        if (sk === "input") {
          const key = c.input_key || "input";
          const label = c.input_label || "Input";
          const placeholder = c.input_placeholder || "";
          const required = !!c.input_required;

          return (
            <div key={c.id} className="border rounded-xl p-3 bg-slate-50 space-y-2">
              {c.title && <div className="font-semibold">{c.title}</div>}
              {c.body && (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: (c.body || "").replaceAll("{{customerName}}", context.customerName || "") }}
                />
              )}
              <label className="text-xs font-semibold">{label}</label>
              <input
                className="border rounded px-3 py-2 text-sm w-full"
                placeholder={placeholder}
                value={context[key] || ""}
                onChange={(e) => setContext((prev) => ({ ...prev, [key]: e.target.value }))}
              />
              <button
                onClick={() => {
                  if (required && !(context[key] || "").trim()) return;
                  if (key === "customerName") {
                    setContext((prev) => ({ ...prev, customerName: prev[key] || "" }));
                  }
                  onNextStep(c);
                }}
                className="bg-blue-700 text-white px-4 py-2 rounded text-sm"
              >
                Next
              </button>
              {required && !(context[key] || "").trim() && (
                <div className="text-xs text-red-600">Wajib diisi dulu.</div>
              )}
            </div>
          );
        }

        if (sk === "link") {
          return (
            <div key={c.id} className="border rounded-xl p-3 bg-slate-50 space-y-2">
              {c.title && <div className="font-semibold">{c.title}</div>}
              <button
                onClick={() => onOpenLink(c)}
                className="bg-emerald-700 text-white px-4 py-2 rounded text-sm"
              >
                Buka Detail
              </button>
            </div>
          );
        }

        return (
          <div key={c.id} className="border rounded-xl p-3 bg-slate-50 space-y-2">
            {c.title && <div className="font-semibold">{c.title}</div>}
            {c.body && (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: (c.body || "").replaceAll("{{customerName}}", context.customerName || "") }}
              />
            )}
            <button
              onClick={() => onNextStep(c)}
              className="bg-blue-700 text-white px-4 py-2 rounded text-sm"
            >
              Next
            </button>
          </div>
        );
      })}

      {children.length === 0 && (
        <div className="text-xs text-slate-500">Tidak ada child.</div>
      )}
    </div>
  );
}
