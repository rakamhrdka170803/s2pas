export default function BlockRenderer({ blocks }) {
  if (!blocks || blocks.length === 0) return null;
  return (
    <div className="space-y-3">
      {blocks.map((b, idx) => {
        if (b.type === "text") {
          return (
            <p
              key={idx}
              className="text-sm leading-relaxed whitespace-pre-line"
            >
              {b.text}
            </p>
          );
        }
        if (b.type === "image") {
          return (
            <div key={idx} className="flex justify-center">
              <img
                src={b.imageUrl}
                alt={b.altText || ""}
                className="max-h-72 rounded shadow-sm"
              />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
