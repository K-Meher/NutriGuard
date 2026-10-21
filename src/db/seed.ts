// ============================================================
// Seed script: imports all four datasets into the SQLite DB
// Run with: node --loader ts-node/esm src/db/seed.ts
// OR via the npm script: npm run seed
// ============================================================
import { resolve } from "path";
import { readFileSync } from "fs";
import { getDb } from "./database.ts";

const DATA_DIR = resolve(process.cwd(), "public", "data");

function readJson<T>(filename: string): T[] {
  const path = resolve(DATA_DIR, filename);
  return JSON.parse(readFileSync(path, "utf-8")) as T[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function seedTable(
  tableName: string,
  rows: Record<string, unknown>[],
  columns: string[],
) {
  const db = getDb();
  const placeholders = columns.map(() => "?").join(", ");
  const stmt = db.prepare(
    `INSERT OR REPLACE INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders})`,
  );

  let inserted = 0;
  const insertMany = db.transaction((data: Record<string, unknown>[]) => {
    for (const row of data) {
      const values = columns.map((col) => row[col] ?? null);
      stmt.run(...values);
      inserted++;
    }
  });

  insertMany(rows);
  console.log(`✓ ${tableName}: ${inserted} rows inserted/replaced`);
}

function main() {
  console.log("🌱 Seeding NutriGuard database...\n");

  // Dataset 1 – Ingredients
  const ingredients = readJson<Record<string, unknown>>("ingredients.json");
  seedTable("ingredients", ingredients, [
    "ingredient_id",
    "ingredient_name",
    "aliases",
    "ins_number",
    "ingredient_type",
    "function",
    "source_organization",
    "source_reference",
    "source_url",
    "official_source_link",
  ]);

  // Dataset 2 – Evidence
  const evidence = readJson<Record<string, unknown>>("evidence.json");
  seedTable("ingredient_evidence", evidence, [
    "evidence_id",
    "ingredient_id",
    "evidence_type",
    "evidence_summary",
    "source_organization",
    "source_reference",
    "official_source_url",
    "official_detail_link",
    "evidence_status",
    "notes",
  ]);

  // Dataset 3 – Normalizations
  const normalizations = readJson<Record<string, unknown>>(
    "normalizations.json",
  );
  seedTable("ingredient_normalizations", normalizations, [
    "mapping_id",
    "ingredient_id",
    "canonical_ingredient_name",
    "raw_label_term",
    "normalized_term",
    "match_type",
    "ins_number",
    "ocr_variant",
    "confidence",
    "normalization_rule",
    "notes",
  ]);

  // Dataset 4 – OCR Samples
  const ocrSamples = readJson<Record<string, unknown>>("ocr_samples.json");
  seedTable("ocr_label_samples", ocrSamples, [
    "sample_id",
    "source_type",
    "label_text",
    "ocr_text",
    "normalized_text",
    "expected_ingredient_id",
    "expected_ingredient",
    "ocr_quality",
    "annotation_status",
    "notes",
  ]);

  // Verify counts
  const db = getDb();
  console.log("\n📊 Verification:");
  for (const table of [
    "ingredients",
    "ingredient_evidence",
    "ingredient_normalizations",
    "ocr_label_samples",
  ]) {
    const count = (
      db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get() as { c: number }
    ).c;
    console.log(`   ${table}: ${count} rows`);
  }

  console.log("\n✅ Database seeded successfully!");
}

main();
