import Database from "better-sqlite3";
const db = new Database("nutriguard.db");

// 1. Fuzzy marker test
const raw = `
— a - \neredionte: rovas) Fytract (50%) (Barley, Wheat,
Millet), Malted Barley |¢ 170), . 3%, Wheat Flour
(Atta), Milk Solids (6%), Minerals, i ol
(INS 150¢) Acidity Regulators
hrs’ oo IN sed Sai’, Cocoa
Powder, Vitamins, Nature Identical Flavouring
Substances, S0y Protein Isolate.
`;

function extractSectionSmart(text) {
  // Find Ingredients: or any OCR variant
  const marker = text.match(/(?:ingredients?|ingred[a-z]+|nered[a-z]+|ered[a-z]+)\s*[:\-–—]?\s*/i);
  if (marker && marker.index !== undefined) {
    text = text.slice(marker.index + marker[0].length);
  }
  // Strip stop patterns
  const stopPatterns = [
    /\ballergen\b/i,
    /nutrients\b/i,
    /nutritional\s+information/i,
    /nutrition\s+facts/i,
    /single\s+consumption/i,
    /per\s+consumption/i,
    /energy[-\s:]\d+/i,
  ];
  for (const p of stopPatterns) {
    const idx = text.search(p);
    if (idx !== -1) text = text.slice(0, idx);
  }
  return text.trim();
}

function splitAndStitch(text) {
  const CONTINUATION_WORDS = new Set(["powder", "substances", "isolate", "extract", "solids", "flour", "syrup", "oil", "acid", "gum", "seeds"]);
  const rawTokens = text.replace(/\r\n|\r/g, "\n").split(/[,;]\s*|\n+|(?<=\))\s+(?=[A-Z])/);
  const stitched = [];

  for (const t of rawTokens) {
    let clean = t.replace(/^[\s\-•*·:=|~_§\(\[]+/, "").replace(/[\.\[\]\{\}\|~_:=]+$/, "").trim();
    clean = clean.replace(/\s{2,}/g, " ");
    if (clean.length < 2) continue;

    const lower = clean.toLowerCase();
    if (CONTINUATION_WORDS.has(lower) && stitched.length > 0) {
      // Merge with previous token
      stitched[stitched.length - 1] += " " + clean;
    } else {
      stitched.push(clean);
    }
  }
  return stitched;
}

const section = extractSectionSmart(raw);
const tokens = splitAndStitch(section);
console.log("Tokens after smart stitching:");
console.log(tokens);
