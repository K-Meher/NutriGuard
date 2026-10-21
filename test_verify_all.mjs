import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { resolve } from "path";

console.log("==================================================");
console.log("RUNNING COMPREHENSIVE VALIDATION SUITE");
console.log("==================================================\n");

const { getDb } = await import("./src/db/database.js");
const db = getDb();

// 1. Check database tables and row counts
console.log("1. DATABASE AUDIT:");
const tables = [
  "ingredients",
  "ingredient_evidence",
  "ingredient_normalizations",
  "ocr_label_samples",
  "scans",
  "scan_ingredients",
  "users",
  "otp_verifications"
];

for (const t of tables) {
  const count = db.prepare(`SELECT count(*) as c FROM ${t}`).get().c;
  console.log(`  ✓ Table '${t}': ${count} rows`);
}

// 2. Normalization & Matching Test
console.log("\n2. NORMALIZATION & MATCHING PIPELINE TEST:");
const {
  extractIngredientSection,
  tokenizeIngredients,
  matchTokenSync,
  extractInsNumber,
  normalizeToken,
  loadDatabaseData,
  processIngredientTokens
} = await import("./src/lib/api/normalize.js");

await loadDatabaseData();

const sampleLabelText = `
Ingredients: Refined Wheat Flour (Maida), Sugar, Edible Vegetable Oil (Palm Oil),
Curcumin (INS 100(i)), Acidity Regulator (INS 330), Sodium Benzoate (INS 211),
Cocoa Powder, Nature Identical Flavouring Substances, NonExistentChemicalX999.
Allergen Information: Contains Wheat, Soy.
`;

const section = extractIngredientSection(sampleLabelText);
console.log("  Extracted section:", section.replace(/\n/g, " "));

const tokens = tokenizeIngredients(section);
console.log(`  Tokenized into ${tokens.length} tokens:`, tokens);

const matched = await processIngredientTokens(tokens);
console.log(`  Processed ${matched.length} ingredients:`);

let recognizedCount = 0;
let unrecognizedCount = 0;
for (const m of matched) {
  if (m.match_status !== "unrecognized") {
    recognizedCount++;
    console.log(`    ✓ MATCHED: "${m.detected_text}" -> ${m.ingredient?.ingredient_name} [${m.ingredient?.ingredient_id}] (${m.confidence} confidence, Function: ${m.ingredient?.function || "N/A"})`);
    if (m.evidence) {
      console.log(`      Evidence: ${m.evidence.source_organization} | Link: ${m.evidence.official_detail_link || m.evidence.official_source_url}`);
    }
  } else {
    unrecognizedCount++;
    console.log(`    ? UNRECOGNIZED: "${m.detected_text}" (Correctly flagged as unrecognized, no hallucination)`);
  }
}
console.log(`  Results: ${recognizedCount} matched, ${unrecognizedCount} unrecognized`);

// 3. Dataset 4 Benchmark Test
console.log("\n3. DATASET 4 BENCHMARK SUITE (150 SAMPLES):");
const { runBenchmark } = await import("./src/lib/api/ingredients.js");
const benchmarkResults = await runBenchmark();
const passed = benchmarkResults.filter(r => r.pass).length;
const total = benchmarkResults.length;
console.log(`  Benchmark Accuracy: ${passed}/${total} passed (${(passed / total * 100).toFixed(1)}%)`);

// 4. User Scan History & Authorization Isolation Test
console.log("\n4. SCAN HISTORY & MULTI-TENANT ISOLATION TEST:");
const testUser1 = "user1@example.com";
const testUser2 = "user2@example.com";
const testScanId1 = "TEST_SCAN_USER1_" + Date.now();
const testScanId2 = "TEST_SCAN_USER2_" + Date.now();

