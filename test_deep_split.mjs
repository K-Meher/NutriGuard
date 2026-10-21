import Database from "better-sqlite3";
const db = new Database("nutriguard.db");

// Test regex that splits on ( when followed by a list of ingredients
function cleanAndSplitTokens(text) {
  // Replace patterns like "(Barley, Wheat" with ", Barley, Wheat"
  let sanitized = text
    .replace(/\(([A-Z][a-z]+(?:\s*,\s*[A-Z][a-z]+)+)\)/g, ", $1, ")
    .replace(/\(([A-Za-z]+)\s*,\s*/g, ", $1, ");

  const CONTINUATION_WORDS = new Set(["powder", "substances", "isolate", "extract", "solids", "flour", "syrup", "oil", "acid", "gum", "seeds"]);
  const rawTokens = sanitized.replace(/\r\n|\r/g, "\n").split(/[,;]\s*|\n+|(?<=\))\s+(?=[A-Z])/);
  const stitched = [];

  for (const t of rawTokens) {
    let clean = t.replace(/^[\s\-•*·:=|~_§\(\[]+/, "").replace(/[\.\[\]\{\}\|~_:=]+$/, "").trim();
    clean = clean.replace(/\s{2,}/g, " ");
    if (clean.length < 2) continue;
    if (/^\d+(\.\d+)?%?$/.test(clean)) continue; // skip pure percentage

    const lower = clean.toLowerCase();
    if (CONTINUATION_WORDS.has(lower) && stitched.length > 0) {
      stitched[stitched.length - 1] += " " + clean;
    } else {
      stitched.push(clean);
    }
  }
  return stitched;
}

const sample = "Cereal Extract (50%) (Barley, Wheat, Millet), Malted Barley (21%), Sugar, Wheat Flour (Atta), Milk Solids (6%), Minerals, Natural Colour (INS 150c), Wheat Gluten, Acidity Regulators [INS 501(ii), INS 500(ii)], Edible Iodised Salt, Cocoa Powder, Vitamins, Nature Identical Flavouring Substances, Soy Protein Isolate.";

const res = cleanAndSplitTokens(sample);
console.log("Tokens count:", res.length);
console.log(res);
