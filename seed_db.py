import sqlite3
import json
import os

base_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(base_dir, 'nutriguard.db')
data_dir = os.path.join(base_dir, 'public', 'data')

conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Enable WAL mode & foreign keys
cur.execute("PRAGMA journal_mode = WAL;")
cur.execute("PRAGMA foreign_keys = ON;")

# Schema definition
cur.executescript("""
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

CREATE TABLE IF NOT EXISTS scans (
  scan_id           TEXT PRIMARY KEY,
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

CREATE INDEX IF NOT EXISTS idx_norm_normalized_term ON ingredient_normalizations(normalized_term);
CREATE INDEX IF NOT EXISTS idx_norm_ingredient_id ON ingredient_normalizations(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_norm_ins_number ON ingredient_normalizations(ins_number);
CREATE INDEX IF NOT EXISTS idx_evidence_ingredient_id ON ingredient_evidence(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_scan_ingredients_scan_id ON scan_ingredients(scan_id);
""")

def load_json(name):
    with open(os.path.join(data_dir, name), 'r', encoding='utf-8') as f:
        return json.load(f)

# Dataset 1: Ingredients
ingredients = load_json('ingredients.json')
cur.executemany("""
INSERT OR REPLACE INTO ingredients (
  ingredient_id, ingredient_name, aliases, ins_number, ingredient_type,
  function, source_organization, source_reference, source_url, official_source_link
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", [
    (
        item.get('ingredient_id'),
        item.get('ingredient_name'),
        item.get('aliases'),
        item.get('ins_number'),
        item.get('ingredient_type'),
        item.get('function'),
        item.get('source_organization'),
        item.get('source_reference'),
        item.get('source_url'),
        item.get('official_source_link')
    ) for item in ingredients
])

# Dataset 2: Evidence
evidence = load_json('evidence.json')
cur.executemany("""
INSERT OR REPLACE INTO ingredient_evidence (
  evidence_id, ingredient_id, evidence_type, evidence_summary,
  source_organization, source_reference, official_source_url,
  official_detail_link, evidence_status, notes
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", [
    (
        item.get('evidence_id'),
        item.get('ingredient_id'),
        item.get('evidence_type'),
        item.get('evidence_summary'),
        item.get('source_organization'),
        item.get('source_reference'),
        item.get('official_source_url'),
        item.get('official_detail_link'),
        item.get('evidence_status'),
        item.get('notes')
    ) for item in evidence
])

# Dataset 3: Normalizations
normalizations = load_json('normalizations.json')
cur.executemany("""
INSERT OR REPLACE INTO ingredient_normalizations (
  mapping_id, ingredient_id, canonical_ingredient_name, raw_label_term,
  normalized_term, match_type, ins_number, ocr_variant, confidence,
  normalization_rule, notes
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", [
    (
        item.get('mapping_id'),
        item.get('ingredient_id'),
        item.get('canonical_ingredient_name'),
        item.get('raw_label_term'),
        item.get('normalized_term'),
        item.get('match_type'),
        item.get('ins_number'),
        item.get('ocr_variant'),
        item.get('confidence'),
        item.get('normalization_rule'),
        item.get('notes')
    ) for item in normalizations
])

# Dataset 4: OCR Samples
ocr_samples = load_json('ocr_samples.json')
cur.executemany("""
INSERT OR REPLACE INTO ocr_label_samples (
  sample_id, source_type, label_text, ocr_text, normalized_text,
  expected_ingredient_id, expected_ingredient, ocr_quality,
  annotation_status, notes
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", [
    (
        item.get('sample_id'),
        item.get('source_type'),
        item.get('label_text'),
        item.get('ocr_text'),
        item.get('normalized_text'),
        item.get('expected_ingredient_id'),
        item.get('expected_ingredient'),
        item.get('ocr_quality'),
        item.get('annotation_status'),
        item.get('notes')
    ) for item in ocr_samples
])

conn.commit()

# Print counts
print("Verification:")
for t in ['ingredients', 'ingredient_evidence', 'ingredient_normalizations', 'ocr_label_samples']:
    cur.execute(f"SELECT COUNT(*) FROM {t}")
    print(f"  {t}: {cur.fetchone()[0]} rows")

conn.close()
print("Seeding complete.")
