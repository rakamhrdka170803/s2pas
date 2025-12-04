export default function CategoryChips({ categories, value, onSelect }) {
  if (!categories || categories.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {categories.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onSelect(c)}
          className={`text-xs px-2 py-1 rounded-full border ${
            value === c
              ? "bg-blue-600 text-white border-blue-600"
              : "border-slate-300 text-slate-700 hover:bg-slate-100"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
