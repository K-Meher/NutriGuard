// ============================================================
// Scan History, Benchmark & Profile Server Functions
// ============================================================
import { createServerFn } from "@tanstack/react-start";
import type { ScanResult, OcrLabelSample, MatchedIngredient, Ingredient, IngredientEvidence } from "../../db/schema.ts";
import { supabase, isSupabaseConfigured } from "../supabase.ts";

export interface ScanHistoryItem {
  scan_id: string;
  scan_date: string;
  processing_status: string;
  ingredient_count: number;
  top_ingredients: string[];
}

export interface BenchmarkResult {
  sample_id: string;
  label_text: string;
  expected_ingredient_id: string | null;
  expected_ingredient: string | null;
  detected_ingredient_id: string | null;
  detected_ingredient: string | null;
  confidence: string;
  match_type: string;
  pass: boolean;
  notes: string | null;
}

// ── Core functions for internal & server use ──────────────────

export async function queryScanHistory(userEmail?: string): Promise<ScanHistoryItem[]> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from("scans").select("scan_id, scan_date, processing_status").order("scan_date", { ascending: false }).limit(50);
      if (userEmail) {
        query = query.eq("user_id", userEmail);
      }
      const { data: sbScans, error } = await query;
      if (!error && sbScans && sbScans.length > 0) {
        const scanIds = sbScans.map((s: any) => s.scan_id);
        const { data: sbIngs } = await supabase.from("scan_ingredients").select("scan_id, detected_text, match_status").in("scan_id", scanIds);
        
        const ingsByScan: Record<string, any[]> = {};
        for (const i of (sbIngs || [])) {
          if (!ingsByScan[i.scan_id]) ingsByScan[i.scan_id] = [];
          ingsByScan[i.scan_id]!.push(i);
        }
        return sbScans.map((s: any) => {
          const ings = ingsByScan[s.scan_id] || [];
          const top = ings.filter((i: any) => i.match_status !== "unrecognized").map((i: any) => i.detected_text).slice(0, 3);
          return {
            scan_id: s.scan_id,
            scan_date: s.scan_date,
            processing_status: s.processing_status,
            ingredient_count: ings.length,
            top_ingredients: top.length > 0 ? top : ings.map((i: any) => i.detected_text).slice(0, 3),
          };
        });
      }
    } catch (err) {
      console.warn("Supabase scan history query warning, falling back to SQLite:", err);
    }
  }

  try {
    const { getDb } = await import("../../db/database.ts");
    const db = getDb();

    let scans: any[] = [];
    if (userEmail) {
      scans = db.prepare(`
        SELECT scan_id, scan_date, processing_status
        FROM scans
        WHERE user_id = ?
        ORDER BY scan_date DESC
        LIMIT 50
      `).all(userEmail);
    } else {
      scans = db.prepare(`
        SELECT scan_id, scan_date, processing_status
        FROM scans
        ORDER BY scan_date DESC
        LIMIT 50
      `).all();
    }

    const getIngredientsStmt = db.prepare(`
      SELECT detected_text, match_status
      FROM scan_ingredients
      WHERE scan_id = ?
    `);

    return scans.map((s) => {
      const ings = getIngredientsStmt.all(s.scan_id) as any[];
      const top = ings
        .filter((i) => i.match_status !== "unrecognized")
        .map((i) => i.detected_text)
        .slice(0, 3);
      return {
        scan_id: s.scan_id,
        scan_date: s.scan_date,
        processing_status: s.processing_status,
        ingredient_count: ings.length,
        top_ingredients: top.length > 0 ? top : ings.map((i) => i.detected_text).slice(0, 3),
      };
    });
  } catch (e) {
    console.error("queryScanHistory error:", e);
    return [];
  }
}

