// ============================================================
// Local SQLite Database Inspector for NutriGuard
// Usage: node check_sqlite.cjs
// ============================================================
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'nutriguard.db');
const db = new Database(dbPath, { readonly: true });

console.log("==================================================");
console.log("    NutriGuard - Local SQLite Database Inspector   ");
console.log("==================================================\n");

// 1. Table Counts
console.log("📊 Record Counts in 'nutriguard.db':");
const tables = [
  'ingredients',
  'ingredient_evidence',
  'ingredient_normalizations',
  'users',
  'scans',
  'scan_ingredients',
  'ocr_label_samples'
];

for (const table of tables) {
  try {
    const row = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
    console.log(`   - ${table.padEnd(28)} : ${row.count} rows`);
  } catch (err) {
    console.log(`   - ${table.padEnd(28)} : (not found)`);
  }
}

// 2. Users Table
console.log("\n==================================================");
console.log("               Registered Users                   ");
console.log("==================================================");
try {
  const users = db.prepare("SELECT email, name, account_type, dietary_preferences, allergens FROM users").all();
  if (users.length === 0) {
    console.log("No registered users found in local database.");
  } else {
    users.forEach((u, idx) => {
      console.log(`${idx + 1}. ${u.name} (${u.email}) [Account: ${u.account_type}]`);
      if (u.dietary_preferences) console.log(`   Dietary: ${u.dietary_preferences}`);
      if (u.allergens) console.log(`   Allergens: ${u.allergens}`);
    });
  }
} catch (err) {
  console.log("Error querying users:", err.message);
}

// 3. Recent Scans
console.log("\n==================================================");
console.log("                 Recent Scans                     ");
console.log("==================================================");
try {
  const scans = db.prepare("SELECT scan_id, user_id, scan_date, processing_status, normalized_text FROM scans ORDER BY scan_date DESC LIMIT 5").all();
  if (scans.length === 0) {
    console.log("No scans stored yet in local SQLite database.");
  } else {
    for (const scan of scans) {
      console.log(`\n🆔 Scan ID:   ${scan.scan_id}`);
      console.log(`👤 User:      ${scan.user_id || 'Anonymous / Guest'}`);
      console.log(`📅 Date:      ${scan.scan_date}`);
      console.log(`🚦 Status:    ${scan.processing_status}`);
      console.log(`📝 Text:      ${(scan.normalized_text || '').slice(0, 80).replace(/\n/g, ' ')}...`);

      const items = db.prepare("SELECT detected_text, ingredient_id, match_status, confidence FROM scan_ingredients WHERE scan_id = ?").all(scan.scan_id);
      if (items.length > 0) {
        console.log(`   Identified Ingredients (${items.length}):`);
        items.forEach((item, idx) => {
          console.log(`   ${idx + 1}. [${item.match_status.toUpperCase()}] ${item.detected_text} (ID: ${item.ingredient_id || 'N/A'}, Conf: ${item.confidence})`);
        });
      }
    }
  }
} catch (err) {
  console.log("Error querying scans:", err.message);
}

console.log("\n==================================================");
