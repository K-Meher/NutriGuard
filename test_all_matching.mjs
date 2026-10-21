import {
  extractIngredientSection,
  splitIngredientTokens,
  processIngredientTokens
} from "./src/lib/api/normalize.ts";

const rawOcrFromPhone = `
— a - \neredionte: rovas) Fytract (50%) (Barley, Wheat,
Millet), Malted Barley |¢ 170), . 3%, Wheat Flour
(Atta), Milk Solids (6%), Minerals, i ol
(INS 150¢) Acidity Regulators
hrs’ oo IN sed Sai’, Cocoa
Powder, Vitamins, Nature Identical Flavouring
Substances, S0y Protein Isolate.
Allergen Information: Contains Wheat,
Barley, Milk and Soy.
Single consumption Pack
Per consumption-10 g
Nutrients (Approx. per 100 g): Energy-369 kcal,
Protein-7.5 g, Carbohydrate-80 g, Total Sugars-35 g
`;

const section = extractIngredientSection(rawOcrFromPhone);
console.log("=== EXTRACTED SECTION ===");
console.log(section);

const tokens = splitIngredientTokens(section);
console.log("\n=== SPLIT TOKENS ===");
console.log(tokens);

const matched = processIngredientTokens(tokens);
console.log(`\n=== MATCHED INGREDIENTS (${matched.length} total) ===`);
let identified = 0;
for (const m of matched) {
  if (m.match_status !== "unrecognized") identified++;
  console.log(`- [${m.match_status}] "${m.detected_text}" => ${m.ingredient?.ingredient_name || "UNRECOGNIZED"} | Org: ${m.ingredient?.source_organization || "N/A"}`);
}
console.log(`\nIdentified: ${identified} of ${matched.length}`);
