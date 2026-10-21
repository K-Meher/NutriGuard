import sqlite3, re
from test_benchmark import match_token, extract_name_part, normalize_token

raw_ocr = "INGREDIENTS Wheat Flour, Sugar, Pl O1L Curcumin (INS 100(1), Sodium Benzoate (INS211), Circ cid (E330), Sal\n"

# Clean and split
text = re.sub(r'INGREDIENTS\s*[:\-–—]?\s*', '', raw_ocr, flags=re.IGNORECASE)
tokens = [t.strip() for t in re.split(r'[,;\n]', text) if len(t.strip()) > 1]

print("Extracted tokens:", tokens)
print("\nMatching results:")

db = sqlite3.connect('nutriguard.db')
cur = db.cursor()

for t in tokens:
    res = match_token(t)
    if res:
        # Fetch evidence
        cur.execute("SELECT evidence_summary, source_organization, official_detail_link FROM ingredient_evidence WHERE ingredient_id = ?", (res['ingredient_id'],))
        ev = cur.fetchone()
        print(f"  [MATCH] '{t}' -> {res['canonical_name']} ({res['ingredient_id']}) [{res['type']}, confidence: {res['confidence']}]")
        if ev:
            print(f"      Function/Evidence: {ev[0][:80]}...")
            print(f"      Source: {ev[1]}")
            print(f"      Link: {ev[2]}")
    else:
        print(f"  ? Unrecognized: \"{t}\"")
