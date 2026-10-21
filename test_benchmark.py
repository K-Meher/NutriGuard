import sqlite3
import re
import json

db = sqlite3.connect('nutriguard.db')
cur = db.cursor()

def normalize_token(raw):
    raw = raw.lower().strip()
    raw = re.sub(r'\s+', ' ', raw)
    raw = re.sub(r"['']", "'", raw)
    raw = re.sub(r'[""]', '"', raw)
    raw = re.sub(r'[-‐‑‒–—―]', '-', raw)
    raw = re.sub(r'[^\x20-\x7E\'"-]', ' ', raw)
    raw = re.sub(r'\s+', ' ', raw)
    return raw.strip()

def extract_name_part(text):
    text = re.sub(r'\(\s*(?:INS|E[-\s]?)?\s*\d+(?:\([ivxlc]+\))?\s*\)', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s*\(\s*\)\s*', '', text)
    return text.strip()

def extract_ins_number(text):
    patterns = [
        r'\bINS\s*(\d+(?:\([ivxlc]+\))?(?:\([a-z]+\))?)',
        r'\bE[-\s]?(\d{3,4}(?:\([ivxlc]+\))?)',
        r'\b(\d{3,4}(?:\([ivxlc]+\))?)\b'
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            return m.group(1).lower()
    return None

def levenshtein(a, b):
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            dp[i][j] = min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    return dp[m][n]

def similarity(a, b):
    max_len = max(len(a), len(b))
    if max_len == 0:
        return 1.0
    return 1.0 - levenshtein(a, b) / max_len

def match_token(raw_token):
    name_part = extract_name_part(raw_token)
    norm_name = normalize_token(name_part)
    ins = extract_ins_number(raw_token)

    # 1. Exact match
    cur.execute("SELECT ingredient_id, canonical_ingredient_name, match_type, confidence FROM ingredient_normalizations WHERE normalized_term = ? LIMIT 1", (norm_name,))
    row = cur.fetchone()
    if row:
        return {'ingredient_id': row[0], 'canonical_name': row[1], 'type': 'exact', 'confidence': row[3]}

    # 2. INS lookup
    if ins:
        clean_ins = ins.replace(' ', '').lower()
        cur.execute("""
            SELECT ingredient_id, canonical_ingredient_name, confidence FROM ingredient_normalizations
            WHERE lower(replace(ins_number, ' ', '')) = ?
               OR lower(replace(normalized_term, ' ', '')) = ?
               OR lower(replace(normalized_term, ' ', '')) = ?
            LIMIT 1
        """, (clean_ins, "ins" + clean_ins, "e" + clean_ins))
        row = cur.fetchone()
        if row:
            return {'ingredient_id': row[0], 'canonical_name': row[1], 'type': 'ins', 'confidence': row[2]}

    # 3. Fuzzy match
    if len(norm_name) >= 4:
        cur.execute("SELECT ingredient_id, canonical_ingredient_name, normalized_term, confidence FROM ingredient_normalizations")
        best_score = 0
        best_row = None
        for r in cur.fetchall():
            term = r[2]
            if not term:
                continue
            s = similarity(norm_name, term)
            if s > best_score:
                best_score = s
                best_row = r
        if best_score >= 0.82 and best_row:
            return {'ingredient_id': best_row[0], 'canonical_name': best_row[1], 'type': 'fuzzy', 'confidence': 'High' if best_score >= 0.92 else 'Low'}

    return None

# Test on Dataset 4
cur.execute("SELECT sample_id, label_text, ocr_text, expected_ingredient_id, expected_ingredient FROM ocr_label_samples")
samples = cur.fetchall()

passed = 0
failed = 0
mismatches = []

for s in samples:
    sid, ltext, otext, exp_id, exp_name = s
    test_str = otext or ltext or ""
    # strip "Ingredients:"
    test_str = re.sub(r'^Ingredients?\s*:\s*', '', test_str, flags=re.IGNORECASE)
    first_token = re.split(r'[,;\n]', test_str)[0].strip()
    res = match_token(first_token)
    det_id = res['ingredient_id'] if res else None
    if det_id == exp_id:
        passed += 1
    else:
        failed += 1
        mismatches.append((sid, first_token, exp_id, exp_name, det_id, res['canonical_name'] if res else None))

print(f"Dataset 4 Benchmark Results: {passed}/{len(samples)} passed ({passed/len(samples)*100:.1f}%)")
if mismatches:
    print(f"\nMismatches ({len(mismatches)}):")
    for m in mismatches[:10]:
        print(f"  {m[0]}: token='{m[1]}' | expected={m[2]} ({m[3]}) | got={m[4]} ({m[5]})")
