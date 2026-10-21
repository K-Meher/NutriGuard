// ============================================================
// Database schema types for NutriGuard Objective 1
// ============================================================

/** Dataset 1 – Ingredients Master */
export interface Ingredient {
  ingredient_id: string;           // e.g. "INS001"
  ingredient_name: string;
  aliases: string | null;
  ins_number: string | null;
  ingredient_type: string | null;  // e.g. "Colour", "Preservative"
  function: string | null;
  source_organization: string | null;
  source_reference: string | null;
  source_url: string | null;
  official_source_link: string | null;
}

/** Dataset 2 – Ingredient Evidence */
export interface IngredientEvidence {
  evidence_id: string;
  ingredient_id: string;
  evidence_type: string | null;
  evidence_summary: string | null;
  source_organization: string | null;
  source_reference: string | null;
  official_source_url: string | null;
  official_detail_link: string | null;
  evidence_status: string | null;
  notes: string | null;
}

/** Dataset 3 – Normalization / Aliases */
export interface IngredientNormalization {
  mapping_id: string;
  ingredient_id: string;
  canonical_ingredient_name: string | null;
  raw_label_term: string | null;
  normalized_term: string | null;
  match_type: string | null;       // "canonical" | "alias" | "ins" | "ocr_variant"
  ins_number: string | null;
  ocr_variant: string | null;
  confidence: string | null;       // "High" | "Medium" | "Low"
  normalization_rule: string | null;
  notes: string | null;
}

/** Dataset 4 – OCR / Label Benchmark Samples */
export interface OcrLabelSample {
  sample_id: string;
  source_type: string | null;
  label_text: string | null;
  ocr_text: string | null;
  normalized_text: string | null;
  expected_ingredient_id: string | null;
  expected_ingredient: string | null;
  ocr_quality: string | null;
  annotation_status: string | null;
  notes: string | null;
}

/** Application – User Account */
export interface User {
  email: string;
  name: string;
  password?: string;
  account_type: "Personal" | "Parent" | "Child";
  parent_email?: string | null;
  child_email?: string | null;
  age_group?: string | null;
  dietary_preferences?: string | null;
  allergens?: string | null;
  language?: string | null;
  created_at: number;
}

/** Application – Packaged Food Products */
export interface Product {
  product_id: string;   // e.g. "P001"
  product_name: string;
  display_name: string;
  brand: string;
  category: string;
}

/** Application – Scan record */
export interface Scan {
  scan_id: string;
  user_id?: string | null;
  original_ocr_text: string | null;
  normalized_text: string | null;
  scan_date: string;
  processing_status: string;       // "success" | "partial" | "failed" | "no_ingredients"
}

/** Application – Per-ingredient scan result */
export interface ScanIngredient {
  id?: number;
  scan_id: string;
  ingredient_id: string | null;
  detected_text: string;
  confidence: string | null;       // "High" | "Medium" | "Low" | "Unknown"
  match_status: string;            // "matched" | "partial" | "unrecognized"
}

// ============================================================
// Composite result types (returned to the client)
// ============================================================

export interface MatchedIngredient {
  detected_text: string;
  match_status: "matched" | "partial" | "unrecognized";
  confidence: "High" | "Medium" | "Low" | "Unknown";
  ingredient: Ingredient | null;
  evidence: IngredientEvidence | null;
}

export interface ScanResult {
  scan_id: string;
  user_id?: string | null;
  ocr_text: string;
  scan_date: string;
  processing_status: string;
  ingredients: MatchedIngredient[];
  unrecognized_tokens: string[];
  safety_score?: any;
}
