export function firstTextFromBlocks(blocks) {
  if (!blocks || !Array.isArray(blocks)) return "";
  const b = blocks.find((x) => x.type === "text" && x.text);
  return b ? b.text : "";
}
