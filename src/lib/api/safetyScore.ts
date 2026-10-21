// ============================================================
// NutriGuard Evidence-Aware Safety Scoring Module
// Computes an objective, explainable food-label safety score
// based strictly on verified regulatory evidence and functional data.
// ============================================================
import type { MatchedIngredient } from "@/db/schema";

export interface ScoreFactor {
  title: string;
  impact: number; // e.g. -12, -4, 0
  description: string;
}

export interface AllergenMatch {
  ingredientName: string;
  matchedAllergen: string;
  source: string;
  isUncertain: boolean;
  isChildAlert?: boolean;
}

export interface SafetyScoreResult {
  score: number; // 0 to 100
  tier: "clean" | "moderate" | "attention";
  headline: string;
  interpretation: string;
  evidenceCoveragePercent: number;
  factors: ScoreFactor[];
  stats: {
    totalIngredients: number;
    identifiedCount: number;
    attentionCount: number;
    cleanCount: number;
    unrecognizedCount: number;
  };
  allergenAlerts: AllergenMatch[];
  disclaimer: string;
}

// Known high-attention additive patterns backed by Codex/EFSA/FSSAI evaluations
// (Artificial azo-dyes, high-potency artificial sweeteners, nitrites/nitrates, synthetic BHA/BHT)
const HIGH_ATTENTION_INS = new Set([
  // Synthetic Azo Dyes & Artificial Colors with pediatric warnings
  "102", "110", "122", "124", "129", "133", "143",
  // High-Potency Artificial Sweeteners
  "950", "951", "952", "954", "955",
  // Preservatives with strict acceptable limits
  "250", "251", "320", "321", "310", "220", "221", "222", "223", "224"
]);

// Common allergens reference map for profile matching
const ALLERGEN_KEYWORD_MAP: Record<string, string[]> = {
  "Milk / Lactose": ["milk", "dairy", "whey", "butter", "cheese", "casein", "lactose", "cream", "ghee", "curd", "yogurt"],
  "Peanuts": ["peanut", "groundnut", "arachis"],
  "Tree Nuts": ["almond", "cashew", "walnut", "pistachio", "hazelnut", "pecan", "macadamia", "nut"],
  "Soy / Soya": ["soy", "soya", "soybean", "edamame", "lecithin"],
  "Wheat / Gluten": ["wheat", "maida", "atta", "gluten", "barley", "rye", "semolina", "suji", "spelt"],
  "Egg": ["egg", "albumin", "ovalbumin", "yolk"],
  "Fish / Shellfish": ["fish", "prawn", "crab", "shrimp", "lobster", "gelatin", "gelatine"],
  "Sesame": ["sesame", "til", "gingelly"],
  "Mustard": ["mustard", "sarson", "rai"],
  "Sulphites": ["sulphite", "sulfite", "metabisulphite", "metabisulfite", "220", "221", "222", "223", "224"]
};

