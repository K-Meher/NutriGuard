// ============================================================
// Normalization & Ingredient Matching Module (Supabase + Original Schema Version)
// ============================================================
import type { Ingredient, IngredientEvidence, MatchedIngredient } from "../../db/schema.ts";
import { supabase, isSupabaseConfigured } from "../supabase.ts";

// ─── Text Normalization Utilities ───────────────────────────
export function normalizeToken(raw: string): string {
  return raw.toLowerCase().trim()
    .replace(/\s+/g, " ")
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[-‐‑‒–—―]/g, "-")
    .replace(/[^\x20-\x7E'"-]/g, " ")
    .replace(/\s+/g, " ").trim();
}

export function extractIngredientSection(rawOcrText: string): string {
  let text = rawOcrText;
  const startMatch = text.match(/(?:\\|w|\||\/)?\s*(?:ingredients?|ngredients?|eredionte|ingred[a-z]+|nered[a-z]+|ered[a-z]+)\s*[:;\-\. ]/i);
  if (startMatch && startMatch.index !== undefined) {
    text = text.substring(startMatch.index + startMatch[0].length);
  }
  const stopPatterns = [
    /\n\s*(?:allergen advice|allergen information|manufactured by|net wt|nutritional info|nutrition facts|best before|mfg|pkd|storage)/i,
    /\n\s*CONTAINS\s+(?:MILK|WHEAT|SOY|TREE|PEANUT|EGG|FISH|GLUTEN|[A-Z]+)\s+INGREDIENTS/i,
    /\b(?:contains\s*:\s*(?:wheat|milk|gluten|soy|nuts|peanut|fish|egg))/i,
    /\b(?:single consumption|per consumption|nutrients \(approx)/i,
    /[©®™]/,
  ];
  for (const pattern of stopPatterns) {
    const match = text.match(pattern);
    if (match && match.index !== undefined) {
      text = text.substring(0, match.index);
    }
  }
  return text
    .replace(/[\(\[\{]\s*Made From Corn\s*[\)\]\}]/gi, '[Made From Corn]')
    .replace(/\)\s*([A-Z])/g, "), $1")
    .replace(/\]\s*([A-Z])/g, "], $1")
    .trim();
}

const CONTINUATION_WORDS = new Set([
  "powder", "substances", "substance", "isolate", "extract", "solids",
  "flour", "syrup", "oil", "acid", "gum", "seeds", "concentrate",
  "paste", "crystals", "flakes"
]);

