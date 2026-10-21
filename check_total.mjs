import Database from "better-sqlite3";
const db = new Database("nutriguard.db");

const totalIng = db.prepare("SELECT count(*) as c FROM ingredients").get().c;
const totalNorm = db.prepare("SELECT count(*) as c FROM ingredient_normalizations").get().c;
const totalEv = db.prepare("SELECT count(*) as c FROM ingredient_evidence").get().c;

console.log("=== MASTER DATABASE STATUS ===");
console.log("Total Ingredients in DB:", totalIng);
console.log("Total Normalizations / Search Terms:", totalNorm);
console.log("Total Scientific Evidence Records:", totalEv);