export function calculateSafetyScore(
  ingredients: MatchedIngredient[],
  userAllergens: string[] = [],
  childAllergens: string[] = []
): SafetyScoreResult {
  const total = ingredients.length;
  if (total === 0) {
    return {
      score: 0,
      tier: "attention",
      headline: "No Ingredients Detected",
      interpretation: "The system could not identify any ingredient text from the image.",
      evidenceCoveragePercent: 0,
      factors: [],
      stats: { totalIngredients: 0, identifiedCount: 0, attentionCount: 0, cleanCount: 0, unrecognizedCount: 0 },
      allergenAlerts: [],
      disclaimer: "This score is an informational assessment based on packaging disclosures and does not constitute medical advice."
    };
  }

  const factors: ScoreFactor[] = [];
  let score = 100;
  let identifiedCount = 0;
  let attentionCount = 0;
  let cleanCount = 0;
  let unrecognizedCount = 0;

  const allergenAlerts: AllergenMatch[] = [];

  for (let index = 0; index < ingredients.length; index++) {
    const item = ingredients[index]!;
    const text = item.detected_text.toLowerCase();
    const ing = item.ingredient;
    const ins = ing?.ins_number ? ing.ins_number.replace(/[^\d]/g, "") : null;

    if (item.match_status === "unrecognized") {
      unrecognizedCount++;
      continue;
    }

    identifiedCount++;

    // Check if ingredient requires consumer attention based on evidence
    const isHighAttention = ins && HIGH_ATTENTION_INS.has(ins);
    const isTransFatOrHydrogenated = text.includes("partially hydrogenated") || text.includes("vanaspati");

    if (isHighAttention || isTransFatOrHydrogenated) {
      attentionCount++;
      const deduction = Math.max(8, Math.round(15 / Math.log2(index + 2))); // Weight earlier listed ingredients higher
      score -= deduction;
      factors.push({
        title: `${ing?.ingredient_name || item.detected_text} (INS ${ins || "Additive"})`,
        impact: -deduction,
        description: `Flagged additive requiring dietary awareness (Function: ${ing?.function || "Additive"}). Source: ${ing?.source_organization || "Codex / FSSAI"}.`
      });
    } else {
      cleanCount++;
    }

    // Allergen matching (Evaluated separately from general product safety)
    const testAllergenList = (allergens: string[], isChild: boolean) => {
      for (const allergen of allergens) {
        const keywords = ALLERGEN_KEYWORD_MAP[allergen] || [allergen.toLowerCase()];
        for (const kw of keywords) {
          if (text.includes(kw) || (ing?.ingredient_name && ing.ingredient_name.toLowerCase().includes(kw)) || (ing?.aliases && ing.aliases.toLowerCase().includes(kw))) {
            allergenAlerts.push({
              ingredientName: ing?.ingredient_name || item.detected_text,
              matchedAllergen: allergen,
              source: ing?.source_organization || "Packaging Label",
              isUncertain: item.confidence === "Low",
              isChildAlert: isChild
            });
            break;
          }
        }
      }
    };

    if (userAllergens.length > 0) testAllergenList(userAllergens, false);
    if (childAllergens.length > 0) testAllergenList(childAllergens, true);
  }

  // Factor in unrecognized tokens as an uncertainty margin
  if (unrecognizedCount > 0) {
    const unrecDeduction = Math.min(20, unrecognizedCount * 5);
    score -= unrecDeduction;
    factors.push({
      title: `${unrecognizedCount} Unrecognized Term${unrecognizedCount > 1 ? "s" : ""}`,
      impact: -unrecDeduction,
      description: "Uncertainty adjustment for printed text that could not be confidently identified in the regulatory database."
    });
  }

  // Clamp score between 25 and 100
  score = Math.max(25, Math.min(100, Math.round(score)));

  // Coverage percentage
  const evidenceCoveragePercent = Math.round((identifiedCount / total) * 100);

  // Interpretation tier
  let tier: "clean" | "moderate" | "attention" = "clean";
  let headline = "Clean & Wholesome Profile";
  let interpretation = "Based on available ingredient information, this product contains predominantly whole foods and standard ingredients with high safety margins.";

  if (score < 65 || attentionCount >= 2) {
    tier = "attention";
    headline = "Requires Dietary Attention";
    interpretation = "Contains one or more synthetic additives, artificial sweeteners, or colors with strict regulatory provisions or specific dietary advisories.";
  } else if (score < 85 || attentionCount === 1 || unrecognizedCount >= 2) {
    tier = "moderate";
    headline = "Moderate Additive Profile";
    interpretation = "Contains standard food additives approved for regular consumption under statutory provisions.";
  }

  return {
    score,
    tier,
    headline,
    interpretation,
    evidenceCoveragePercent,
    factors,
    stats: {
      totalIngredients: total,
      identifiedCount,
      attentionCount,
      cleanCount,
      unrecognizedCount
    },
    allergenAlerts,
    disclaimer: "This safety score is an informational index derived from Codex Alimentarius and FSSAI evidence. It does not replace medical advice, individualized clinical care, or personal allergen precautions."
  };
}
