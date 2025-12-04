// src/components/BlockRenderer.jsx
export default function BlockRenderer({ blocks = [] }) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="space-y-4">
      {blocks.map((b, idx) => {
        if (b.type === "image") {
          return (
            <div key={idx} className="flex flex-col items-start gap-1">
              {b.imageUrl && (
                <img
                  src={b.imageUrl}
                  alt={b.altText || ""}
                  className="max-w-full rounded-lg border"
                />
              )}
              {b.altText && (
                <div className="text-[11px] text-slate-500">
                  {b.altText}
                </div>
              )}
            </div>
          );
        }

        // TEXT block (HTML dari ReactQuill)
        return (
          <div
            key={idx}
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: b.text || "" }}
          />
        );
      })}
    </div>
  );
}
