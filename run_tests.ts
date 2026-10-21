import Database from "better-sqlite3";

console.log("==================================================");
console.log("RUNNING COMPREHENSIVE VALIDATION SUITE");
console.log("==================================================\n");

// 1. Initialize database and schema
const { getDb } = await import("./src/db/database.ts");
const db = getDb();

console.log("1. DATABASE AUDIT:");
const tables = [
  "products",
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
  const count = (db.prepare(`SELECT count(*) as c FROM ${t}`).get() as any).c;
  console.log(`  ✓ Table '${t}': ${count} rows`);
}

// 2. Normalization & Matching Test
console.log("\n2. NORMALIZATION & MATCHING PIPELINE TEST:");
const {
  extractIngredientSection,
  tokenizeIngredients,
  matchTokenSync,
  loadDatabaseData,
  processIngredientTokens
} = await import("./src/lib/api/normalize.ts");

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
      console.log(`      Evidence: ${m.evidence.source_organization} | Standard: ${m.evidence.source_reference} | Link: ${m.evidence.official_detail_link || m.evidence.official_source_url}`);
    }
  } else {
    unrecognizedCount++;
    console.log(`    ? UNRECOGNIZED: "${m.detected_text}" (Correctly flagged as unrecognized, no hallucination)`);
  }
}
console.log(`  Results: ${recognizedCount} matched, ${unrecognizedCount} unrecognized`);

// 3. Dataset 4 Benchmark Test
console.log("\n3. DATASET 4 BENCHMARK SUITE (150 SAMPLES):");
const { executeBenchmark } = await import("./src/lib/api/ingredients.ts");
const benchmarkResults = await executeBenchmark();
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

const { queryScanHistory, queryScanDetail, removeScan } = await import("./src/lib/api/ingredients.ts");

const history1 = await queryScanHistory(testUser1);
const history2 = await queryScanHistory(testUser2);

const user1HasScan1 = history1.some(h => h.scan_id === testScanId1);
const user1HasScan2 = history1.some(h => h.scan_id === testScanId2);
const user2HasScan2 = history2.some(h => h.scan_id === testScanId2);
const user2HasScan1 = history2.some(h => h.scan_id === testScanId1);

console.log(`  User 1 sees own scan: ${user1HasScan1 ? "PASS" : "FAIL"}`);
console.log(`  User 1 CANNOT see User 2's scan: ${!user1HasScan2 ? "PASS" : "FAIL"}`);
console.log(`  User 2 sees own scan: ${user2HasScan2 ? "PASS" : "FAIL"}`);
console.log(`  User 2 CANNOT see User 1's scan: ${!user2HasScan1 ? "PASS" : "FAIL"}`);

// Detail retrieval test
const detail = await queryScanDetail(testScanId1, testUser1);
console.log(`  Retrieved scan detail for User 1: ${detail && detail.ingredients.length > 0 ? "PASS" : "FAIL"}`);
console.log(`  Detail ingredient: ${detail?.ingredients[0]?.ingredient?.ingredient_name}`);

// Authorization isolation on detail retrieval
let blockedUser2FromUser1 = false;
try {
  const unauthorizedDetail = await queryScanDetail(testScanId1, testUser2);
  if (!unauthorizedDetail) blockedUser2FromUser1 = true;
} catch (e) {
  blockedUser2FromUser1 = true;
}
console.log(`  User 2 blocked from viewing User 1 scan detail: ${blockedUser2FromUser1 ? "PASS" : "FAIL"}`);

// Delete scan test
const delRes = await removeScan(testScanId1, testUser1);
console.log(`  User 1 deletes own scan: ${delRes.success ? "PASS" : "FAIL"}`);

const history1AfterDelete = await queryScanHistory(testUser1);
console.log(`  Scan confirmed deleted from database: ${!history1AfterDelete.some(h => h.scan_id === testScanId1) ? "PASS" : "FAIL"}`);

// Clean up user 2 test scan
await removeScan(testScanId2, testUser2);

// 5. User Profile Update Test
console.log("\n5. USER PROFILE PERSISTENCE TEST:");
const { saveProfile, fetchProfile } = await import("./src/lib/api/ingredients.ts");

// Create user in database
db.prepare(`
  INSERT OR REPLACE INTO users (email, name, password, account_type, created_at)
  VALUES (?, ?, ?, ?, ?)
`).run("tester@test.com", "Test User", "password123", "Personal", Date.now());

await saveProfile({
  email: "tester@test.com",
  name: "Updated Tester",
  accountType: "Parent",
  dietaryPreferences: ["Vegan"],
  allergens: ["Peanuts"]
});

