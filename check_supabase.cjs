// ============================================================
// Supabase Verification & Inspection Script
// Usage: node check_supabase.cjs
// ============================================================
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

console.log("==================================================");
console.log("   NutriGuard - Supabase Data Inspection Tool     ");
console.log("==================================================\n");

// 1. Check .env file
const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log("⚠️  No '.env' file found in the project root.");
  console.log("   The app is currently saving all details locally in SQLite ('nutriguard.db').");
  console.log("\n👉 To activate Supabase:");
  console.log("   1. Create a '.env' file by copying '.env.example':");
  console.log("      cp .env.example .env");
  console.log("   2. Fill in your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  console.log("   3. Run the tables in 'supabase-schema.sql' inside your Supabase SQL Editor.");
  console.log("   4. Re-run: node check_supabase.cjs\n");
  process.exit(0);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const rawUrl = urlMatch ? urlMatch[1].trim() : '';
const url = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const key = keyMatch ? keyMatch[1].trim() : '';

if (!url || !key || url.includes("your-project-id") || key.includes("your_supabase_anon_key")) {
  console.log("⚠️  '.env' exists but VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is placeholder/empty.");
  console.log("   The app is currently saving all details locally in SQLite ('nutriguard.db').\n");
  console.log("👉 Please update your '.env' file with your actual Supabase credentials.");
  process.exit(0);
}

console.log(`🔌 Connecting to Supabase project: ${url}...`);

const supabase = createClient(url, key);

async function inspect() {
  try {
    // 1. Test Scans Table
    const { data: scans, error: scansError, count: scansCount } = await supabase
      .from('scans')
      .select('*', { count: 'exact' })
      .order('scan_date', { ascending: false })
      .limit(5);

    if (scansError) {
      console.error("\n❌ Error querying 'scans' table:", scansError.message);
      if (scansError.code === '42P01') {
        console.log("💡 The 'scans' table does not exist in Supabase yet.");
        console.log("   Please copy and run 'supabase-schema.sql' in your Supabase SQL Editor.");
      }
      return;
    }

    console.log(`\n✅ Connected to Supabase successfully!\n`);
    console.log(`📊 Summary of records in Supabase:`);
    console.log(`   - Total Scans: ${scansCount ?? scans.length}`);

    // 2. Count scan_ingredients
    const { count: ingCount } = await supabase
      .from('scan_ingredients')
      .select('*', { count: 'exact', head: true });
    console.log(`   - Total Identified Ingredients in Scans: ${ingCount ?? 0}`);

    // 3. Count Master Ingredients
    const { count: masterCount } = await supabase
      .from('ingredients')
      .select('*', { count: 'exact', head: true });
    console.log(`   - Master Ingredients Dataset: ${masterCount ?? 0}`);

    // 4. Count Registered Users
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    console.log(`   - Registered User Profiles: ${userCount ?? 0}`);

    // 5. Display Latest Scans
    console.log("\n==================================================");
    console.log("            Latest Scans in Supabase              ");
    console.log("==================================================");

    if (!scans || scans.length === 0) {
      console.log("No scans found in Supabase yet. Perform a scan in the app to see it here!");
    } else {
      for (const scan of scans) {
        console.log(`\n🆔 Scan ID:   ${scan.scan_id}`);
        console.log(`👤 User:      ${scan.user_id || 'Anonymous / Guest'}`);
        console.log(`📅 Date:      ${scan.scan_date}`);
        console.log(`🚦 Status:    ${scan.processing_status}`);
        console.log(`📝 Text:      ${(scan.normalized_text || scan.original_ocr_text || '').slice(0, 80).replace(/\n/g, ' ')}...`);

        // Fetch ingredients for this scan
        const { data: items } = await supabase
          .from('scan_ingredients')
          .select('*')
          .eq('scan_id', scan.scan_id);

        if (items && items.length > 0) {
          console.log(`   Detected Ingredients (${items.length}):`);
          items.forEach((item, idx) => {
            console.log(`   ${idx + 1}. [${item.match_status.toUpperCase()}] ${item.detected_text} (ID: ${item.ingredient_id || 'N/A'}, Conf: ${item.confidence})`);
          });
        }
      }
    }

    console.log("\n==================================================");
    console.log("Tip: You can also view these live in your Supabase Web Dashboard -> Table Editor.");
    console.log("==================================================\n");

  } catch (err) {
    console.error("Unexpected error inspecting Supabase:", err);
  }
}

inspect();
