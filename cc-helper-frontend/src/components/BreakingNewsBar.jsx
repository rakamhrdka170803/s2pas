import React, { useMemo } from "react";

export default function BreakingNewsBar({ items }) {
  if (!items || items.length === 0) return null;

  // duplikat supaya bisa muter halus
  const loopItems = useMemo(
    () => [...items, ...items],
    [items]
  );

  return (
    <div className="bg-red-700 text-white h-8 flex items-center text-xs">
      <div className="px-3 font-semibold tracking-[0.2em] uppercase">
        BREAKING NEWS
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="animate-marquee gap-4">
          {loopItems.map((bn, idx) => (
            <span
              key={`${bn.id}-${idx}`}
              className="mx-2 px-3 py-0.5 rounded-full bg-red-600/80 border border-red-400 text-[11px]"
            >
              {bn.title}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
