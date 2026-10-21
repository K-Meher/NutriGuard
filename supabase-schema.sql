-- ============================================================
-- Complete Supabase Schema for NutriGuard Food Ingredient Analyzer
-- Run this in your Supabase Project -> SQL Editor
-- ============================================================

-- 1. INGREDIENTS MASTER TABLE
CREATE TABLE IF NOT EXISTS public.ingredients (
    ingredient_id TEXT PRIMARY KEY,
    ingredient_name TEXT NOT NULL,
    aliases TEXT,
    ins_number TEXT,
    ingredient_type TEXT,
    function TEXT,
    source_organization TEXT,
    source_reference TEXT,
    source_url TEXT,
    official_source_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. INGREDIENT EVIDENCE TABLE
CREATE TABLE IF NOT EXISTS public.ingredient_evidence (
    evidence_id TEXT PRIMARY KEY,
    ingredient_id TEXT REFERENCES public.ingredients(ingredient_id) ON DELETE CASCADE,
    evidence_type TEXT,
    evidence_summary TEXT,
    source_organization TEXT,
    source_reference TEXT,
    official_source_url TEXT,
    official_detail_link TEXT,
    evidence_status TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. INGREDIENT NORMALIZATIONS & ALIASES TABLE
CREATE TABLE IF NOT EXISTS public.ingredient_normalizations (
    mapping_id TEXT PRIMARY KEY,
    ingredient_id TEXT REFERENCES public.ingredients(ingredient_id) ON DELETE CASCADE,
    canonical_ingredient_name TEXT,
    raw_label_term TEXT,
    normalized_term TEXT,
    match_type TEXT,
    ins_number TEXT,
    ocr_variant TEXT,
    confidence TEXT,
    normalization_rule TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. SCANS TABLE (Stores user scan history)
CREATE TABLE IF NOT EXISTS public.scans (
    scan_id TEXT PRIMARY KEY,
    user_id TEXT,
    image_ref TEXT,
    original_ocr_text TEXT,
    normalized_text TEXT,
    scan_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    processing_status TEXT NOT NULL DEFAULT 'pending'
);

-- 5. SCAN INGREDIENTS TABLE (Stores per-ingredient scan findings)
CREATE TABLE IF NOT EXISTS public.scan_ingredients (
    id BIGSERIAL PRIMARY KEY,
    scan_id TEXT REFERENCES public.scans(scan_id) ON DELETE CASCADE,
    ingredient_id TEXT,
    detected_text TEXT NOT NULL,
    confidence TEXT,
    match_status TEXT NOT NULL DEFAULT 'unrecognized',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 6. USERS TABLE (Application Profiles)
CREATE TABLE IF NOT EXISTS public.users (
    email TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    account_type TEXT NOT NULL DEFAULT 'Personal',
    dietary_preferences TEXT,
    allergens TEXT,
    created_at BIGINT NOT NULL
);

-- INDEXES for fast lookup
CREATE INDEX IF NOT EXISTS idx_norm_normalized_term ON public.ingredient_normalizations(normalized_term);
CREATE INDEX IF NOT EXISTS idx_norm_ingredient_id ON public.ingredient_normalizations(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_norm_ins_number ON public.ingredient_normalizations(ins_number);
CREATE INDEX IF NOT EXISTS idx_evidence_ingredient_id ON public.ingredient_evidence(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_scan_date ON public.scans(scan_date DESC);
CREATE INDEX IF NOT EXISTS idx_scan_ingredients_scan_id ON public.scan_ingredients(scan_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_normalizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow Public/Anon read on datasets
CREATE POLICY "Public Read Ingredients" ON public.ingredients FOR SELECT USING (true);
CREATE POLICY "Public Read Evidence" ON public.ingredient_evidence FOR SELECT USING (true);
CREATE POLICY "Public Read Normalizations" ON public.ingredient_normalizations FOR SELECT USING (true);

-- Allow full access for anon/authenticated to support scan analysis & persistence
CREATE POLICY "Allow All Scans" ON public.scans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Scan Ingredients" ON public.scan_ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Master Ingredients" ON public.ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Master Evidence" ON public.ingredient_evidence FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Master Normalizations" ON public.ingredient_normalizations FOR ALL USING (true) WITH CHECK (true);
