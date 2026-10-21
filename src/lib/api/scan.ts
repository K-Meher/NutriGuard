// ============================================================
// Main Scan Server Function (Supabase Version)
// ============================================================
import { createServerFn } from "@tanstack/react-start";
import type { ScanResult } from "../../db/schema.ts";
import { supabase, isSupabaseConfigured } from "../supabase.ts";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg","image/jpg","image/png","image/webp","image/bmp","image/tiff"];

function validateImage(base64: string, mimeType: string): void {
  if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    throw new Error(`Unsupported file type: ${mimeType}. Please upload a JPEG, PNG, or WebP image.`);
  }
  const estimatedBytes = Math.ceil((base64.length * 3) / 4);
  if (estimatedBytes > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Image is too large (${Math.round(estimatedBytes / 1024 / 1024)}MB). Maximum size is 10MB.`);
  }
}

function cleanOcrText(raw: string): string {
  return raw
    .replace(/\r\n|\r/g, "\n")
    .replace(/[|l]{2,}/g, "")
    .replace(/(\n\s*){3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]/g, " ")
    .trim();
}

function scoreOcrQuality(text: string): number {
  let score = text.trim().length;
  if (/(?:\\|w|\||\/)?\s*(?:ingredients?|ngredients?|eredionte|ingred[a-z]+)/i.test(text)) score += 400;
  if (/(?:ins|e)\s*-?\s*\d{3}/i.test(text)) score += 250;
  if (/sugar|salt|oil|fat|acid|flour|powder|milk|extract|agents|colour|flavour|cocoa|vanillin|dextrin/i.test(text)) score += 150;
  return score;
}

export async function runAdaptiveOcr(imageBuffer: Buffer, mimeType: string = "image/jpeg", imageBase64?: string): Promise<string> {
  const sharp = (await import("sharp")).default;
  const { createWorker, PSM } = await import("tesseract.js");

  const worker = await createWorker("eng", 1, { logger: () => {} });
  await worker.setParameters({
    tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    preserve_interword_spaces: "1",
  });

  try {
    const meta = await sharp(imageBuffer).metadata();
    const stats = await sharp(imageBuffer).stats().catch(() => null);
    const isDark = Boolean(
      stats &&
      stats.channels.length >= 3 &&
      (0.299 * stats.channels[0]!.mean + 0.587 * stats.channels[1]!.mean + 0.114 * stats.channels[2]!.mean) < 110
    );

    const isExtremeRatio = meta.height && meta.width && (meta.height / meta.width > 1.3 || meta.width / meta.height > 1.3);

    // Pass 1: Try direct auto-oriented buffer with padding (preserves original sharp contrast & prevents edge clipping)
    const bDirect = await sharp(imageBuffer)
      .rotate()
      .extend({ top: 25, bottom: 25, left: 25, right: 25, background: "#ffffff" })
      .toBuffer();
    const rDirect = await worker.recognize(bDirect);
    let bestText = rDirect.data.text.trim();
    let bestScore = scoreOcrQuality(bestText);

    // Pass 2: If score is modest, try scaled & normalized pipeline
    if (bestScore < 600) {
      let pipeline = sharp(imageBuffer)
        .rotate()
        .extend({ top: 25, bottom: 25, left: 25, right: 25, background: "#ffffff" });

      if (meta.width && meta.height) {
        if (Math.min(meta.width, meta.height) < 1100) {
          pipeline = pipeline.resize({ width: Math.round(meta.width * 1.5), withoutEnlargement: false });
        } else if (Math.max(meta.width, meta.height) > 2800) {
          pipeline = pipeline.resize({ width: 2200, height: 2200, fit: "inside" });
        }
      }

      if (isDark) {
        pipeline = pipeline.negate({ alpha: false });
      }

      pipeline = pipeline.sharpen({ sigma: 1.2, m1: 0.5, m2: 2.0 }).normalize();

      const b0 = await pipeline.png().toBuffer();
      const r0 = await worker.recognize(b0);
      const text0 = r0.data.text.trim();
      const score0 = scoreOcrQuality(text0);
      if (score0 > bestScore) {
        bestScore = score0;
        bestText = text0;
      }
    }

    // If score is modest or packaging has vertical/extreme aspect ratio, test rotated angles (270°, 90°, 180°)
    if (bestScore < 300 || isExtremeRatio) {
      for (const angle of [270, 90, 180]) {
        try {
          const bRot = await sharp(imageBuffer).rotate(angle).png().toBuffer();
          const rRot = await worker.recognize(bRot);
          const text = rRot.data.text.trim();
          const score = scoreOcrQuality(text);
          if (score > bestScore) {
            bestScore = score;
            bestText = text;
          }
        } catch (_) {}
      }
    }

    // If still empty or very short, fallback to greyscale adaptive threshold pass
    if (bestText.length < 30) {
      try {
        const enhanced = await sharp(imageBuffer).rotate().greyscale().threshold(128).png().toBuffer();
        const rEnh = await worker.recognize(enhanced);
        if (rEnh.data.text.trim().length > bestText.length) {
          bestText = rEnh.data.text.trim();
        }
      } catch (_) {}
    }

    return bestText;
  } catch (err) {
    // Fallback: direct base64 dataUrl recognize
    try {
      const dataUrl = `data:${mimeType};base64,${imageBase64}`;
      const rFallback = await worker.recognize(dataUrl);
      return rFallback.data.text.trim();
    } catch (_) {
      throw new Error("OCR processing failed. Please try a clearer image.");
    }
  } finally {
    await worker.terminate();
  }
}

export const analyzeScan = createServerFn({ method: "POST" })
  .validator((data: { imageBase64: string; mimeType: string; userEmail?: string }) => {
    if (!data.imageBase64 || typeof data.imageBase64 !== "string") throw new Error("No image data provided.");
    if (!data.mimeType || typeof data.mimeType !== "string") throw new Error("No MIME type provided.");
    return data;
  })
  .handler(async ({ data }): Promise<ScanResult> => {
    const { randomUUID } = await import("crypto");
    const scanId = randomUUID();
    const nowIso = new Date().toISOString();
    
    const {
      extractIngredientSection,
      tokenizeIngredients,
      processIngredientTokens,
    } = await import("./normalize.ts");

    const { imageBase64, mimeType, userEmail } = data;
    validateImage(imageBase64, mimeType);

    const imageBuffer = Buffer.from(imageBase64, "base64");
    const rawOcr = await runAdaptiveOcr(imageBuffer, mimeType, imageBase64);

    const cleanedOcr = cleanOcrText(rawOcr);
    if (!cleanedOcr.trim()) {
      return {
        scan_id: scanId,
        user_id: userEmail || null,
        ocr_text: rawOcr,
        scan_date: nowIso,
        processing_status: "no_ingredients",
        ingredients: [],
        unrecognized_tokens: []
      };
    }

    const ingredientSection = extractIngredientSection(cleanedOcr);
    const tokens = tokenizeIngredients(ingredientSection || cleanedOcr);

    if (tokens.length === 0) {
      return {
        scan_id: scanId,
        user_id: userEmail || null,
        ocr_text: rawOcr,
        scan_date: nowIso,
        processing_status: "no_ingredients",
        ingredients: [],
        unrecognized_tokens: []
      };
    }

    const matchedIngredients = await processIngredientTokens(tokens);
    const recognized = matchedIngredients.filter(m => m.match_status !== "unrecognized");
    const unrecognized = matchedIngredients.filter(m => m.match_status === "unrecognized").map(m => m.detected_text);
    const status = recognized.length === 0 ? "no_ingredients" : unrecognized.length > 0 ? "partial" : "success";

    // ── Calculate Evidence-Aware Safety Score & Allergen Alerts ──
    const { calculateSafetyScore } = await import("./safetyScore.ts");
    const { fetchProfile } = await import("./ingredients.ts");

    let userAllergens: string[] = [];
    let childAllergens: string[] = [];

    if (userEmail) {
      try {
        const userProfile = await fetchProfile(userEmail);
        if (userProfile?.allergens && Array.isArray(userProfile.allergens)) {
          userAllergens = userProfile.allergens;
        }

        const { getDb } = await import("../../db/database.ts");
        const db = getDb();
        const userRow = db.prepare("SELECT child_email FROM users WHERE email = ?").get(userEmail.toLowerCase().trim()) as any;
        if (userRow?.child_email) {
          const childProfile = await fetchProfile(userRow.child_email);
          if (childProfile?.allergens && Array.isArray(childProfile.allergens)) {
            childAllergens = childProfile.allergens;
          }
        }
      } catch (profileErr) {
        console.warn("Could not fetch user/child profile for allergen matching:", profileErr);
      }
    }

    const safetyScore = calculateSafetyScore(matchedIngredients, userAllergens, childAllergens);

    // ── Persist to Database (SQLite and/or Supabase) ───────────
    try {
      const { getDb } = await import("../../db/database.ts");
      const db = getDb();
      
      db.prepare(`
        INSERT OR REPLACE INTO scans (scan_id, user_id, original_ocr_text, normalized_text, scan_date, processing_status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(scanId, userEmail || null, rawOcr, cleanedOcr, nowIso, status);

      const insertIngStmt = db.prepare(`
        INSERT INTO scan_ingredients (scan_id, ingredient_id, detected_text, confidence, match_status)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const item of matchedIngredients) {
        insertIngStmt.run(
          scanId,
          item.ingredient?.ingredient_id || null,
          item.detected_text,
          item.confidence,
          item.match_status
        );
      }
    } catch (saveErr) {
      console.warn("Failed to persist scan history to SQLite:", saveErr);
    }

    // Persist to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        await supabase.from("scans").upsert({
          scan_id: scanId,
          user_id: userEmail || null,
          original_ocr_text: rawOcr,
          normalized_text: cleanedOcr,
          scan_date: nowIso,
          processing_status: status,
        });

        const ingRows = matchedIngredients.map((item) => ({
          scan_id: scanId,
          ingredient_id: item.ingredient?.ingredient_id || null,
          detected_text: item.detected_text,
          confidence: item.confidence,
          match_status: item.match_status,
        }));

        if (ingRows.length > 0) {
          await supabase.from("scan_ingredients").insert(ingRows);
        }
      } catch (sbErr) {
        console.warn("Failed to persist scan history to Supabase:", sbErr);
      }
    }

    return {
      scan_id: scanId,
      user_id: userEmail || null,
      ocr_text: rawOcr,
      scan_date: nowIso,
      processing_status: status,
      ingredients: matchedIngredients,
      unrecognized_tokens: unrecognized,
      safety_score: safetyScore
    };
  });