function unpackCompositeToken(raw: string): string[] {
  let clean = raw
    .replace(/^[\s\-•*·:=|~_§\(\[]+/, "")
    .replace(/[\.\[\]\{\}\|~_:=,]+$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (clean.length < 2) return [];

  // Strip unmatched trailing parenthesis or bracket
  const openParens = (clean.match(/\(/g) || []).length;
  const closeParens = (clean.match(/\)/g) || []).length;
  if (closeParens > openParens && clean.endsWith(")")) {
    clean = clean.slice(0, -1).trim();
  }

  const firstOpen = clean.search(/[\(\[\{]/);
  if (firstOpen === -1) {
    return [clean];
  }

  const parentName = clean.slice(0, firstOpen).trim();
  const innerContent = clean.slice(firstOpen + 1).replace(/[\)\]\}]+$/, "").trim();

  // If inner content contains multiple ingredients separated by commas, semicolons or and/or
  if (innerContent.includes(",") || innerContent.includes(";") || /\band\/or\b/i.test(innerContent)) {
    const results: string[] = [];
    if (parentName.length >= 2 && !/^(?:and|made from)$/i.test(parentName)) {
      results.push(parentName);
    }

    let subTokens: string[] = [];
    let cur = "";
    let depth = 0;
    for (let i = 0; i < innerContent.length; i++) {
      const c = innerContent[i];
      if (c === "(" || c === "[" || c === "{") depth++;
      else if (c === ")" || c === "]" || c === "}") depth = Math.max(0, depth - 1);
      if ((c === "," || c === ";" || (c === "\n" && depth === 0)) && depth === 0) {
        if (cur.trim().length > 1) subTokens.push(cur.trim());
        cur = "";
      } else {
        cur += c;
      }
    }
    if (cur.trim().length > 1) subTokens.push(cur.trim());

    for (const sub of subTokens) {
      for (const item of unpackCompositeToken(sub)) {
        results.push(item);
      }
    }
    return results;
  }

  return [clean];
}

export function tokenizeIngredients(text: string): string[] {
  let s = text.replace(/\r\n|\r/g, "\n");
  let tokens: string[] = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    if (char === '(' || char === '[' || char === '{') depth++;
    else if (char === ')' || char === ']' || char === '}') depth = Math.max(0, depth - 1);
    if ((char === ',' || char === ';' || char === '.' || (char === '\n' && depth === 0)) && depth === 0) {
      if (current.trim().length > 1) tokens.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim().length > 1) tokens.push(current.trim());
  
  // Merge continuation tokens & strip packaging noise
  const stitched: string[] = [];
  for (const t of tokens) {
    const clean = t
      .replace(/^[\s\-•*·:=|~_§\(\[]+/, "")
      .replace(/[\.\[\]\{\}\|~_:=]+$/, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (clean.length < 2) continue;
    const lower = clean.toLowerCase();
    if (CONTINUATION_WORDS.has(lower) && stitched.length > 0) {
      stitched[stitched.length - 1] += " " + clean;
    } else {
      stitched.push(clean);
    }
  }

  // Unpack composite ingredients (e.g. seasonings, cheese cultures, oil blends)
  const finalTokens: string[] = [];
  const seen = new Set<string>();
  for (const token of stitched) {
    const unpacked = unpackCompositeToken(token);
    for (const item of unpacked) {
      const subParts = item.split(/\band\/or\b|^and\s+/i).map(x => x.trim()).filter(x => x.length > 1);
      for (const p of subParts) {
        let cleanP = p.replace(/^[\s\-•*·:=|~_§\(\[]+/, "").replace(/[\.\[\]\{\}\|~_:=,]+$/, "").trim();
        const openP = (cleanP.match(/\(/g) || []).length;
        const closeP = (cleanP.match(/\)/g) || []).length;
        if (closeP > openP && cleanP.endsWith(")")) {
          cleanP = cleanP.slice(0, -1).trim();
        }
        if (cleanP.length >= 2 && !seen.has(cleanP.toLowerCase())) {
          seen.add(cleanP.toLowerCase());
          finalTokens.push(cleanP);
        }
      }
    }
  }

  return finalTokens;
}

const INS_PATTERNS = [
  /\b(?:ins|e)\s*-?\s*(\d{3,4}[a-z]?\(?[ivxlc]*\)?)/i,
  /\b(\d{3,4}[a-z]?\(?[ivxlc]*\)?)\b/,
];

export function extractAllInsNumbers(text: string): string[] {
  const sanitized = text
    .replace(/[\(\[]\s*(?:ets|et5|e4\s*1a|e\s*t\s*s|e414)\s*[\)\]]/gi, '(E414)')
    .replace(/\b(?:ets|et5|e4\s*1a)\b/gi, 'E414')
    .replace(/\b(?:es|e5)(\d{2})\b/gi, 'E3$1')
    .replace(/\be\s*s\s*(\d{2})\b/gi, 'E9$1')
    .replace(/\ben(\d{2})\b/gi, 'E1$1')
    .replace(/\be4\s*1a\b/gi, 'E414')
    .replace(/\b(?:e90!|es01|es0!)\b/gi, 'E901')
    .replace(/¢/g, "c")
    .replace(/s01/i, "501")
    .replace(/s00/i, "500");

  const matches = sanitized.match(/\b(?:ins|e)\s*-?\s*(\d{3,4}[a-z]?\(?[ivxlc]*\)?)/gi);
  if (!matches) return [];
  return matches.map(m => m.replace(/^(?:ins|e)\s*-?/i, '').replace(/\)+$/, '').toLowerCase());
}

export function extractInsNumber(text: string): string | null {
  const all = extractAllInsNumbers(text);
  if (all.length > 0) return all[0];
  const sanitized = text.replace(/¢/g, "c").replace(/s01/i, "501").replace(/s00/i, "500");
  for (const pattern of INS_PATTERNS) {
    const m = sanitized.match(pattern);
    if (m && m[1]) return m[1].toLowerCase();
  }
  return null;
}

export function extractNamePart(text: string): string {
  return text
    .replace(/\(\s*(?:INS|E[-\s]?)?\s*\d+(?:\([ivxlc]+\))?\s*\)/gi, "")
    .replace(/\(\s*\d+%\s*\)/g, "")
    .replace(/\s*\(\s*\)\s*/g, "")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (__, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(dp[i-1]![j]! + 1, dp[i]![j-1]! + 1, dp[i-1]![j-1]! + cost);
    }
  }
  return dp[m]![n]!;
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

// ─── Dual Supabase / Local Database Matching Logic ──────────
export interface NormalizationRecord {
  ingredient_id: string;
  canonical_ingredient_name: string;
  normalized_term: string;
  ins_number: string | null;
  confidence: "High" | "Medium" | "Low";
}

let cachedNormalizations: NormalizationRecord[] | null = null;
let cachedIngredients: Ingredient[] = [];
let cachedEvidence: IngredientEvidence[] = [];

export async function loadDatabaseData() {
  if (cachedNormalizations && cachedNormalizations.length > 0) return;

  if (isSupabaseConfigured) {
    try {
      const [{ data: ings, error: err1 }, { data: normalizations, error: err2 }, { data: evidence, error: err3 }] = await Promise.all([
        supabase.from('ingredients').select('*').limit(3000),
        supabase.from('ingredient_normalizations').select('*').limit(5000),
        supabase.from('ingredient_evidence').select('*').limit(3000)
      ]);

      if (!err1 && !err2 && !err3 && ings && ings.length > 0) {
        cachedIngredients = ings;
        cachedEvidence = evidence || [];
        cachedNormalizations = (normalizations || []).map((n: any) => ({
          ingredient_id: n.ingredient_id,
          canonical_ingredient_name: n.canonical_ingredient_name,
          normalized_term: n.normalized_term || normalizeToken(n.raw_label_term || ''),
          ins_number: n.ins_number,
          confidence: n.confidence === "High" ? "High" : (n.confidence === "Medium" ? "Medium" : "Low")
        }));
        return;
      }
    } catch (err) {
      console.warn("Supabase fetch warning, falling back to local SQLite database:", err);
    }
  }

  // Fallback to local SQLite database
  try {
    const { getDb } = await import("../../db/database.ts");
    const db = getDb();
    const ings = db.prepare("SELECT * FROM ingredients").all() as Ingredient[];
    const evidence = db.prepare("SELECT * FROM ingredient_evidence").all() as IngredientEvidence[];
    const normalizations = db.prepare("SELECT * FROM ingredient_normalizations").all() as any[];

    if (ings.length > 0) {
      cachedIngredients = ings;
      cachedEvidence = evidence;
      cachedNormalizations = normalizations.map((n: any) => ({
        ingredient_id: n.ingredient_id,
        canonical_ingredient_name: n.canonical_ingredient_name,
        normalized_term: n.normalized_term || normalizeToken(n.raw_label_term || ''),
        ins_number: n.ins_number,
        confidence: n.confidence === "High" ? "High" : (n.confidence === "Medium" ? "Medium" : "Low")
      }));
      return;
    }
  } catch (dbErr) {
    console.warn("Local SQLite load warning, falling back to static datasets:", dbErr);
  }

  // Fallback to public/data JSON files
  try {
    const { readFileSync } = await import("fs");
    const { resolve } = await import("path");
    const dataDir = resolve(process.cwd(), "public", "data");
    const ings = JSON.parse(readFileSync(resolve(dataDir, "ingredients.json"), "utf-8")) as Ingredient[];
    const evidence = JSON.parse(readFileSync(resolve(dataDir, "evidence.json"), "utf-8")) as IngredientEvidence[];
    const normalizations = JSON.parse(readFileSync(resolve(dataDir, "normalizations.json"), "utf-8")) as any[];

    cachedIngredients = ings;
    cachedEvidence = evidence;
    cachedNormalizations = normalizations.map((n: any) => ({
      ingredient_id: n.ingredient_id,
      canonical_ingredient_name: n.canonical_ingredient_name,
      normalized_term: n.normalized_term || normalizeToken(n.raw_label_term || ''),
      ins_number: n.ins_number,
      confidence: n.confidence === "High" ? "High" : (n.confidence === "Medium" ? "Medium" : "Low")
    }));
  } catch (fsErr) {
    console.error("Critical: Could not load ingredient database datasets:", fsErr);
  }
}

export interface NormalizationResult {
  ingredient_id: string;
  canonical_name: string;
  match_type: string;
  confidence: "High" | "Medium" | "Low";
}

export function matchTokenSync(rawToken: string, norms: NormalizationRecord[]): NormalizationResult | null {
  const namePart = extractNamePart(rawToken);
  const cleanName = namePart.replace(/^[\d\s§•*·:=|~_\(\[\-]+/, "").replace(/[\.\[\]\{\}\|~_:=]+$/, "").trim();
  const normalizedName = normalizeToken(cleanName || namePart);
  const insFromToken = extractInsNumber(rawToken);

  const exact = norms.find(n => n.normalized_term === normalizedName);
  if (exact) return { ingredient_id: exact.ingredient_id, canonical_name: exact.canonical_ingredient_name, match_type: "exact", confidence: exact.confidence };

  const parenMatch = rawToken.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1]) {
    const pNorm = normalizeToken(parenMatch[1]);
    const pRow = norms.find(n => n.normalized_term === pNorm);
    if (pRow) return { ingredient_id: pRow.ingredient_id, canonical_name: pRow.canonical_ingredient_name, match_type: "alias", confidence: pRow.confidence };
  }

  const subMatch = [...norms]
    .filter(n => n.normalized_term.length >= 4 && normalizedName.includes(n.normalized_term))
    .sort((a, b) => b.normalized_term.length - a.normalized_term.length)[0];
  if (subMatch) return { ingredient_id: subMatch.ingredient_id, canonical_name: subMatch.canonical_ingredient_name, match_type: "substring", confidence: "Medium" };

  if (insFromToken) {
    const ni = insFromToken.replace(/\s+/g, "").toLowerCase();
    const insMatch = norms.find(n => {
      const nt = (n.normalized_term || "").replace(/\s+/g, "").toLowerCase();
      const insNum = (n.ins_number || "").replace(/\s+/g, "").toLowerCase();
      return insNum === ni || nt === ni || nt === "ins" + ni || nt === "e" + ni;
    });
    if (insMatch) return { ingredient_id: insMatch.ingredient_id, canonical_name: insMatch.canonical_ingredient_name, match_type: "ins_number", confidence: insMatch.confidence };
  }

  if (normalizedName.length >= 4) {
    let bestScore = 0, bestRow: NormalizationRecord | null = null;
    for (const row of norms) {
      if (!row.normalized_term) continue;
      const score = similarity(normalizedName, row.normalized_term);
      if (score > bestScore) { bestScore = score; bestRow = row; }
    }
    if (bestScore >= 0.82 && bestRow) return { ingredient_id: bestRow.ingredient_id, canonical_name: bestRow.canonical_ingredient_name, match_type: "fuzzy", confidence: bestScore >= 0.92 ? "High" : "Low" };
  }
  return null;
}

const PACKAGING_STOP_TERMS = [
  /[©®™]/,
  /\b(?:mondelez|cadbury|nestle|parle|britannia|itc|amul)\b/i,
  /\b(?:hul|dowles|dowleswaram|kag|pmv|parsons|smart|consur|consumer)\b/i,
  /\b(?:mkt|lic|pkd|mfg|exp|batch|net\s*wt|mrp|fssai|regd|trademark)\b/i,
  /\b(?:single\s*consumption|per\s*consumption|pack|sachet|cup|water|stir)\b/i,
  /\b(?:serving|allergen|information|contains|details|contact|address|feedback)\b/i,
  /\b(?:email|website|toll|free|tel|ltd|pvt|store|cool|dry|place|sunlight)\b/i,
  /\b(?:seal\s*area|damaged|open|tear|here|instructions|directions)\b/i,
  /\b(?:thie\s*wm|abate\s*bm)\b/i,
];

function isLikelyFoodCandidate(raw: string): boolean {
  const trimmed = raw.trim();
  if (/^(?:perm|permitted|contains|added|and|with|for|the)$/i.test(trimmed)) return false;
  for (const pattern of PACKAGING_STOP_TERMS) {
    if (pattern.test(trimmed)) return false;
  }
  // Discard isolated single/double letter noise like "abate Bm © dh oT ah BE"
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  const tinyWords = words.filter(w => w.length <= 2);
  if (words.length >= 3 && (tinyWords.length / words.length) >= 0.5) return false;

  const letters = (trimmed.match(/[a-zA-Z]/g) || []).length;
  if (letters < 3) return false;
  if (letters / trimmed.length < 0.45) return false;
  if (!/[aeiouyAEIOUY]/.test(trimmed) && letters >= 4) return false;
  return true;
}

export async function processIngredientTokens(tokens: string[]): Promise<MatchedIngredient[]> {
  await loadDatabaseData();
  const norms = cachedNormalizations || [];
  
  const results: MatchedIngredient[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;

    // Specific confectionery compound token: Milk Solids & Cocoa Powder OCR merge
    if (/(?:milk['\s]*(?:sc|solids?|sols?)['\s\w]*powder|milk'sc\s*[“"']?4\s*powder)/i.test(trimmed)) {
      const milkIng = cachedIngredients.find(i => i.ingredient_id === "ING_MILKSOLIDS_01") || null;
      const milkEv = cachedEvidence.find(e => e.ingredient_id === "ING_MILKSOLIDS_01") || null;
      if (!seen.has("ING_MILKSOLIDS_01")) {
        seen.add("ING_MILKSOLIDS_01");
        results.push({
          detected_text: `Milk Solids (from "${trimmed}")`,
          match_status: "matched",
          confidence: "High",
          ingredient: milkIng,
          evidence: milkEv
        });
      }

      // If token also captured cocoa ("“4" / "powder"), also recognize Cocoa Powder
      if (/[“"']?4|cocoa/i.test(trimmed) && !seen.has("ING_COCOAPOWDER_01")) {
        const cocoaIng = cachedIngredients.find(i => i.ingredient_id === "ING_COCOAPOWDER_01") || null;
        const cocoaEv = cachedEvidence.find(e => e.ingredient_id === "ING_COCOAPOWDER_01") || null;
        seen.add("ING_COCOAPOWDER_01");
        results.push({
          detected_text: `Cocoa Powder (from "${trimmed}")`,
          match_status: "matched",
          confidence: "High",
          ingredient: cocoaIng,
          evidence: cocoaEv
        });
      }
      continue;
    }

    // Check if token contains multiple INS / E numbers (e.g. (E322, E476) or (E102, E110, E127, E133, E171))
    const insList = extractAllInsNumbers(trimmed);
    if (insList.length > 1) {
      let matchedAny = false;
      for (const ins of insList) {
        const insMatch = norms.find(n => (n.ins_number || "").replace(/\s+/g, "").toLowerCase() === ins);
        if (insMatch && !seen.has(insMatch.ingredient_id)) {
          seen.add(insMatch.ingredient_id);
          matchedAny = true;
          const ingredient = cachedIngredients.find(i => i.ingredient_id === insMatch.ingredient_id) || null;
          const evidence = cachedEvidence.find(e => e.ingredient_id === insMatch.ingredient_id) || null;
          results.push({
            detected_text: `INS ${ins.toUpperCase()} (from "${trimmed}")`,
            match_status: "matched",
            confidence: insMatch.confidence || "Medium",
            ingredient,
            evidence
          });
        }
      }
      if (matchedAny) continue;
    }

    const match = matchTokenSync(trimmed, norms);
    if (match) {
      if (seen.has(match.ingredient_id)) continue;
      seen.add(match.ingredient_id);
      
      const ingredient = cachedIngredients.find(i => i.ingredient_id === match.ingredient_id) || null;
      const evidence = cachedEvidence.find(e => e.ingredient_id === match.ingredient_id) || null;
      
      results.push({ detected_text: trimmed, match_status: match.match_type === "fuzzy" && match.confidence === "Low" ? "partial" : "matched", confidence: match.confidence, ingredient, evidence });
    } else {
      const cleaned = normalizeToken(extractNamePart(trimmed));
      if (cleaned.length >= 3 && isLikelyFoodCandidate(trimmed)) {
        results.push({ detected_text: trimmed, match_status: "unrecognized", confidence: "Unknown", ingredient: null, evidence: null });
      }
    }
  }
  return results;
}