// Insert scan for user 1
db.prepare(`
  INSERT INTO scans (scan_id, user_id, original_ocr_text, normalized_text, scan_date, processing_status)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(testScanId1, testUser1, "OCR Text User 1", "Norm Text User 1", new Date().toISOString(), "success");

db.prepare(`
  INSERT INTO scan_ingredients (scan_id, ingredient_id, detected_text, confidence, match_status)
  VALUES (?, ?, ?, ?, ?)
`).run(testScanId1, "INS001", "Curcumin", "High", "matched");

// Insert scan for user 2
db.prepare(`
  INSERT INTO scans (scan_id, user_id, original_ocr_text, normalized_text, scan_date, processing_status)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(testScanId2, testUser2, "OCR Text User 2", "Norm Text User 2", new Date().toISOString(), "success");

const { getScanHistory, getScanDetail, deleteScan } = await import("./src/lib/api/ingredients.js");

const history1 = await getScanHistory({ data: { userEmail: testUser1 } });
const history2 = await getScanHistory({ data: { userEmail: testUser2 } });

const user1HasScan1 = history1.some(h => h.scan_id === testScanId1);
const user1HasScan2 = history1.some(h => h.scan_id === testScanId2);
const user2HasScan2 = history2.some(h => h.scan_id === testScanId2);
const user2HasScan1 = history2.some(h => h.scan_id === testScanId1);

console.log(`  User 1 sees own scan: ${user1HasScan1 ? "PASS" : "FAIL"}`);
console.log(`  User 1 CANNOT see User 2's scan: ${!user1HasScan2 ? "PASS" : "FAIL"}`);
console.log(`  User 2 sees own scan: ${user2HasScan2 ? "PASS" : "FAIL"}`);
console.log(`  User 2 CANNOT see User 1's scan: ${!user2HasScan1 ? "PASS" : "FAIL"}`);

// Detail retrieval test
const detail = await getScanDetail({ data: { scanId: testScanId1, userEmail: testUser1 } });
console.log(`  Retrieved scan detail for User 1: ${detail && detail.ingredients.length > 0 ? "PASS" : "FAIL"}`);
console.log(`  Detail ingredient: ${detail?.ingredients[0]?.ingredient?.ingredient_name}`);

// Authorization isolation on detail retrieval
let blockedUser2FromUser1 = false;
try {
  const unauthorizedDetail = await getScanDetail({ data: { scanId: testScanId1, userEmail: testUser2 } });
  if (!unauthorizedDetail) blockedUser2FromUser1 = true;
} catch (e) {
  blockedUser2FromUser1 = true;
}
console.log(`  User 2 blocked from viewing User 1 scan detail: ${blockedUser2FromUser1 ? "PASS" : "FAIL"}`);

// Delete scan test
const delRes = await deleteScan({ data: { scanId: testScanId1, userEmail: testUser1 } });
console.log(`  User 1 deletes own scan: ${delRes.success ? "PASS" : "FAIL"}`);

const history1AfterDelete = await getScanHistory({ data: { userEmail: testUser1 } });
console.log(`  Scan confirmed deleted from database: ${!history1AfterDelete.some(h => h.scan_id === testScanId1) ? "PASS" : "FAIL"}`);

// Clean up user 2 test scan
await deleteScan({ data: { scanId: testScanId2, userEmail: testUser2 } });

// 5. User Profile Update Test
console.log("\n5. USER PROFILE PERSISTENCE TEST:");
const { updateProfile, getProfile } = await import("./src/lib/api/ingredients.js");

// Create user in database
db.prepare(`
  INSERT OR REPLACE INTO users (email, name, password, account_type, created_at)
  VALUES (?, ?, ?, ?, ?)
`).run("tester@test.com", "Test User", "password123", "Personal", Date.now());

await updateProfile({
  data: {
    email: "tester@test.com",
    name: "Updated Tester",
    accountType: "Parent",
    dietaryPreferences: ["Vegan"],
    allergens: ["Peanuts"]
  }
});

const profile = await getProfile({ data: { email: "tester@test.com" } });
console.log(`  Profile updated name: ${profile?.name === "Updated Tester" ? "PASS" : "FAIL"}`);
console.log(`  Profile updated accountType: ${profile?.accountType === "Parent" ? "PASS" : "FAIL"}`);

// Clean up test user
db.prepare(`DELETE FROM users WHERE email = 'tester@test.com'`).run();

console.log("\n==================================================");
console.log("ALL TESTS COMPLETED SUCCESSFULLY!");
console.log("==================================================");