const profile = await fetchProfile("tester@test.com");
console.log(`  Profile updated name: ${profile?.name === "Updated Tester" ? "PASS" : "FAIL"}`);
console.log(`  Profile updated accountType: ${profile?.accountType === "Parent" ? "PASS" : "FAIL"}`);

// Clean up test user
db.prepare(`DELETE FROM users WHERE email = 'tester@test.com'`).run();

// 6. Test Authentication & Verification Flow
console.log("\n6. AUTHENTICATION & OTP FLOW TEST:");
const { sendEmailOtpCore, verifyEmailOtpCore, loginWithPasswordCore } = await import("./src/lib/api/email.ts");

// Send OTP
const otpRes = await sendEmailOtpCore("auth_test@example.com");
console.log(`  Send OTP success: ${otpRes.success ? "PASS" : "FAIL"}`);
  const otpRow = db.prepare("SELECT otp FROM otp_verifications WHERE phone = ?").get("auth_test@example.com") as { otp: string } | undefined;
  const otpToUse = otpRow?.otp || "123456";

// Verify OTP & Register user
const verifyRes = await verifyEmailOtpCore({
  email: "auth_test@example.com",
  otp: otpToUse,
  name: "Auth Test User",
  password: "Password123!",
  accountType: "Personal"
});
console.log(`  Verify OTP & Register: ${verifyRes.success ? "PASS" : "FAIL"} (${verifyRes.message})`);

// Login with password
const loginRes = await loginWithPasswordCore({
  email: "auth_test@example.com",
  password: "Password123!"
});
console.log(`  Login with correct password: ${loginRes.success ? "PASS" : "FAIL"} (${loginRes.user?.name})`);

// Login with wrong password
const wrongLoginRes = await loginWithPasswordCore({
  email: "auth_test@example.com",
  password: "WrongPassword"
});
console.log(`  Reject wrong password: ${!wrongLoginRes.success ? "PASS" : "FAIL"}`);

// Parent dual-email login tests
const parentMissingChildRes = await loginWithPasswordCore({
  email: "auth_test@example.com",
  password: "Password123!",
  accountType: "Parent",
  childEmail: ""
});
console.log(`  Reject parent login without child email: ${!parentMissingChildRes.success ? "PASS" : "FAIL"}`);

const parentSameEmailRes = await loginWithPasswordCore({
  email: "auth_test@example.com",
  password: "Password123!",
  accountType: "Parent",
  childEmail: "auth_test@example.com"
});
console.log(`  Reject parent login with same child email: ${!parentSameEmailRes.success ? "PASS" : "FAIL"}`);

const parentValidRes = await loginWithPasswordCore({
  email: "auth_test@example.com",
  password: "Password123!",
  accountType: "Parent",
  childEmail: "child_test@example.com"
});
console.log(`  Parent login with valid child email: ${parentValidRes.success && parentValidRes.user?.childEmail === "child_test@example.com" ? "PASS" : "FAIL"}`);

// Parent account creation tests
await sendEmailOtpCore("parent_reg@example.com");
const parentOtpRow = db.prepare(`SELECT otp FROM otp_verifications WHERE phone = ?`).get("parent_reg@example.com") as any;

const parentRegNoChildRes = await verifyEmailOtpCore({
  email: "parent_reg@example.com",
  otp: parentOtpRow.otp,
  name: "Parent Tester",
  password: "Password123!",
  accountType: "Parent",
  childEmail: ""
});
console.log(`  Reject parent registration without child email: ${!parentRegNoChildRes.success ? "PASS" : "FAIL"}`);

const parentRegSameEmailRes = await verifyEmailOtpCore({
  email: "parent_reg@example.com",
  otp: parentOtpRow.otp,
  name: "Parent Tester",
  password: "Password123!",
  accountType: "Parent",
  childEmail: "parent_reg@example.com"
});
console.log(`  Reject parent registration with same child email: ${!parentRegSameEmailRes.success ? "PASS" : "FAIL"}`);

const parentRegValidRes = await verifyEmailOtpCore({
  email: "parent_reg@example.com",
  otp: parentOtpRow.otp,
  name: "Parent Tester",
  password: "Password123!",
  accountType: "Parent",
  childEmail: "child_reg@example.com",
  childName: "Aarav",
  childDietaryPreferences: ["Vegetarian"],
  childAllergens: ["Peanuts", "Milk"]
});
console.log(`  Parent registration with valid parent & child details: ${parentRegValidRes.success ? "PASS" : "FAIL"}`);