export async function queryScanDetail(scanId: string, userEmail?: string): Promise<ScanResult | null> {
  try {
    const { getDb } = await import("../../db/database.ts");
    const db = getDb();

    const scan = db.prepare(`
      SELECT scan_id, user_id, original_ocr_text, normalized_text, scan_date, processing_status
      FROM scans
      WHERE scan_id = ?
    `).get(scanId) as any;

    if (!scan) return null;

    // Scoped authorization check
    if (userEmail && scan.user_id && scan.user_id !== userEmail) {
      throw new Error("Unauthorized access to private scan record.");
    }

    const rawIngredients = db.prepare(`
      SELECT ingredient_id, detected_text, confidence, match_status
      FROM scan_ingredients
      WHERE scan_id = ?
    `).all(scanId) as any[];

    const getIngStmt = db.prepare(`SELECT * FROM ingredients WHERE ingredient_id = ?`);
    const getEvStmt = db.prepare(`SELECT * FROM ingredient_evidence WHERE ingredient_id = ?`);

    const matched: MatchedIngredient[] = [];
    const unrecognized: string[] = [];

    for (const raw of rawIngredients) {
      let ing: Ingredient | null = null;
      let ev: IngredientEvidence | null = null;
      if (raw.ingredient_id) {
        ing = (getIngStmt.get(raw.ingredient_id) as Ingredient) || null;
        ev = (getEvStmt.get(raw.ingredient_id) as IngredientEvidence) || null;
      }
      if (raw.match_status === "unrecognized") {
        unrecognized.push(raw.detected_text);
      }
      matched.push({
        detected_text: raw.detected_text,
        match_status: raw.match_status,
        confidence: raw.confidence || "Unknown",
        ingredient: ing,
        evidence: ev,
      });
    }

    const { calculateSafetyScore } = await import("./safetyScore.ts");
    const safetyScore = calculateSafetyScore(matched);

    return {
      scan_id: scan.scan_id,
      user_id: scan.user_id,
      ocr_text: scan.original_ocr_text || "",
      scan_date: scan.scan_date,
      processing_status: scan.processing_status,
      ingredients: matched,
      unrecognized_tokens: unrecognized,
      safety_score: safetyScore,
    };
  } catch (e) {
    console.error("queryScanDetail error:", e);
    return null;
  }
}

export async function removeScan(scanId: string, userEmail?: string): Promise<{ success: boolean; message: string }> {
  try {
    const { getDb } = await import("../../db/database.ts");
    const db = getDb();

    const scan = db.prepare(`SELECT user_id FROM scans WHERE scan_id = ?`).get(scanId) as any;
    if (!scan) {
      return { success: false, message: "Scan not found." };
    }
    if (userEmail && scan.user_id && scan.user_id !== userEmail) {
      return { success: false, message: "Unauthorized to delete this scan." };
    }

    db.prepare(`DELETE FROM scan_ingredients WHERE scan_id = ?`).run(scanId);
    db.prepare(`DELETE FROM scans WHERE scan_id = ?`).run(scanId);

    if (isSupabaseConfigured) {
      try {
        let del = supabase.from("scans").delete().eq("scan_id", scanId);
        if (userEmail) del = del.eq("user_id", userEmail);
        await del;
        await supabase.from("scan_ingredients").delete().eq("scan_id", scanId);
      } catch (_) {}
    }

    return { success: true, message: "Scan deleted successfully." };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed to delete scan." };
  }
}

export async function executeBenchmark(sampleId?: string): Promise<BenchmarkResult[]> {
  try {
    const { getDb } = await import("../../db/database.ts");
    const db = getDb();

    let query = "SELECT sample_id, label_text, ocr_text, expected_ingredient_id, expected_ingredient FROM ocr_label_samples";
    const params: any[] = [];
    if (sampleId) {
      query += " WHERE sample_id = ?";
      params.push(sampleId);
    }
    const samples = db.prepare(query).all(...params) as any[];

    const { matchTokenSync } = await import("./normalize.ts");
    const norms = db.prepare(`
      SELECT ingredient_id, canonical_ingredient_name, normalized_term, ins_number, confidence
      FROM ingredient_normalizations
    `).all() as any[];

    const results: BenchmarkResult[] = [];
    for (const s of samples) {
      const testStr = (s.ocr_text || s.label_text || "").replace(/^Ingredients?\s*:\s*/i, "");
      const firstToken = testStr.split(/[,;\n]/)[0]?.trim() || "";
      const match = matchTokenSync(firstToken, norms);

      const detId = match?.ingredient_id || null;
      const detName = match?.canonical_name || null;
      const pass = Boolean(detId && s.expected_ingredient_id && detId === s.expected_ingredient_id);

      results.push({
        sample_id: s.sample_id,
        label_text: firstToken,
        expected_ingredient_id: s.expected_ingredient_id,
        expected_ingredient: s.expected_ingredient,
        detected_ingredient_id: detId,
        detected_ingredient: detName,
        confidence: match?.confidence || "Unknown",
        match_type: match?.match_type || "unrecognized",
        pass,
        notes: pass ? null : `Expected ${s.expected_ingredient_id} (${s.expected_ingredient}), detected ${detId} (${detName})`
      });
    }

    return results;
  } catch (err) {
    console.error("executeBenchmark error:", err);
    return [];
  }
}

export async function queryOcrSamples(): Promise<OcrLabelSample[]> {
  try {
    const { getDb } = await import("../../db/database.ts");
    const db = getDb();
    return db.prepare(`SELECT * FROM ocr_label_samples LIMIT 150`).all() as OcrLabelSample[];
  } catch {
    return [];
  }
}

