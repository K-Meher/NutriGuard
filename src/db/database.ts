// ============================================================
// SQLite database singleton for NutriGuard (Server-Only)
// Project uses "type":"module" (pure ESM) — so require() is NOT
// available. We use createRequire from node:module instead.
// This file is only ever dynamically imported inside server
// handler bodies — it never reaches the browser bundle.
// ============================================================
import { createRequire } from "node:module";
import type BetterSqlite3 from "better-sqlite3";

// createRequire gives us a require() function that works in ESM
const _require = createRequire(import.meta.url);

let _db: BetterSqlite3.Database | null = null;

export function getDb(): BetterSqlite3.Database {
  if (_db) return _db;

  const Database = _require("better-sqlite3") as typeof BetterSqlite3;
  const path = _require("path") as typeof import("path");

  const DB_PATH = path.resolve(process.cwd(), "nutriguard.db");
  // better-sqlite3 default export is a constructor called as a function
  _db = new (Database as unknown as new (path: string) => BetterSqlite3.Database)(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  initSchema(_db);
  return _db;
}

/** Create all tables if they don't exist yet */
function initSchema(db: BetterSqlite3.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ingredients (
      ingredient_id       TEXT PRIMARY KEY,
      ingredient_name     TEXT NOT NULL,
      aliases             TEXT,
      ins_number          TEXT,
      ingredient_type     TEXT,
      function            TEXT,
      source_organization TEXT,
      source_reference    TEXT,
      source_url          TEXT,
      official_source_link TEXT
    );

    CREATE TABLE IF NOT EXISTS ingredient_evidence (
      evidence_id         TEXT PRIMARY KEY,
      ingredient_id       TEXT NOT NULL,
      evidence_type       TEXT,
      evidence_summary    TEXT,
      source_organization TEXT,
      source_reference    TEXT,
      official_source_url TEXT,
      official_detail_link TEXT,
      evidence_status     TEXT,
      notes               TEXT,
      FOREIGN KEY (ingredient_id) REFERENCES ingredients(ingredient_id)
    );

    CREATE TABLE IF NOT EXISTS ingredient_normalizations (
      mapping_id               TEXT PRIMARY KEY,
      ingredient_id            TEXT NOT NULL,
      canonical_ingredient_name TEXT,
      raw_label_term           TEXT,
      normalized_term          TEXT,
      match_type               TEXT,
      ins_number               TEXT,
      ocr_variant              TEXT,
      confidence               TEXT,
      normalization_rule       TEXT,
      notes                    TEXT,
      FOREIGN KEY (ingredient_id) REFERENCES ingredients(ingredient_id)
    );

    CREATE TABLE IF NOT EXISTS ocr_label_samples (
      sample_id             TEXT PRIMARY KEY,
      source_type           TEXT,
      label_text            TEXT,
      ocr_text              TEXT,
      normalized_text       TEXT,
      expected_ingredient_id TEXT,
      expected_ingredient   TEXT,
      ocr_quality           TEXT,
      annotation_status     TEXT,
      notes                 TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      product_id   TEXT PRIMARY KEY,
      product_name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      brand        TEXT NOT NULL,
      category     TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scans (
      scan_id           TEXT PRIMARY KEY,
      user_id           TEXT,
      image_ref         TEXT,
      original_ocr_text TEXT,
      normalized_text   TEXT,
      scan_date         TEXT NOT NULL,
      processing_status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS scan_ingredients (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_id       TEXT NOT NULL,
      ingredient_id TEXT,
      detected_text TEXT NOT NULL,
      confidence    TEXT,
      match_status  TEXT NOT NULL DEFAULT 'unrecognized',
      FOREIGN KEY (scan_id) REFERENCES scans(scan_id)
    );

    CREATE TABLE IF NOT EXISTS otp_verifications (
      phone      TEXT PRIMARY KEY,
      otp        TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      verified   INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS users (
      email               TEXT PRIMARY KEY,
      name                TEXT NOT NULL,
      password            TEXT NOT NULL DEFAULT '',
      account_type        TEXT NOT NULL DEFAULT 'Personal',
      parent_email        TEXT,
      child_email         TEXT,
      age_group           TEXT,
      dietary_preferences TEXT,
      allergens           TEXT,
      language            TEXT DEFAULT 'English',
      created_at          INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_norm_normalized_term ON ingredient_normalizations(normalized_term);
    CREATE INDEX IF NOT EXISTS idx_norm_ingredient_id   ON ingredient_normalizations(ingredient_id);
    CREATE INDEX IF NOT EXISTS idx_norm_ins_number      ON ingredient_normalizations(ins_number);
    CREATE INDEX IF NOT EXISTS idx_evidence_ingredient_id ON ingredient_evidence(ingredient_id);
    CREATE INDEX IF NOT EXISTS idx_scan_ingredients_scan_id ON scan_ingredients(scan_id);
    CREATE INDEX IF NOT EXISTS idx_scans_scan_date ON scans(scan_date);
    CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
  `);

  // Safe migrations for pre-existing tables
  try { db.exec(`ALTER TABLE scans ADD COLUMN user_id TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE scans ADD COLUMN image_ref TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN parent_email TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN child_email TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN age_group TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN dietary_preferences TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN allergens TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN language TEXT;`); } catch (_) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);`); } catch (_) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_users_parent_email ON users(parent_email);`); } catch (_) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_users_child_email ON users(child_email);`); } catch (_) {}
}