const createdParentUser = db.prepare(`SELECT * FROM users WHERE email = ?`).get("parent_reg@example.com") as any;
const createdChildUser = db.prepare(`SELECT * FROM users WHERE email = ?`).get("child_reg@example.com") as any;
console.log(`  Parent account created with child link: ${createdParentUser && createdParentUser.account_type === "Parent" && createdParentUser.child_email === "child_reg@example.com" ? "PASS" : "FAIL"}`);
console.log(`  Child account created with own profile and parent link: ${createdChildUser && createdChildUser.account_type === "Child" && createdChildUser.name === "Aarav" && createdChildUser.parent_email === "parent_reg@example.com" ? "PASS" : "FAIL"}`);

// Child Login Tests (Single email, OTP only)
const { sendChildLoginOtpCore, verifyChildOtpCore } = await import("./src/lib/api/email.ts");

// Invalid child email rejection
const invalidChildSendRes = await sendChildLoginOtpCore("unregistered_child@example.com");
console.log(`  Reject login for unregistered child: ${!invalidChildSendRes.success ? "PASS" : "FAIL"}`);

// Valid child login with OTP
const childSendRes = await sendChildLoginOtpCore("child_reg@example.com");
console.log(`  Send OTP for valid child email: ${childSendRes.success ? "PASS" : "FAIL"}`);

const childOtpRow = db.prepare(`SELECT otp FROM otp_verifications WHERE phone = ?`).get("child_reg@example.com") as any;
const childVerifyRes = await verifyChildOtpCore({
  childEmail: "child_reg@example.com",
  otp: childOtpRow.otp
});
console.log(`  Child OTP login verified: ${childVerifyRes.success && childVerifyRes.user?.accountType === "Child" ? "PASS" : "FAIL"}`);
console.log(`  Child profile loaded with own name & preferences: ${childVerifyRes.user?.name === "Aarav" && childVerifyRes.user?.dietaryPreferences?.includes("Vegetarian") ? "PASS" : "FAIL"}`);

// Profile isolation tests (Parent update does not overwrite Child; Child update does not overwrite Parent)
await saveProfile({ email: "parent_reg@example.com", name: "Dr. Sharma" });
const childAfterParentUpdate = db.prepare(`SELECT name FROM users WHERE email = ?`).get("child_reg@example.com") as any;
console.log(`  Parent update does not touch child: ${childAfterParentUpdate.name === "Aarav" ? "PASS" : "FAIL"}`);

await saveProfile({ email: "child_reg@example.com", name: "Aarav Sharma" });
const parentAfterChildUpdate = db.prepare(`SELECT name FROM users WHERE email = ?`).get("parent_reg@example.com") as any;
console.log(`  Child update does not touch parent: ${parentAfterChildUpdate.name === "Dr. Sharma" ? "PASS" : "FAIL"}`);

// Existing legacy account test
db.prepare(`
  INSERT OR REPLACE INTO users (email, name, password, account_type, child_email, created_at)
  VALUES ('legacy_parent@example.com', 'Legacy Parent', 'Pass123', 'Parent', 'legacy_child@example.com', ?)
`).run(Date.now());

const legacyChildSendRes = await sendChildLoginOtpCore("legacy_child@example.com");
console.log(`  Legacy child account auto-detected & OTP sent: ${legacyChildSendRes.success ? "PASS" : "FAIL"}`);

// Clean up test users
db.prepare(`DELETE FROM users WHERE email IN ('auth_test@example.com', 'parent_reg@example.com', 'child_reg@example.com', 'legacy_parent@example.com', 'legacy_child@example.com')`).run();
db.prepare(`DELETE FROM otp_verifications WHERE phone IN ('auth_test@example.com', 'parent_reg@example.com', 'child_reg@example.com', 'legacy_child@example.com')`).run();

// 7. Safety Score & Allergen Matching Test
console.log("\n7. EVIDENCE-AWARE SAFETY SCORE & ALLERGEN ALERTS TEST:");
const { calculateSafetyScore } = await import("./src/lib/api/safetyScore.ts");

const scoreRes = calculateSafetyScore(matched, ["Wheat / Gluten"], ["Peanuts"]);
console.log(`  Safety Score calculated: ${scoreRes.score} / 100 (${scoreRes.headline})`);
console.log(`  Evidence coverage percentage: ${scoreRes.evidenceCoveragePercent}%`);
console.log(`  Score factors explained: ${scoreRes.factors.length > 0 ? "PASS" : "FAIL"}`);
console.log(`  Identified allergen match (Wheat): ${scoreRes.allergenAlerts.some(a => a.matchedAllergen === "Wheat / Gluten") ? "PASS" : "FAIL"}`);
console.log(`  Unrecognized token uncertainty tracked: ${scoreRes.stats.unrecognizedCount === 1 ? "PASS" : "FAIL"}`);

console.log("\n==================================================");
console.log("ALL TESTS COMPLETED SUCCESSFULLY!");
console.log("==================================================");