export async function saveProfile(data: {
  email: string;
  name?: string;
  accountType?: string;
  parentEmail?: string;
  childEmail?: string;
  ageGroup?: string;
  dietaryPreferences?: string[];
  allergens?: string[];
  language?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const { getDb } = await import("../../db/database.ts");
    const db = getDb();
    const cleanEmail = data.email.toLowerCase().trim();

    // Check account type of target user
    const existingUser = db.prepare(`SELECT account_type, parent_email, child_email FROM users WHERE email = ?`).get(cleanEmail) as any;

    // Security Rule: If updating a Child account, parent_email and account_type cannot be modified
    let effectiveParentEmail = data.parentEmail || null;
    let effectiveAccountType = data.accountType || null;
    if (existingUser && existingUser.account_type === "Child") {
      effectiveParentEmail = existingUser.parent_email; // preserve immutable parent link
      effectiveAccountType = "Child"; // preserve child account type
    }

    db.prepare(`
      UPDATE users
      SET name = COALESCE(?, name),
          account_type = COALESCE(?, account_type),
          parent_email = COALESCE(?, parent_email),
          child_email = COALESCE(?, child_email),
          age_group = COALESCE(?, age_group),
          dietary_preferences = COALESCE(?, dietary_preferences),
          allergens = COALESCE(?, allergens),
          language = COALESCE(?, language)
      WHERE email = ?
    `).run(
      data.name || null,
      effectiveAccountType,
      effectiveParentEmail,
      data.childEmail || null,
      data.ageGroup || null,
      data.dietaryPreferences ? JSON.stringify(data.dietaryPreferences) : null,
      data.allergens ? JSON.stringify(data.allergens) : null,
      data.language || null,
      cleanEmail
    );

    if (isSupabaseConfigured) {
      try {
        await supabase.from("users").upsert({
          email: cleanEmail,
          name: data.name,
          account_type: effectiveAccountType || existingUser?.account_type,
          parent_email: effectiveParentEmail || existingUser?.parent_email,
          child_email: data.childEmail,
          age_group: data.ageGroup,
          dietary_preferences: data.dietaryPreferences ? JSON.stringify(data.dietaryPreferences) : null,
          allergens: data.allergens ? JSON.stringify(data.allergens) : null,
          language: data.language,
        });
      } catch (_) {}
    }

    return { success: true, message: "Profile updated successfully." };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed to update profile." };
  }
}

export async function fetchProfile(email: string) {
  try {
    const { getDb } = await import("../../db/database.ts");
    const db = getDb();

    const user = db.prepare(`SELECT email, name, account_type, parent_email, child_email, age_group, dietary_preferences, allergens, language FROM users WHERE email = ?`).get(email.toLowerCase().trim()) as any;
    if (!user) return null;
    return {
      email: user.email,
      name: user.name,
      accountType: user.account_type,
      parentEmail: user.parent_email || undefined,
      childEmail: user.child_email || undefined,
      ageGroup: user.age_group || undefined,
      language: user.language || "English",
      dietaryPreferences: user.dietary_preferences ? JSON.parse(user.dietary_preferences) : [],
      allergens: user.allergens ? JSON.parse(user.allergens) : [],
    };
  } catch {
    return null;
  }
}

// ── TanStack Start RPC Endpoints ──────────────────────────────

export const getScanHistory = createServerFn({ method: "GET" })
  .validator((data?: { userEmail?: string }) => data)
  .handler(async ({ data }): Promise<ScanHistoryItem[]> => {
    return queryScanHistory(data?.userEmail);
  });

export const getScanDetail = createServerFn({ method: "GET" })
  .validator((data: { scanId: string; userEmail?: string }) => data)
  .handler(async ({ data }): Promise<ScanResult | null> => {
    return queryScanDetail(data.scanId, data.userEmail);
  });

export const deleteScan = createServerFn({ method: "POST" })
  .validator((data: { scanId: string; userEmail?: string }) => data)
  .handler(async ({ data }): Promise<{ success: boolean; message: string }> => {
    return removeScan(data.scanId, data.userEmail);
  });

export const runBenchmark = createServerFn({ method: "GET" })
  .validator((data?: { sampleId?: string }) => data)
  .handler(async ({ data }): Promise<BenchmarkResult[]> => {
    return executeBenchmark(data?.sampleId);
  });

export const getOcrSamples = createServerFn({ method: "GET" }).handler(
  async (): Promise<OcrLabelSample[]> => {
    return queryOcrSamples();
  },
);

export const updateProfile = createServerFn({ method: "POST" })
  .validator((data: { email: string; name?: string; accountType?: string; parentEmail?: string; childEmail?: string; ageGroup?: string; dietaryPreferences?: string[]; allergens?: string[]; language?: string }) => data)
  .handler(async ({ data }): Promise<{ success: boolean; message: string }> => {
    return saveProfile(data);
  });

export const getProfile = createServerFn({ method: "GET" })
  .validator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    return fetchProfile(data.email);
  });
