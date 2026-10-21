# NutriGuard — Smart Food Ingredient Assistant & Analyzer

NutriGuard is an intelligent food label analyzer and health assistant designed to scan packaged food ingredient labels, detect additives (INS/E-numbers), identify allergens, match ingredients against standard regulatory databases (FSSAI, US FDA, Codex Alimentarius), and provide clear, science-backed nutritional insights.

---

## 🌟 Key Features

- **Food Label OCR Scanner**: Upload or capture food packaging images to extract ingredient lists using Tesseract.js.
- **Intelligent Preprocessing**: Advanced image normalization via Sharp (auto-inversion, contrast enhancement, noise reduction) to handle challenging package folds, lighting, and glare.
- **Robust Ingredient Tokenization**: Custom recursive bracket/parenthesis parser handling complex nested ingredients and OCR punctuation errors.
- **Fuzzy Ingredient Matching (Levenshtein Distance)**: Matches misspelled or mangled OCR terms against standard ingredient lexicons with confidence scoring.
- **Additive & INS / E-Number Resolution**: Automatically identifies food additives, acidity regulators, artificial sweeteners, and preservatives.
- **Official Health & Regulatory Standards**: Directly links detected ingredients to regulatory standards from FSSAI, US FDA, WHO, and Codex Alimentarius.
- **Supabase Cloud Integration**: Real-time cloud database (PostgreSQL) storing comprehensive global ingredient databases, scientific evidence, and normalization rules.
- **Email OTP Authentication**: Secure login and verification with real email delivery via Gmail SMTP.
- **Automated OCR Benchmark**: Integrated benchmark dashboard testing OCR extraction and matching accuracy against standard food label datasets.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend UI** | React 18, TanStack Start, TanStack Router, TanStack Query |
| **Styling & Components** | Tailwind CSS, Radix UI Primitives, Lucide Icons |
| **Backend / Server** | Node.js (Nitro Server Functions, Server RPC) |
| **Database** | Supabase (PostgreSQL) & SQLite (local fallback) |
| **Computer Vision / OCR** | Tesseract.js |
| **Image Processing** | Sharp (libvips) |
| **Email Service** | Nodemailer (Gmail SMTP) |
| **Language & Tooling** | TypeScript, Vite, npm |

---

## 🔬 Core Algorithms

1. **Adaptive Image Preprocessing Pipeline (`Sharp`)**:
   - Calculates average luminance to detect dark or light packaging.
   - Automatically negates inverted text for optimal OCR recognition.
   - Resizes and sharpens edges (`sigma: 1.8`, `m1: 0.5`, `m2: 2.5`) to eliminate background noise.

2. **Nested Tokenization Algorithm**:
   - Tracks opening and closing brackets `()`, `[]`, `{}` to prevent sub-ingredient groups (e.g., `Spices (Onion, Garlic, Turmeric)`) from fragmenting prematurely.
   - Includes safeguard boundaries for unclosed OCR bracket hallucinations.

3. **Levenshtein Distance Fuzzy String Matching**:
   - Computes minimum single-character edit distances (insertions, deletions, substitutions) to reconcile OCR typos with known canonical ingredients.
   - Normalizes diacritics, punctuation, and common character substitutions (e.g., `0` vs `O`, `1S` vs `INS`).

4. **INS / E-Number Extraction & Harmonization**:
   - Matches regex patterns for international food additive codes (`INS 150c`, `E330`, etc.) and links them to functional classes (e.g., color, acidity regulator, emulsifier).

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v18.x or later)
- **npm** (v9.x or later)

### 2. Clone the Repository
```bash
git clone https://github.com/Madhumitha906/nutriguard.git
cd nutriguard
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gmail SMTP for OTP Verification (Optional)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
```

### 5. Start the Development Server
```bash
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 📁 Project Structure

```
nutriguard/
├── src/
│   ├── components/            # UI components (Scanner, Cards, Benchmark, Navigation)
│   │   ├── ui/                # Radix UI + Tailwind design system
│   │   ├── BenchmarkPanel.tsx # OCR testing & accuracy grading dashboard
│   │   ├── IngredientCard.tsx # Detailed card view for matched ingredients
│   │   └── nutriguard-app.tsx # Main application controller
│   ├── db/                    # Drizzle / SQLite schemas & connections
│   ├── lib/
│   │   ├── api/               # Server Functions (scan, normalize, email, ingredients)
│   │   ├── supabase.ts        # Supabase client setup
│   │   └── utils.ts           # Styling & utility helpers
│   ├── routes/                # TanStack Start file-based routing
│   └── styles.css             # Global CSS & Tailwind configuration
├── public/
│   └── data/                  # Standard datasets (ingredients, evidence, normalizations)
├── seed_db.py                 # SQLite database initialization script
├── supabase-seed.sql          # Supabase PostgreSQL database migration & seed SQL
├── START_APP.bat              # One-click Windows starter batch script
├── package.json               # Dependencies and scripts
└── tsconfig.json              # TypeScript configuration
```

---

## 📄 License

This project is licensed under the MIT License.
