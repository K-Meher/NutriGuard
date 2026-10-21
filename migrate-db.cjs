const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const Database = require('better-sqlite3');

const env = fs.readFileSync('.env', 'utf-8');
const rawUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const url = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(url, key);
const db = new Database('./nutriguard.db', { readonly: true });

async function run() {
  console.log("Migrating Ingredients...");
  const ingredients = db.prepare("SELECT * FROM ingredients").all();
  for (let i = 0; i < ingredients.length; i += 100) {
    const chunk = ingredients.slice(i, i + 100);
    const { error } = await supabase.from('ingredients').upsert(chunk);
    if (error) console.error("Error inserting ingredients:", error);
  }

  console.log("Migrating Evidence...");
  const evidence = db.prepare("SELECT * FROM ingredient_evidence").all();
  for (let i = 0; i < evidence.length; i += 100) {
    const chunk = evidence.slice(i, i + 100);
    const { error } = await supabase.from('ingredient_evidence').upsert(chunk);
    if (error) console.error("Error inserting evidence:", error);
  }

  console.log("Migrating Normalizations...");
  const normalizations = db.prepare("SELECT * FROM ingredient_normalizations").all();
  for (let i = 0; i < normalizations.length; i += 100) {
    const chunk = normalizations.slice(i, i + 100);
    const { error } = await supabase.from('ingredient_normalizations').upsert(chunk);
    if (error) console.error("Error inserting normalizations:", error);
  }

  console.log("Migration complete!");
}

run();
