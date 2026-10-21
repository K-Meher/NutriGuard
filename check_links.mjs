import Database from "better-sqlite3";
const db = new Database("nutriguard.db");

const sample = db.prepare("SELECT ingredient_id, ingredient_name, ins_number, source_organization, source_reference, source_url, official_source_link FROM ingredients LIMIT 20").all();
console.log(sample);

const evSample = db.prepare("SELECT ingredient_id, source_organization, source_reference, official_source_url, official_detail_link FROM ingredient_evidence LIMIT 20").all();
console.log(evSample);
