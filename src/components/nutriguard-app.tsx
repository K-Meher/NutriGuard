import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  ExternalLink,
  GitCompareArrows,
  Globe2,
  Home,
  ImagePlus,
  Leaf,
  Loader2,
  Mail,
  MessageCircle,
  Mic2,
  Pause,
  Play,
  ScanLine,
  Search,
  ShieldCheck,
  Square,
  Upload,
  UserRound,
  UsersRound,
  X,
  RefreshCw,
  FileText,
  ShieldAlert,
  Info,
} from "lucide-react";
import type { ConfirmationResult } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { analyzeScan } from "@/lib/api/scan";
import { getScanDetail, updateProfile } from "@/lib/api/ingredients";
import { IngredientCard } from "@/components/IngredientCard";
import { ScanHistory } from "@/components/ScanHistory";
import { BenchmarkPanel } from "@/components/BenchmarkPanel";
import { 
  sendEmailOtp, 
  verifyEmailOtp, 
  loginWithPassword,
  sendChildLoginOtp,
  verifyChildOtp
} from "@/lib/api/email";
import type { ScanResult } from "@/db/schema";
import { calculateSafetyScore, type SafetyScoreResult } from "@/lib/api/safetyScore";
import { 
  type Language, 
  LANGUAGES as languages, 
  LANG_CODES, 
  translations, 
  getStableVoice, 
  buildSpokenSummary 
} from "@/lib/i18n";

// ─── Types ───────────────────────────────────────────────────

type Screen =
  | "welcome" | "login" | "signup" | "verify" | "setup" | "profileSetup" | "home"
  | "scanner" | "loading" | "result" | "report" | "compare"
  | "messages" | "profile" | "history";
type AccountType = "Personal" | "Parent" | "Child";
type Translation = {
  home: string; scan: string; compare: string; messages: string; profile: string;
  greeting: string; ready: string; scanProduct: string; camera: string; upload: string;
};

const copy: Record<Language, Translation> = {
  English: { home: "Home", scan: "Scan", compare: "Compare", messages: "Messages", profile: "Profile", greeting: "Hi, Rahul", ready: "Ready to check your food?", scanProduct: "Scan a Product", camera: "Scan with Camera", upload: "Upload an Image" },
  हिन्दी: { home: "होम", scan: "स्कैन", compare: "तुलना", messages: "संदेश", profile: "प्रोफ़ाइल", greeting: "नमस्ते, राहुल", ready: "अपने खाने की जाँच के लिए तैयार हैं?", scanProduct: "उत्पाद स्कैन करें", camera: "कैमरे से स्कैन करें", upload: "चित्र अपलोड करें" },
  తెలుగు: { home: "హోమ్", scan: "స్కాన్", compare: "పోల్చండి", messages: "సందేశాలు", profile: "ప్రొఫైల్", greeting: "హాయ్, రాహుల్", ready: "మీ ఆహారాన్ని తనిఖీ చేయడానికి సిద్ధంగా ఉన్నారా?", scanProduct: "ఉత్పత్తిని స్కాన్ చేయండి", camera: "కెమెరాతో స్కాన్", upload: "చిత్రాన్ని అప్‌లోడ్ చేయండి" },
  தமிழ்: { home: "முகப்பு", scan: "ஸ்கேன்", compare: "ஒப்பிடு", messages: "செய்திகள்", profile: "சுயவிவரம்", greeting: "வணக்கம், ராகுல்", ready: "உங்கள் உணவைச் சரிபார்க்கத் தயாரா?", scanProduct: "பொருளை ஸ்கேன் செய்க", camera: "கேமராவில் ஸ்கேன்", upload: "படத்தைப் பதிவேற்று" },
  ಕನ್ನಡ: { home: "ಮುಖಪುಟ", scan: "ಸ್ಕ್ಯಾನ್", compare: "ಹೋಲಿಸಿ", messages: "ಸಂದೇಶಗಳು", profile: "ಪ್ರೊಫೈಲ್", greeting: "ನಮಸ್ಕಾರ, ರಾಹುಲ್", ready: "ನಿಮ್ಮ ಆಹಾರ ಪರೀಕ್ಷಿಸಲು ಸಿದ್ಧವೇ?", scanProduct: "ಉತ್ಪನ್ನ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ", camera: "ಕ್ಯಾಮೆರಾದಿಂದ ಸ್ಕ್ಯಾನ್", upload: "ಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ" },
  മലയാളം: { home: "ഹോം", scan: "സ്കാൻ", compare: "താരതമ്യം", messages: "സന്ദേശങ്ങൾ", profile: "പ്രൊഫൈൽ", greeting: "ഹായ്, രാഹുൽ", ready: "ഭക്ഷണം പരിശോധിക്കാൻ തയ്യാറാണോ?", scanProduct: "ഉൽപ്പന്നം സ്കാൻ ചെയ്യുക", camera: "ക്യാമറ ഉപയോഗിച്ച് സ്കാൻ", upload: "ചിത്രം അപ്‌ലോഡ് ചെയ്യുക" },
  मराठी: { home: "होम", scan: "स्कॅन", compare: "तुलना", messages: "संदेश", profile: "प्रोफाइल", greeting: "नमस्कार, राहुल", ready: "तुमचे अन्न तपासायला तयार आहात?", scanProduct: "उत्पादन स्कॅन करा", camera: "कॅमेऱ्याने स्कॅन", upload: "प्रतिमा अपलोड करा" },
  বাংলা: { home: "হোম", scan: "স্ক্যান", compare: "তুলনা", messages: "বার্তা", profile: "প্রোফাইল", greeting: "হ্যালো, রাহুল", ready: "খাবার পরীক্ষা করতে প্রস্তুত?", scanProduct: "পণ্য স্ক্যান করুন", camera: "ক্যামেরা দিয়ে স্ক্যান", upload: "ছবি আপলোড করুন" },
};

const watchItems = ["High Sugar", "High Sodium", "Saturated Fat", "Allergens", "Selected Ingredients", "Preservatives", "Artificial Colours", "Sweeteners"];
const allergens = ["Milk", "Peanuts", "Eggs", "Soy", "Wheat", "Fish", "Tree Nuts", "Sesame"];
const setupSteps = ["About You", "Food", "Watch", "Accessibility"];

// ─── Shared Primitives ───────────────────────────────────────

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={cn("grid place-items-center rounded-xl bg-primary text-primary-foreground", compact ? "size-9" : "size-12")}>
        <Leaf className={compact ? "size-5" : "size-7"} />
      </span>
      <span className={cn("font-display font-bold text-foreground", compact ? "text-lg" : "text-2xl")}>NutriGuard</span>
    </div>
  );
}

function Field({ label, ...props }: React.ComponentProps<typeof Input> & { label: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-foreground">
      {label}
      <Input className="h-12 rounded-xl border-border bg-surface px-4 shadow-none focus-visible:ring-2" {...props} />
    </label>
  );
}

function Choice({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex min-h-12 items-center gap-3 rounded-xl border px-4 text-left font-medium transition-colors", selected ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface text-foreground hover:bg-muted")}>
      <span className={cn("grid size-5 place-items-center rounded-full border", selected ? "border-primary" : "border-input")}>
        {selected && <span className="size-2.5 rounded-full bg-primary" />}
      </span>
      {label}
    </button>
  );
}

function Topbar({ language, setLanguage, onBack, title }: { language: Language; setLanguage: (l: Language) => void; onBack?: () => void; title?: string }) {
  const t = translations[language] || translations["English"];
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background/95 px-5 backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        {onBack ? <Button variant="ghost" size="icon" onClick={onBack} aria-label={t.back}><ArrowLeft /></Button> : <Brand compact />}
        {title && <span className="font-display font-semibold">{title}</span>}
      </div>
      <label className="relative flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Globe2 className="size-4" />
        <select 
          value={language} 
          onChange={(e) => {
            const next = e.target.value as Language;
            setLanguage(next);
            if (typeof window !== "undefined") localStorage.setItem("nutriguard_lang", next);
          }} 
          className="appearance-none bg-transparent pr-5 outline-none font-medium cursor-pointer"
        >
          {languages.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-0 size-3" />
      </label>
    </header>
  );
}

function SpeechControls({ text, language }: { text: string; language?: Language }) {
  const [speaking, setSpeaking] = useState(false);
  const speak = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const selectedLang = language || "English";
    const langCode = LANG_CODES[selectedLang] || "en-US";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;

    // Lock onto a single stable voice for this language - never fluctuates
    const stableVoice = getStableVoice(langCode);
    if (stableVoice) {
      utterance.voice = stableVoice;
    }
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-surface p-1" aria-label="Read aloud controls">
      <Button variant="ghost" size="icon" className="rounded-full" onClick={speak} aria-label="Play"><Play /></Button>
      <Button variant="ghost" size="icon" className="rounded-full" onClick={() => { window.speechSynthesis?.pause(); setSpeaking(false); }} aria-label="Pause" disabled={!speaking}><Pause /></Button>
      <Button variant="ghost" size="icon" className="rounded-full" onClick={() => { window.speechSynthesis?.cancel(); setSpeaking(false); }} aria-label="Stop"><Square /></Button>
    </div>
  );
}

// ─── Auth Screens ─────────────────────────────────────────────

function Welcome({ go, language, setLanguage }: { go: (s: Screen) => void; language: Language; setLanguage: (l: Language) => void }) {
  const t = translations[language] || translations["English"];
  return (
    <main className="relative grid min-h-dvh place-items-center bg-background px-6">
      <div className="absolute right-6 top-6">
        <label className="relative flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Globe2 className="size-4" />
          <select 
            value={language} 
            onChange={(e) => {
              const next = e.target.value as Language;
              setLanguage(next);
              if (typeof window !== "undefined") localStorage.setItem("nutriguard_lang", next);
            }} 
            className="appearance-none bg-transparent pr-5 outline-none font-medium cursor-pointer"
          >
            {languages.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-0 size-3" />
        </label>
      </div>
      <div className="w-full max-w-sm text-center">
        <div className="mb-8 flex justify-center"><Brand /></div>
        <h1 className="font-display text-4xl font-bold tracking-normal text-foreground">{t.welcomeHeadline}</h1>
        <p className="mx-auto mt-4 max-w-xs text-base leading-relaxed text-muted-foreground">{t.welcomeSub}</p>
        <div className="mt-10 grid gap-3">
          <Button size="lg" className="h-14 rounded-xl text-base" onClick={() => go("login")}>{t.signIn}</Button>
          <Button size="lg" variant="outline" className="h-14 rounded-xl text-base" onClick={() => go("signup")}>{t.createAccount}</Button>
          <Button variant="ghost" className="h-11 rounded-xl text-sm font-semibold text-primary" onClick={() => go("home")}>
            {t.skipForNow}
          </Button>
        </div>
      </div>
    </main>
  );
}

interface AuthScreenProps {
  mode: "login" | "signup";
  accountType: AccountType;
  setAccountType: (t: AccountType) => void;
  setUserName: (n: string) => void;
  setUserEmail: (e: string) => void;
  childEmail?: string;
  setChildEmail?: (c: string) => void;
  childName?: string;
  setChildName?: (n: string) => void;
  childDietaryPreferences?: string[];
  setChildDietaryPreferences?: (p: string[]) => void;
  childAllergens?: string[];
  setChildAllergens?: (a: string[]) => void;
  setUserPassword: (p: string) => void;
  go: (s: Screen) => void;
  language: Language;
  setLanguage: (l: Language) => void;
}

function AuthScreen({
  mode, accountType, setAccountType, setUserName, setUserEmail, childEmail, setChildEmail,
  childName, setChildName, childDietaryPreferences, setChildDietaryPreferences,
  childAllergens, setChildAllergens, setUserPassword, go, language, setLanguage,
}: AuthScreenProps) {
  const t = translations[language] || translations["English"];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [childEmailInput, setChildEmailInput] = useState(childEmail || "");
  const [childNameInput, setChildNameInput] = useState(childName || "");
  const [childDietary, setChildDietary] = useState<string>("Vegetarian");
  const [childAllergensList, setChildAllergensList] = useState<string[]>(childAllergens || ["Peanuts", "Milk"]);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "login" && accountType === "Parent") {
      setAccountType("Personal");
    }
  }, [mode, accountType, setAccountType]);

  const toggleAllergen = (item: string) => {
    setChildAllergensList((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  async function handleContinue() {
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanChildEmail = childEmailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // ── 1. Child Account Login Flow (OTP only, single child email input) ──
    if (mode === "login" && accountType === "Child") {
      if (!emailRegex.test(cleanEmail)) {
        setError(t.childEmailLabel ? `Please enter a valid ${t.childEmailLabel.toLowerCase()}.` : "Please enter a valid child email address.");
        return;
      }
      setLoading(true);
      try {
        const result = await sendChildLoginOtp({ data: { childEmail: cleanEmail } });
        setLoading(false);
        if (result.success) {
          setUserEmail(cleanEmail);
          setAccountType("Child");
          go("verify");
        } else {
          setError(result.message);
        }
      } catch (err) {
        setLoading(false);
        setError(err instanceof Error ? err.message : "Failed to initiate child login. Please check the email.");
      }
      return;
    }

    // ── 2. Login for Personal / Adult / Parent Accounts (Password-based) ──
    if (mode === "login") {
      if (!emailRegex.test(cleanEmail)) {
        setError("Please enter a valid email address.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }

      setLoading(true);
      try {
        const result = await loginWithPassword({
          data: {
            email: cleanEmail,
            password,
          },
        });
        setLoading(false);
        if (result.success && result.user) {
          setUserName(result.user.name);
          setUserEmail(result.user.email);
          setAccountType(result.user.accountType as AccountType);
          if (result.user.childEmail) {
            setChildEmail?.(result.user.childEmail);
          }
          // If name is missing, show profile setup screen
          if (!result.user.name || result.user.name.trim() === "") {
            go("profileSetup");
          } else {
            go("home");
          }
        } else {
          setError(result.message);
        }
      } catch (err) {
        setLoading(false);
        setError(err instanceof Error ? err.message : "Login failed. Please check your credentials.");
      }
      return;
    }

    // ── 3. Registration / Sign Up Flow ──
    const isParent = accountType === "Parent";
    if (name.trim().length < 2) {
      setError(isParent ? "Please enter parent full name." : "Please enter your name.");
      return;
    }
    if (!emailRegex.test(cleanEmail)) {
      setError(isParent ? (t.parentEmailLabel ? `Please enter a valid ${t.parentEmailLabel.toLowerCase()}.` : "Please enter a valid parent email address.") : "Please enter a valid email address.");
      return;
    }
    if (isParent) {
      if (childNameInput.trim().length < 2) {
        setError("Please enter child's name.");
        return;
      }
      if (!cleanChildEmail) {
        setError("Please enter your child's email address.");
        return;
      }
      if (!emailRegex.test(cleanChildEmail)) {
        setError("Please enter a valid email address for your child.");
        return;
      }
      if (cleanEmail === cleanChildEmail) {
        setError("Parent email and Child email must be different.");
        return;
      }
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setUserName(name.trim() || "User");
    setUserEmail(cleanEmail);
    if (isParent && cleanChildEmail) {
      setChildEmail?.(cleanChildEmail);
      setChildName?.(childNameInput.trim());
      setChildDietaryPreferences?.([childDietary]);
      setChildAllergens?.(childAllergensList);
    }
    setUserPassword(password);
    setLoading(true);

    try {
      const result = await sendEmailOtp({
        data: {
          email: cleanEmail,
          accountType,
          childEmail: isParent ? cleanChildEmail : undefined,
        },
      });
      setLoading(false);
      if (result.success) {
        go("verify");
      } else {
        setError(result.message);
      }
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Failed to send OTP. Please try again.");
    }
  }

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto max-w-md">
        <Topbar language={language} setLanguage={setLanguage} onBack={() => go("welcome")} />
        <section className="px-6 py-10">
          <h1 className="font-display text-3xl font-bold">{mode === "login" ? t.welcomeBack : t.createAccount}</h1>
          <p className="mt-2 text-muted-foreground">
            {mode === "login"
              ? (accountType === "Child" ? (t.childLoginSub || "Log in with your child email address using an OTP") : t.loginSub)
              : t.signupSub}
          </p>

          <div className="mt-8">
            <p className="mb-3 text-sm font-semibold">{t.accountTypeLabel}</p>
            {mode === "login" ? (
              <div className="grid grid-cols-2 gap-3">
                <Choice label={t.personal} selected={accountType === "Personal"} onClick={() => setAccountType("Personal")} />
                <Choice label={t.child || "Child"} selected={accountType === "Child"} onClick={() => setAccountType("Child")} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Choice label={t.personal} selected={accountType === "Personal"} onClick={() => setAccountType("Personal")} />
                <Choice label={t.parent} selected={accountType === "Parent"} onClick={() => setAccountType("Parent")} />
              </div>
            )}
          </div>

          <div className="mt-7 grid gap-5">
            {/* CHILD LOGIN: Only single child email field */}
            {mode === "login" && accountType === "Child" ? (
              <label className="grid gap-2 text-sm font-semibold text-foreground">
                {t.childEmailLabel || "Child's Email Address"}
                <div className="relative">
                  <UsersRound className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
                  <Input
                    className="h-12 rounded-xl border-border bg-surface pl-10 shadow-none focus-visible:ring-2"
                    type="email"
                    placeholder="child@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                  />
                </div>
              </label>
            ) : mode === "signup" && accountType === "Parent" ? (
              /* PARENT SIGNUP: Parent Information + Child's Own Profile & Personalization */
              <>
                <div className="rounded-2xl border border-border bg-surface/50 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-primary">1. Parent Information</p>
                  <div className="grid gap-4">
                    <label className="grid gap-1.5 text-sm font-semibold text-foreground">
                      {t.parentNameLabel || "Parent's Full Name"}
                      <Input
                        className="h-11 rounded-xl border-border bg-surface px-4 shadow-none focus-visible:ring-2"
                        placeholder="e.g. Dr. Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </label>

                    <label className="grid gap-1.5 text-sm font-semibold text-foreground">
                      {t.parentEmailLabel || "Parent's Email Address"}
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                        <Input
                          className="h-11 rounded-xl border-border bg-surface pl-10 shadow-none focus-visible:ring-2"
                          type="email"
                          placeholder="parent@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </label>

                    <label className="grid gap-1.5 text-sm font-semibold text-foreground">
                      {t.passwordLabel}
                      <Input
                        className="h-11 rounded-xl border-border bg-surface px-4 shadow-none focus-visible:ring-2"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface/50 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-primary">2. Child's Profile & Personalization</p>
                  <div className="grid gap-4">
                    <label className="grid gap-1.5 text-sm font-semibold text-foreground">
                      {t.childNameLabel || "Child's Full Name"}
                      <Input
                        className="h-11 rounded-xl border-border bg-surface px-4 shadow-none focus-visible:ring-2"
                        placeholder="e.g. Rahul"
                        value={childNameInput}
                        onChange={(e) => setChildNameInput(e.target.value)}
                      />
                    </label>

                    <label className="grid gap-1.5 text-sm font-semibold text-foreground">
                      {t.childEmailLabel || "Child's Email Address"}
                      <div className="relative">
                        <UsersRound className="absolute left-3 top-3 size-4 text-muted-foreground" />
                        <Input
                          className="h-11 rounded-xl border-border bg-surface pl-10 shadow-none focus-visible:ring-2"
                          type="email"
                          placeholder="child@example.com"
                          value={childEmailInput}
                          onChange={(e) => setChildEmailInput(e.target.value)}
                        />
                      </div>
                    </label>

                    <div>
                      <p className="mb-2 text-xs font-semibold text-foreground">{t.childFoodPrefLabel || "Child's Food Preference"}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {["Vegetarian", "Vegan", "Non-Vegetarian"].map((pref) => (
                          <Choice
                            key={pref}
                            label={pref}
                            selected={childDietary === pref}
                            onClick={() => setChildDietary(pref)}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold text-foreground">{t.childAllergensLabel || "Child's Allergens (to avoid)"}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {["Peanuts", "Milk", "Wheat / Gluten", "Soy", "Tree Nuts", "Eggs", "Fish"].map((allergen) => {
                          const active = childAllergensList.includes(allergen);
                          return (
                            <button
                              key={allergen}
                              type="button"
                              onClick={() => toggleAllergen(allergen)}
                              className={cn(
                                "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                                active
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-surface border border-border text-muted-foreground hover:bg-muted"
                              )}
                            >
                              {active ? `✓ ${allergen}` : `+ ${allergen}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* STANDARD PERSONAL SIGNUP OR LOGIN (PARENT / PERSONAL) */
              <>
                {mode === "signup" && (
                  <label className="grid gap-2 text-sm font-semibold text-foreground">
                    {t.fullNameLabel}
                    <Input
                      className="h-12 rounded-xl border-border bg-surface px-4 shadow-none focus-visible:ring-2"
                      placeholder={t.fullNameLabel}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </label>
                )}

                <label className="grid gap-2 text-sm font-semibold text-foreground">
                  {t.emailLabel}
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
                    <Input
                      className="h-12 rounded-xl border-border bg-surface pl-10 shadow-none focus-visible:ring-2"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                    />
                  </div>
                </label>

                <label className="grid gap-2 text-sm font-semibold text-foreground">
                  {t.passwordLabel}
                  <Input
                    className="h-12 rounded-xl border-border bg-surface px-4 shadow-none focus-visible:ring-2"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                  />
                </label>
              </>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-concern-soft p-3 text-sm text-concern">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <div>{error}</div>
              </div>
            )}

            <Button
              className="mt-2 h-13 rounded-xl text-base"
              disabled={loading}
              onClick={handleContinue}
            >
              {loading ? (
                <><Loader2 className="size-4 animate-spin" /> ...</>
              ) : (
                <>{mode === "login" && accountType !== "Child" ? t.loginButton : t.sendOtp} <ChevronRight /></>
              )}
            </Button>

            {mode === "login" ? (
              <p className="text-center text-xs text-muted-foreground">
                {t.noAccount}{" "}
                <button type="button" onClick={() => go("signup")} className="font-semibold text-primary underline">
                  {t.createOne}
                </button>
              </p>
            ) : (
              <p className="text-center text-xs text-muted-foreground">
                {t.haveAccount}{" "}
                <button type="button" onClick={() => go("login")} className="font-semibold text-primary underline">
                  {t.signIn}
                </button>
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

interface VerifyProps {
  accountType: AccountType;
  userName: string;
  userEmail: string;
  childEmail?: string;
  childName?: string;
  childDietaryPreferences?: string[];
  childAllergens?: string[];
  userPassword?: string;
  go: (s: Screen) => void;
  language: Language;
  setLanguage: (l: Language) => void;
}

function Verify({
  accountType, userName, userEmail, childEmail, childName,
  childDietaryPreferences, childAllergens, userPassword, go, language, setLanguage
}: VerifyProps) {
  const t = translations[language] || translations["English"];
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  async function handleVerify() {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter all 6 digits of the OTP.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (accountType === "Child") {
        const result = await verifyChildOtp({
          data: {
            childEmail: userEmail,
            otp: code,
          },
        });
        setLoading(false);
        if (result.success && result.user) {
          go("home");
        } else {
          setError(result.message);
          setOtp(["", "", "", "", "", ""]);
          refs.current[0]?.focus();
        }
      } else {
        const result = await verifyEmailOtp({
          data: {
            email: userEmail,
            otp: code,
            name: userName,
            password: userPassword,
            accountType,
            childEmail: accountType === "Parent" ? childEmail : undefined,
            childName: accountType === "Parent" ? childName : undefined,
            childDietaryPreferences: accountType === "Parent" ? childDietaryPreferences : undefined,
            childAllergens: accountType === "Parent" ? childAllergens : undefined,
            childLanguage: language,
          },
        });
        setLoading(false);
        if (result.success) {
          // After registration (OTP verify), always go to profile setup since
          // the registration form collects name but not full profile details.
          go("profileSetup");
        } else {
          setError(result.message);
          setOtp(["", "", "", "", "", ""]);
          refs.current[0]?.focus();
        }
      }
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Verification failed.");
    }
  }

  async function handleResend() {
    if (!userEmail) return;
    setResendLoading(true);
    setError(null);
    try {
      if (accountType === "Child") {
        const result = await sendChildLoginOtp({ data: { childEmail: userEmail } });
        setResendLoading(false);
        if (result.success) {
          setResendCooldown(60);
        } else {
          setError(result.message);
        }
      } else {
        const result = await sendEmailOtp({
          data: {
            email: userEmail,
            accountType,
            childEmail: accountType === "Parent" ? childEmail : undefined,
          },
        });
        setResendLoading(false);
        if (result.success) {
          setResendCooldown(60);
        } else {
          setError(result.message);
        }
      }
    } catch (err) {
      setResendLoading(false);
      setError(err instanceof Error ? err.message : "Resend failed.");
    }
  }

  const maskedEmail = userEmail
    ? userEmail.replace(/(.{2}).*(@.*)/, "$1***$2")
    : "your email";

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto max-w-md">
        <Topbar language={language} setLanguage={setLanguage} onBack={() => go(accountType === "Child" ? "login" : "signup")} />
        <section className="px-6 py-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            <Mail className="size-3" /> {accountType === "Child" ? (t.childAccount || "Child Account") : t.verifyEmail}
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold">{t.checkEmailTitle}</h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {t.sentOtpTo}<br />
            <strong className="text-foreground">{maskedEmail}</strong>
          </p>

          {accountType === "Parent" && childEmail && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs text-muted-foreground">
              <UsersRound className="size-3.5 text-primary shrink-0" />
              <span>{t.childEmailLabel || "Child's Email"}: <strong className="text-foreground">{childEmail}</strong></span>
            </div>
          )}

          <div className="mt-4 rounded-xl bg-primary-soft p-3 text-xs text-primary">
            <p className="font-semibold">{t.checkEmailTitle}</p>
            <p className="mt-0.5 text-muted-foreground">{t.otpSentDesc}</p>
          </div>

          {/* OTP input boxes */}
          <div className="mt-8 flex justify-between gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                value={digit}
                inputMode="numeric"
                maxLength={1}
                aria-label={`OTP digit ${i + 1}`}
                disabled={loading}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  const next = [...otp];
                  next[i] = val;
                  setOtp(next);
                  if (val && i < 5) refs.current[i + 1]?.focus();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !otp[i] && i > 0) {
                    refs.current[i - 1]?.focus();
                  }
                }}
                onPaste={(e) => {
                  // Handle paste of full 6-digit OTP
                  const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                  if (pasted.length === 6) {
                    setOtp(pasted.split(""));
                    refs.current[5]?.focus();
                    e.preventDefault();
                  }
                }}
                className={cn(
                  "size-12 rounded-xl border text-center text-xl font-bold outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30",
                  digit ? "border-primary bg-primary-soft text-primary" : "border-input bg-surface",
                  loading && "opacity-60",
                )}
              />
            ))}
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-concern-soft p-3 text-sm text-concern">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}

          <Button
            className="mt-6 h-13 w-full rounded-xl text-base"
            disabled={loading || otp.join("").length < 6}
            onClick={handleVerify}
          >
            {loading ? (
              <><Loader2 className="size-4 animate-spin" /> ...</>
            ) : (
              <><Check className="size-4" /> {t.verifyButton}</>
            )}
          </Button>

          <div className="mt-4 flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="sm"
              disabled={resendLoading || resendCooldown > 0}
              onClick={handleResend}
              className="text-primary"
            >
              {resendLoading ? (
                <><Loader2 className="size-3 animate-spin" /> ...</>
              ) : resendCooldown > 0 ? (
                `${t.resendIn} ${resendCooldown}s`
              ) : (
                t.resendOtp
              )}
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => go("home")}>
              {t.skipForNow}
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}

function Setup({ go, language, setLanguage }: { go: (s: Screen) => void; language: Language; setLanguage: (l: Language) => void }) {
  const [step, setStep] = useState(0);
  const [age, setAge] = useState("Adult");
  const [food, setFood] = useState("Vegetarian");
  const [watch, setWatch] = useState(["High Sugar", "High Sodium", "Allergens"]);
  const [selectedAllergens, setSelectedAllergens] = useState(["Milk", "Peanuts"]);
  const [tts, setTts] = useState(true);
  const [simple, setSimple] = useState(true);
  const toggle = (item: string, list: string[], setter: (v: string[]) => void) => setter(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto max-w-2xl">
        <Topbar language={language} setLanguage={setLanguage} onBack={() => step ? setStep(step - 1) : go("verify")} />
        <section className="px-6 py-8 md:px-10">
          <div className="mb-9">
            <div className="flex items-center">
              {setupSteps.map((label, i) => (
                <div key={label} className="flex flex-1 items-center last:flex-none">
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold", i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    {i < step ? <Check className="size-4" /> : i + 1}
                  </span>
                  {i < 3 && <span className={cn("h-0.5 w-full", i < step ? "bg-primary" : "bg-muted")} />}
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs font-medium text-muted-foreground">
              <span>About You</span><span>Food</span><span>Watch</span><span>Accessibility</span>
            </div>
          </div>
          {step === 0 && (
            <div>
              <h1 className="font-display text-3xl font-bold">About You</h1>
              <div className="mt-7 grid gap-6">
                <Field label="Name" defaultValue="Rahul" />
                <div>
                  <p className="mb-3 text-sm font-semibold">Age Group</p>
                  <div className="grid grid-cols-2 gap-3">{["Child", "Teen", "Adult", "Senior"].map((x) => <Choice key={x} label={x} selected={age === x} onClick={() => setAge(x)} />)}</div>
                </div>
                <label className="grid gap-2 text-sm font-semibold">Preferred Language
                  <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="h-12 rounded-xl border border-input bg-surface px-4 text-base"><option>English</option>{languages.slice(1).map((l) => <option key={l}>{l}</option>)}</select>
                </label>
              </div>
            </div>
          )}
          {step === 1 && (
            <div>
              <h1 className="font-display text-3xl font-bold">Your Food Preference</h1>
              <p className="mt-2 text-muted-foreground">Choose the option that fits you best.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">{["Vegetarian", "Vegan", "Eggetarian", "Non-Vegetarian"].map((x) => <Choice key={x} label={x} selected={food === x} onClick={() => setFood(x)} />)}</div>
              <div className="mt-8">
                <p className="mb-3 text-sm font-semibold">Ingredients to Avoid</p>
                <div className="relative"><Search className="absolute left-4 top-3.5 size-5 text-muted-foreground" /><Input className="h-12 rounded-xl pl-11" placeholder="Add ingredients you want to avoid" /></div>
                <div className="mt-3 flex flex-wrap gap-2">{["Peanuts", "Milk", "MSG"].map((x) => <span key={x} className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary">{x}<X className="size-3" /></span>)}</div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <h1 className="font-display text-3xl font-bold">What should NutriGuard watch?</h1>
              <p className="mt-2 text-muted-foreground">Select what matters to you.</p>
              <div className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {watchItems.map((x) => <label key={x} className="flex cursor-pointer items-center gap-3 text-sm font-medium"><Checkbox checked={watch.includes(x)} onCheckedChange={() => toggle(x, watch, setWatch)} className="size-5" />{x}</label>)}
              </div>
              {watch.includes("Allergens") && (
                <div className="mt-7 border-t border-border pt-6">
                  <p className="mb-4 font-semibold">Select Allergens</p>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {allergens.map((x) => <label key={x} className="flex cursor-pointer items-center gap-3 text-sm"><Checkbox checked={selectedAllergens.includes(x)} onCheckedChange={() => toggle(x, selectedAllergens, setSelectedAllergens)} />{x}</label>)}
                  </div>
                </div>
              )}
            </div>
          )}
          {step === 3 && (
            <div>
              <h1 className="font-display text-3xl font-bold">Make NutriGuard easier to use</h1>
              <div className="mt-7 divide-y divide-border">
                <div className="flex items-start justify-between gap-6 py-5"><div><p className="font-semibold">Text-to-Speech</p><p className="mt-1 text-sm text-muted-foreground">Read important information aloud.</p></div><Switch checked={tts} onCheckedChange={setTts} className="mt-1" /></div>
                <div className="flex items-start justify-between gap-6 py-5"><div><p className="font-semibold">Simple Explanations</p><p className="mt-1 text-sm text-muted-foreground">Explain difficult ingredient information in simple language.</p></div><Switch checked={simple} onCheckedChange={setSimple} className="mt-1" /></div>
              </div>
              <label className="mt-6 grid gap-2 text-sm font-semibold">Preferred Language
                <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="h-12 rounded-xl border border-input bg-surface px-4 text-base"><option>English</option>{languages.slice(1).map((l) => <option key={l}>{l}</option>)}</select>
              </label>
            </div>
          )}
          <Button className="mt-10 h-13 w-full rounded-xl text-base" onClick={() => step < 3 ? setStep(step + 1) : go("home")}>
            {step < 3 ? "Next" : "Finish Setup"}<ChevronRight />
          </Button>
        </section>
      </div>
    </main>
  );
}

// ─── Profile Setup Screen (post-registration) ────────────────

interface ProfileSetupProps {
  userEmail: string;
  userName: string;
  accountType: AccountType;
  language: Language;
  setLanguage: (l: Language) => void;
  onComplete: (name: string) => void;
}

function ProfileSetupScreen({ userEmail, userName, accountType, language, setLanguage, onComplete }: ProfileSetupProps) {
  const t = translations[language] || translations["English"];
  const [name, setName] = useState(userName || "");
  const [ageGroup, setAgeGroup] = useState("Adult");
  const [dietaryPref, setDietaryPref] = useState("Vegetarian");
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleAllergen = (a: string) =>
    setSelectedAllergens((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);

  async function handleSave() {
    if (name.trim().length < 2) {
      setError("Please enter your name (at least 2 characters).");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        data: {
          email: userEmail,
          name: name.trim(),
          accountType,
          ageGroup,
          dietaryPreferences: [dietaryPref],
          allergens: selectedAllergens,
          language,
        },
      });
      onComplete(name.trim());
    } catch {
      setError("Failed to save profile. Please try again.");
      setSaving(false);
    }
  }

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto max-w-md">
        <Topbar language={language} setLanguage={setLanguage} />
        <section className="px-6 py-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            <CircleUserRound className="size-3" /> {t.profileTitle || "Profile Setup"}
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold">
            {accountType === "Child" ? "Your Profile" : "Complete Your Profile"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {accountType === "Child"
              ? "Tell us about yourself so we can personalise your experience."
              : "Set up your profile to get personalised food safety alerts."}
          </p>

          <div className="mt-8 grid gap-6">
            <label className="grid gap-2 text-sm font-semibold text-foreground">
              {t.fullNameLabel || "Full Name"}
              <Input
                className="h-12 rounded-xl border-border bg-surface px-4 shadow-none focus-visible:ring-2"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <div>
              <p className="mb-3 text-sm font-semibold">Age Group</p>
              <div className="grid grid-cols-2 gap-3">
                {["Child", "Teen", "Adult", "Senior"].map((x) => (
                  <Choice key={x} label={x} selected={ageGroup === x} onClick={() => setAgeGroup(x)} />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold">Food Preference</p>
              <div className="grid grid-cols-2 gap-3">
                {["Vegetarian", "Vegan", "Eggetarian", "Non-Vegetarian"].map((x) => (
                  <Choice key={x} label={x} selected={dietaryPref === x} onClick={() => setDietaryPref(x)} />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold">Allergens to watch</p>
              <div className="flex flex-wrap gap-2">
                {["Peanuts", "Milk", "Wheat / Gluten", "Soy", "Tree Nuts", "Eggs", "Fish", "Sesame"].map((a) => {
                  const active = selectedAllergens.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAllergen(a)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface border border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {active ? `✓ ${a}` : `+ ${a}`}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="grid gap-2 text-sm font-semibold">
              Preferred Language
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="h-12 rounded-xl border border-input bg-surface px-4 text-base"
              >
                {languages.map((l) => <option key={l}>{l}</option>)}
              </select>
            </label>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-concern-soft p-3 text-sm text-concern">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                {error}
              </div>
            )}

            <Button className="h-13 w-full rounded-xl text-base" disabled={saving} onClick={handleSave}>
              {saving ? <><Loader2 className="size-4 animate-spin" /> Saving…</> : <><Check className="size-4" /> Save & Continue</>}
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}

// ─── App Shell ───────────────────────────────────────────────

const navItems = [
  { id: "home", icon: Home },
  { id: "scanner", icon: ScanLine },
  { id: "compare", icon: GitCompareArrows },
  { id: "messages", icon: MessageCircle },
  { id: "profile", icon: UserRound },
] as const;

function AppShell({ screen, go, language, setLanguage, children }: {
  screen: Screen; go: (s: Screen) => void; language: Language; setLanguage: (l: Language) => void; children: React.ReactNode;
}) {
  const t = copy[language];
  const labels = [t.home, t.scan, t.compare, t.messages, t.profile];
  return (
    <div className="min-h-dvh bg-background md:grid md:grid-cols-[92px_1fr]">
      <aside className="hidden border-r border-border bg-surface md:flex md:flex-col md:items-center md:py-6">
        <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground"><Leaf /></span>
        <nav className="mt-12 grid w-full gap-3 px-2">
          {navItems.map((item, i) => {
            const Icon = item.icon;
            const active = screen === item.id || (item.id === "scanner" && ["loading", "result", "report"].includes(screen));
            return (
              <Button key={item.id} variant="ghost" className={cn("h-14 flex-col gap-1 rounded-xl px-1 text-[11px]", active && "bg-primary-soft text-primary", item.id === "scanner" && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground")} onClick={() => go(item.id as Screen)}>
                <Icon />{labels[i]}
              </Button>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 pb-20 md:pb-0">
        <Topbar language={language} setLanguage={setLanguage} />
        {children}
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid h-18 grid-cols-5 border-t border-border bg-surface px-1 pb-[env(safe-area-inset-bottom)] md:hidden">
        {navItems.map((item, i) => {
          const Icon = item.icon;
          const active = screen === item.id || (item.id === "scanner" && ["loading", "result", "report"].includes(screen));
          return (
            <Button key={item.id} variant="ghost" className={cn("h-full flex-col gap-1 rounded-none px-1 text-[11px]", active && "text-primary", item.id === "scanner" && "mx-auto -mt-4 size-15 rounded-full bg-primary text-primary-foreground shadow-scan hover:bg-primary/90 hover:text-primary-foreground")} onClick={() => go(item.id as Screen)}>
              <Icon className={item.id === "scanner" ? "size-6" : "size-5"} />{labels[i]}
            </Button>
          );
        })}
      </nav>
    </div>
  );
}

// ─── Home Screen ─────────────────────────────────────────────

function HomeScreen({ go, t, parent, showHistory, setShowHistory, userEmail, childEmail, onViewScan, language = "English" }: {
  go: (s: Screen) => void; t: Translation; parent: boolean;
  showHistory: boolean; setShowHistory: (v: boolean) => void;
  userEmail?: string; childEmail?: string; onViewScan?: (scanId: string) => void;
  language?: Language;
}) {
  const ui = translations[language] || translations["English"];
  return (
    <main className="mx-auto max-w-3xl px-5 py-9 md:px-10 md:py-12">
      <h1 className="font-display text-3xl font-bold">{t.greeting}</h1>
      <p className="mt-2 text-lg text-muted-foreground">{t.ready}</p>

      {parent && (
        <section className="mt-8 border-b border-border pb-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">My Children</h2>
            <UsersRound className="text-primary" />
          </div>
          <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
            <div>
              <p className="font-bold">{childEmail ? childEmail.split("@")[0] : "Rahul"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{childEmail ? `Monitoring scans for ${childEmail}` : "Last scan: Chocolate Biscuits"}</p>
              <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-caution"><AlertTriangle className="size-4" /> Review</p>
            </div>
            <Button variant="outline" onClick={() => go("messages")}>View Activity</Button>
          </div>
        </section>
      )}

      <section className="mt-9 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary-soft text-primary"><Camera className="size-8" /></span>
        <h2 className="mt-5 font-display text-2xl font-bold">{t.scanProduct}</h2>
        <p className="mt-2 text-muted-foreground">{ui.scannerSub}</p>
        <Button className="mt-7 h-14 w-full max-w-md rounded-xl text-base shadow-sm font-semibold" onClick={() => go("scanner")}>
          <Camera className="size-5" />{ui.scanIngredients || t.camera}
        </Button>
        <div className="my-4 flex items-center gap-3 text-xs uppercase text-muted-foreground">
          <span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" />
        </div>
        <Button variant="outline" className="h-12 w-full max-w-md rounded-xl" onClick={() => go("scanner")}>
          <ImagePlus />{t.upload}
        </Button>
      </section>

      <section className="mt-12 grid grid-cols-3 divide-x divide-border border-y border-border py-5">
        {[
          { icon: ScanLine, label: ui.scanHistory, action: () => setShowHistory(!showHistory) },
          { icon: GitCompareArrows, label: t.compare, action: () => go("compare") },
          { icon: CircleUserRound, label: ui.profileTitle, action: () => go("profile") },
        ].map(({ icon: Icon, label, action }) => (
          <button key={label} className="grid place-items-center gap-2 px-2 text-center text-xs font-semibold text-muted-foreground hover:text-primary" onClick={action}>
            <Icon className="size-5" />{label}
          </button>
        ))}
      </section>

      {showHistory && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-bold">{ui.scanHistory}</h2>
          <ScanHistory userEmail={userEmail} onViewScan={onViewScan} />
        </section>
      )}
    </main>
  );
}

// ─── Real Scanner Screen ─────────────────────────────────────

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/bmp"];
const MAX_SIZE_MB = 10;

interface ScannerProps {
  go: (s: Screen) => void;
  setScanResult: (r: ScanResult | null) => void;
  setScanError: (e: string | null) => void;
  userEmail?: string;
  language?: Language;
}

function Scanner({ go, setScanResult, setScanError, userEmail, language = "English" }: ScannerProps) {
  const t = translations[language] || translations["English"];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string>("image/jpeg");
  const [dragOver, setDragOver] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      cameraStream?.getTracks().forEach((t) => t.stop());
    };
  }, [cameraStream]);

  function validateAndSetFile(file: File) {
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`Unsupported file type (${file.type}). Please use JPEG, PNG, or WebP.`);
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File is too large (${Math.round(file.size / 1024 / 1024)}MB). Max is ${MAX_SIZE_MB}MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setPreviewMime(file.type);
      setCameraActive(false);
      cameraStream?.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    };
    reader.readAsDataURL(file);
  }

  async function startCamera() {
    setError(null);
    setPreview(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
      });
      setCameraStream(stream);
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      setError(t.cameraPermissionDenied || "Camera access denied or unavailable. Please enable camera permissions in your browser or select an image from your gallery.");
    }
  }

  function captureCamera() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setPreview(dataUrl);
    setPreviewMime("image/jpeg");
    setCameraActive(false);
    cameraStream?.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
  }

  async function handleAnalyze() {
    if (!preview) { setError("Please select or capture an image first."); return; }
    setError(null);
    setScanResult(null);
    setScanError(null);

    const base64 = preview.split(",")[1];
    if (!base64) { setError("Invalid image data."); return; }

    go("loading");

    try {
      const result = await analyzeScan({ data: { imageBase64: base64, mimeType: previewMime, userEmail } });
      setScanResult(result);
      go("result");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setScanError(msg);
      go("result");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSetFile(file);
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 md:px-10">
      <h1 className="font-display text-3xl font-bold">{t.scannerTitle}</h1>
      <p className="mt-2 text-muted-foreground">{t.scannerSub}</p>

      {/* Camera Guidance Notice */}
      <div className="mt-4 flex items-start gap-3 rounded-xl bg-primary-soft p-3.5 text-xs text-primary font-medium">
        <Camera className="mt-0.5 size-4 shrink-0" />
        <p>{t.cameraGuidance || "Place the ingredient list inside the frame and ensure the text is clear, focused, and well lit."}</p>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-concern-soft p-4 text-sm text-concern">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Camera View */}
      {cameraActive && (
        <div className="relative mt-6 overflow-hidden rounded-2xl bg-black">
          <video ref={videoRef} className="w-full min-h-[300px] object-cover" autoPlay playsInline muted />
          {/* Scanner frame overlay */}
          <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-primary/60">
            <span className="absolute -left-1 -top-1 size-8 border-l-4 border-t-4 border-primary" />
            <span className="absolute -right-1 -top-1 size-8 border-r-4 border-t-4 border-primary" />
            <span className="absolute -bottom-1 -left-1 size-8 border-b-4 border-l-4 border-primary" />
            <span className="absolute -bottom-1 -right-1 size-8 border-b-4 border-r-4 border-primary" />
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Image Preview with Retake / Remove */}
      {preview && !cameraActive && (
        <div className="relative mt-6 overflow-hidden rounded-2xl border border-border bg-black/5">
          <img src={preview} alt="Selected ingredient label" className="max-h-[480px] w-full object-contain" />
          
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 rounded-xl bg-background/95 p-2 backdrop-blur shadow">
            <span className="text-xs text-muted-foreground truncate font-medium pl-1">Photo ready for analysis</span>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs rounded-lg" onClick={() => { setPreview(null); startCamera(); }}>
              <RefreshCw className="size-3.5" />{t.retakePhoto || "Retake"}
            </Button>
          </div>

          <button
            onClick={() => { setPreview(null); setCameraActive(false); }}
            className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-background/90 text-foreground shadow hover:bg-background"
            aria-label="Remove image"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Drag-and-drop / Gallery Upload Zone */}
      {!preview && !cameraActive && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "mt-6 flex min-h-48 cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed transition-colors p-6",
            dragOver ? "border-primary bg-primary-soft" : "border-border bg-surface hover:border-primary/50",
          )}
        >
          <Upload className={cn("size-10", dragOver ? "text-primary" : "text-muted-foreground")} />
          <div className="text-center">
            <p className="font-semibold text-foreground">{t.uploadImage}</p>
            <p className="mt-1 text-sm text-muted-foreground">Select from Gallery or Files (JPEG, PNG, WebP · max {MAX_SIZE_MB}MB)</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-5 grid gap-3">
        {cameraActive ? (
          <Button className="h-14 rounded-xl text-base shadow-sm" onClick={captureCamera}>
            <Camera className="size-5" />{t.capturePhoto}
          </Button>
        ) : preview ? (
          <Button className="h-14 rounded-xl text-base shadow-sm" onClick={handleAnalyze}>
            <ScanLine className="size-5" />{t.analyzeButton}
          </Button>
        ) : (
          <Button className="h-14 rounded-xl text-base shadow-sm" onClick={startCamera}>
            <Camera className="size-5" />{t.scanIngredients || t.useCamera}
          </Button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) validateAndSetFile(f); }}
        />

        {!cameraActive && (
          <Button variant={preview ? "outline" : "ghost"} className="h-12 rounded-xl text-primary" onClick={() => fileInputRef.current?.click()}>
            <ImagePlus className="size-4" />{preview ? t.changeImage : t.uploadImage}
          </Button>
        )}

        {(cameraActive || preview) && (
          <Button variant="ghost" className="h-10 text-muted-foreground" onClick={() => { setPreview(null); setCameraActive(false); cameraStream?.getTracks().forEach((t) => t.stop()); setCameraStream(null); }}>
            <X className="size-4" />{t.cancel}
          </Button>
        )}
      </div>

      {/* Tips */}
      <div className="mt-6 rounded-xl bg-muted/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tips for Best Results</p>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>• {t.cameraGuidance || "Place the ingredient list inside the frame and ensure the text is clear, focused, and well lit."}</li>
          <li>• Hold the camera steady and avoid reflective foil glare.</li>
          <li>• The system reads the ingredients printed on the package.</li>
        </ul>
      </div>
    </main>
  );
}

// ─── Loading Screen ──────────────────────────────────────────

const loadingSteps = [
  "Extracting text from image…",
  "Cleaning and normalizing text…",
  "Identifying ingredients…",
  "Looking up evidence…",
  "Preparing your results…",
];

function Loading() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, loadingSteps.length - 1));
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="grid min-h-[calc(100dvh-9rem)] place-items-center px-6 text-center">
      <div>
        <span className="relative mx-auto grid size-24 place-items-center rounded-full bg-primary-soft text-primary">
          <ScanLine className="size-10 animate-pulse" />
          <span className="absolute inset-0 animate-ping rounded-full border border-primary/30" />
        </span>
        <h1 className="mt-7 font-display text-2xl font-bold">Analyzing ingredients…</h1>
        <p className="mt-2 text-muted-foreground">{loadingSteps[stepIndex]}</p>
        <div className="mx-auto mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-muted">
          <span className="block h-full w-2/3 animate-scan rounded-full bg-primary" />
        </div>
        <div className="mt-6 flex justify-center gap-1.5">
          {loadingSteps.map((_, i) => (
            <span key={i} className={cn("size-2 rounded-full transition-colors", i <= stepIndex ? "bg-primary" : "bg-muted")} />
          ))}
        </div>
      </div>
    </main>
  );
}

// ─── Redesigned Scan Results Screen (Safety Score First) ──────

function Result({
  go,
  scanResult,
  scanError,
  language,
  userEmail,
}: {
  go: (s: Screen) => void;
  scanResult: ScanResult | null;
  scanError: string | null;
  language: Language;
  userEmail?: string;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [showOcr, setShowOcr] = useState(false);
  const [showScoreExpl, setShowScoreExpl] = useState(false);

  const t = translations[language] || translations["English"];

  // Error state
  if (scanError) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-8 md:px-10">
        <div className="flex items-start gap-3 rounded-2xl bg-concern-soft p-6">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-concern text-white">
            <X className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold text-concern-strong">Analysis Failed</h1>
            <p className="mt-2 text-sm leading-relaxed text-concern">{scanError}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3">
          <Button className="h-13 rounded-xl" onClick={() => go("scanner")}>
            <Camera />Try Again
          </Button>
          <Button variant="outline" className="h-12 rounded-xl" onClick={() => go("home")}>
            <Home />Go Home
          </Button>
        </div>
      </main>
    );
  }

  // No result yet
  if (!scanResult) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-8 md:px-10">
        <p className="text-muted-foreground">No scan result. Please scan a product first.</p>
        <Button className="mt-4" onClick={() => go("scanner")}>Go to Scanner</Button>
      </main>
    );
  }

  const recognized = scanResult.ingredients.filter((i) => i.match_status !== "unrecognized");
  const unrecognized = scanResult.ingredients.filter((i) => i.match_status === "unrecognized");
  const allIngredients = scanResult.ingredients;

  // Evidence-aware safety score
  const safetyScore: SafetyScoreResult = useMemo(() => {
    if (scanResult.safety_score) return scanResult.safety_score;
    return calculateSafetyScore(scanResult.ingredients);
  }, [scanResult]);

  const topNames = recognized.slice(0, 5).map((i) => i.ingredient?.ingredient_name ?? i.detected_text);
  const speechText = buildSpokenSummary(language, topNames, recognized.length, safetyScore.score);

  // Status Badge / Theme configs
  const tierConfig = {
    clean: {
      bg: "bg-safe-soft border-safe/30 text-safe-strong",
      badgeBg: "bg-safe text-white",
      scoreBg: "text-safe",
      label: "Clean & Wholesome",
      icon: ShieldCheck,
    },
    moderate: {
      bg: "bg-caution-soft border-caution/30 text-caution",
      badgeBg: "bg-caution text-white",
      scoreBg: "text-caution",
      label: "Moderate Additive Profile",
      icon: Info,
    },
    attention: {
      bg: "bg-concern-soft border-concern/30 text-concern-strong",
      badgeBg: "bg-concern text-white",
      scoreBg: "text-concern",
      label: "Requires Dietary Attention",
      icon: AlertTriangle,
    },
  };

  const currentTier = tierConfig[safetyScore.tier] || tierConfig.moderate;
  const TierIcon = currentTier.icon;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 md:px-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => go("scanner")}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />{t.back}
          </button>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t.analysisResult}</p>
          <h1 className="mt-1 font-display text-3xl font-bold">{t.summaryTitle}</h1>
        </div>
        <SpeechControls text={speechText} language={language} />
      </div>

      {/* ── SECTION 1: PRIMARY SAFETY SCORE OVERVIEW ───────────── */}
      <section className={cn("mt-6 rounded-2xl border p-6 transition-all", currentTier.bg)}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold", currentTier.badgeBg)}>
              <TierIcon className="size-3.5" />
              {currentTier.label}
            </span>
            <h2 className="mt-2 font-display text-2xl font-bold">{safetyScore.headline}</h2>
            <p className="mt-1 text-sm leading-relaxed opacity-90">{safetyScore.interpretation}</p>
          </div>

          <div className="flex sm:flex-col items-center justify-center shrink-0 rounded-2xl bg-white/70 p-4 border border-border/40 shadow-sm text-center min-w-28">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.safetyScoreTitle}</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={cn("font-display text-4xl font-extrabold", currentTier.scoreBg)}>
                {safetyScore.score}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">/ 100</span>
            </div>
            <span className="mt-1 text-[11px] font-medium text-muted-foreground">
              {safetyScore.evidenceCoveragePercent}% {t.evidenceCoverageLabel || "Evidence"}
            </span>
          </div>
        </div>

        <p className="mt-4 text-[11px] opacity-75 border-t border-black/10 pt-2">
          {t.scanDate}: {new Date(scanResult.scan_date).toLocaleString()}
        </p>
      </section>

      {/* ── SECTION 2: PERSONALIZED ALLERGEN ALERTS ───────────── */}
      {safetyScore.allergenAlerts.length > 0 && (
        <section className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-5">
          <div className="flex items-center gap-2 text-destructive font-bold text-base">
            <ShieldAlert className="size-5" />
            <span>{safetyScore.allergenAlerts.some(a => a.isChildAlert) ? t.childAllergenAlertTitle : t.allergenAlertTitle}</span>
          </div>
          <p className="mt-1 text-xs text-destructive/80">
            Detected ingredients matching your configured dietary allergen profile:
          </p>
          <div className="mt-3 space-y-2">
            {safetyScore.allergenAlerts.map((alert, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 rounded-xl bg-white/80 p-3 text-xs border border-destructive/20">
                <span className="font-semibold text-foreground">
                  {alert.ingredientName} <span className="font-normal text-muted-foreground">(matches {alert.matchedAllergen})</span>
                </span>
                <span className="shrink-0 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive">
                  {alert.isChildAlert ? "Child Profile" : "Personal Alert"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── SECTION 3: KEY FINDINGS SUMMARY ──────────────────── */}
      <section className="mt-6 rounded-2xl border border-border bg-surface p-5">
        <h3 className="font-display text-base font-bold text-foreground">{t.keyFindings}</h3>
        
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="rounded-xl bg-muted/60 p-3">
            <span className="font-display text-2xl font-bold text-foreground">{safetyScore.stats.identifiedCount}</span>
            <p className="mt-0.5 text-xs text-muted-foreground">{t.identifiedCountLabel}</p>
          </div>
          <div className="rounded-xl bg-muted/60 p-3">
            <span className={cn("font-display text-2xl font-bold", safetyScore.stats.attentionCount > 0 ? "text-caution" : "text-foreground")}>
              {safetyScore.stats.attentionCount}
            </span>
            <p className="mt-0.5 text-xs text-muted-foreground">{t.attentionCountLabel}</p>
          </div>
          <div className="rounded-xl bg-muted/60 p-3">
            <span className="font-display text-2xl font-bold text-safe">{safetyScore.stats.cleanCount}</span>
            <p className="mt-0.5 text-xs text-muted-foreground">{t.cleanCountLabel}</p>
          </div>
          <div className="rounded-xl bg-muted/60 p-3">
            <span className="font-display text-2xl font-bold text-muted-foreground">{safetyScore.stats.unrecognizedCount}</span>
            <p className="mt-0.5 text-xs text-muted-foreground">{t.unrecognizedCountLabel}</p>
          </div>
        </div>

        {/* Expandable Explanation of Safety Score */}
        <div className="mt-4 border-t border-border pt-3">
          <button
            onClick={() => setShowScoreExpl(!showScoreExpl)}
            className="flex w-full items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <span>{t.scoreExplanation || "How this score was calculated"}</span>
            <ChevronDown className={cn("size-4 transition-transform", showScoreExpl && "rotate-180")} />
          </button>
          
          {showScoreExpl && (
            <div className="mt-3 space-y-2 text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl">
              <p className="font-medium text-foreground">
                Base score is 100. Deductions are determined strictly from official Codex Alimentarius & FSSAI provisions:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                {safetyScore.factors.map((f, i) => (
                  <li key={i}>
                    <strong className="text-foreground">{f.title}:</strong> {f.description} ({f.impact} pts)
                  </li>
                ))}
                {safetyScore.factors.length === 0 && (
                  <li>All recognized ingredients are standard food components without flagged dietary concerns.</li>
                )}
              </ul>
              <p className="text-[11px] pt-1 opacity-80">
                Ingredients with known Acceptable Daily Intake (ADI) or sensitive additives impact the score. Unrecognized text introduces an explicit uncertainty margin.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── SECTION 4: VIEW DETAILS TOGGLE BUTTON ────────────── */}
      <div className="mt-6">
        <Button
          variant={showDetails ? "outline" : "default"}
          className="h-14 w-full rounded-xl text-base shadow-sm font-semibold"
          onClick={() => setShowDetails(!showDetails)}
        >
          <FileText className="size-5 mr-2" />
          {showDetails ? (t.hideDetails || "Hide Detailed Breakdown") : (t.viewDetails || "View Details")}
        </Button>
      </div>

      {/* ── SECTION 5: DETAILED INGREDIENT BREAKDOWN (EXPANDED) ── */}
      {showDetails && (
        <div className="mt-8 space-y-8 animate-in fade-in-50 duration-200">
          <div className="border-t border-border pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">{t.identifiedIngredients}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complete breakdown of recognized additives, functions, and official source evidence.
                </p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-sm font-bold text-muted-foreground">
                {allIngredients.length}
              </span>
            </div>

            {/* Ingredient Cards */}
            <div className="mt-5 space-y-4">
              {allIngredients.map((ingredient, i) => (
                <IngredientCard key={`${ingredient.detected_text}-${i}`} ingredient={ingredient} index={i} />
              ))}
            </div>
          </div>

          {/* Raw OCR text section */}
          {scanResult.ocr_text && (
            <section className="rounded-2xl border border-border bg-surface p-5">
              <button
                onClick={() => setShowOcr(!showOcr)}
                className="flex w-full items-center justify-between text-sm font-semibold text-muted-foreground hover:text-foreground"
              >
                <span>Original Raw OCR Text</span>
                <ChevronDown className={cn("size-4 transition-transform", showOcr && "rotate-180")} />
              </button>
              {showOcr && (
                <div className="mt-3 rounded-xl bg-muted p-4">
                  <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                    {scanResult.ocr_text}
                  </pre>
                </div>
              )}
            </section>
          )}

          {/* Back to Safety Summary Button */}
          <Button
            variant="secondary"
            className="h-12 w-full rounded-xl text-sm"
            onClick={() => setShowDetails(false)}
          >
            ↑ Back to Safety Summary
          </Button>
        </div>
      )}

      {/* Scan another product */}
      <div className="mt-8 grid gap-3">
        <Button variant="outline" className="h-12 rounded-xl" onClick={() => go("scanner")}>
          <ScanLine className="size-4" />{t.scanAnother}
        </Button>
      </div>

      {/* Disclaimer */}
      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        <strong>Disclaimer:</strong> {safetyScore.disclaimer} Always consult a qualified health professional or allergist for individual dietary requirements.
      </p>
    </main>
  );
}

// ─── Report Screen (enhanced) ────────────────────────────────

function Report({ scanResult, go, language }: { scanResult: ScanResult | null; go: (s: Screen) => void; language: Language }) {
  const [openSections, setOpenSections] = useState(["Ingredients", "Evidence"]);
  const toggle = (title: string) =>
    setOpenSections((prev) =>
      prev.includes(title) ? prev.filter((x) => x !== title) : [...prev, title],
    );

  const recognized = scanResult?.ingredients.filter((i) => i.ingredient !== null) ?? [];

  const sections = [
    {
      title: "Ingredients",
      content: (
        <div className="space-y-4">
          {scanResult?.ingredients.map((ing, i) => (
            <IngredientCard key={i} ingredient={ing} index={i} />
          )) ?? <p className="text-muted-foreground">No data.</p>}
        </div>
      ),
    },
    {
      title: "Evidence & Sources",
      content: (
        <div className="space-y-3">
          {recognized.map((m) => {
            const link = m.evidence?.official_detail_link || m.evidence?.official_source_url || m.ingredient?.official_source_link;
            return (
              <div key={m.ingredient?.ingredient_id} className="rounded-xl border border-border p-4">
                <p className="font-semibold">{m.ingredient?.ingredient_name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{m.evidence?.source_organization}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{m.evidence?.source_reference}</p>
                {link && (
                  <Button variant="link" size="sm" className="mt-2 h-auto p-0 text-xs" asChild>
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      View Official Source <ExternalLink className="ml-1 size-3" />
                    </a>
                  </Button>
                )}
              </div>
            );
          })}
          {recognized.length === 0 && <p className="text-sm text-muted-foreground">No evidence available.</p>}
        </div>
      ),
    },
  ];

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 md:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">FULL REPORT</p>
          <h1 className="font-display text-3xl font-bold">Ingredient Report</h1>
        </div>
        <SpeechControls text={`Full ingredient report. ${recognized.length} ingredients identified.`} language={language} />
      </div>
      <div className="mt-7 divide-y divide-border border-y border-border">
        {sections.map((section) => {
          const isOpen = openSections.includes(section.title);
          return (
            <section key={section.title}>
              <button className="flex w-full items-center justify-between py-5 text-left font-display text-lg font-bold" onClick={() => toggle(section.title)}>
                {section.title}
                <ChevronDown className={cn("transition-transform", isOpen && "rotate-180")} />
              </button>
              {isOpen && <div className="pb-6">{section.content}</div>}
            </section>
          );
        })}
      </div>
      <Button className="mt-6 h-12 w-full rounded-xl" onClick={() => go("result")}>
        ← Back to Results
      </Button>
    </main>
  );
}

// ─── Compare Screen ───────────────────────────────────────────

function Compare() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-8 md:px-10">
      <h1 className="font-display text-3xl font-bold">Compare Products</h1>
      <p className="mt-2 text-muted-foreground">See the differences that matter most.</p>
      <div className="mt-10 flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-surface p-10 text-center">
        <GitCompareArrows className="size-12 text-muted-foreground" />
        <p className="font-semibold text-foreground">No products to compare yet.</p>
        <p className="text-sm text-muted-foreground">
          Scan two products to compare their ingredient profiles side by side.
        </p>
      </div>
    </main>
  );
}

// ─── Messages Screen ─────────────────────────────────────────

function Messages({ go: _go }: { go: (s: Screen) => void }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-8 md:px-10">
      <h1 className="font-display text-3xl font-bold">Messages</h1>
      <p className="mt-2 text-muted-foreground">Notifications and alerts from NutriGuard.</p>
      <div className="mt-10 flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-surface p-10 text-center">
        <MessageCircle className="size-12 text-muted-foreground" />
        <p className="font-semibold text-foreground">No messages yet.</p>
        <p className="text-sm text-muted-foreground">
          Allergen alerts and scan activity notifications will appear here.
        </p>
      </div>
    </main>
  );
}

interface ProfileProps {
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  childEmail?: string;
  accountType?: AccountType;
  language?: Language;
  onSignOut?: () => void;
  onUpdateProfile?: (name: string, accountType: AccountType) => void;
}

function Profile({
  userName = "Rahul Sharma",
  userPhone,
  userEmail,
  childEmail,
  accountType = "Personal",
  language = "English",
  onSignOut,
  onUpdateProfile,
}: ProfileProps) {
  const t = translations[language] || translations["English"];
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [editAccountType, setEditAccountType] = useState<AccountType>(accountType);
  const [editDietaryPref, setEditDietaryPref] = useState("Vegetarian");
  const [editAllergens, setEditAllergens] = useState<string[]>([]);
  const [editLanguage, setEditLanguage] = useState<Language>(language);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageIsError, setMessageIsError] = useState(false);

  // Child accounts cannot change their account type
  const isChild = accountType === "Child";

  const displayContact = userEmail || userPhone || "user@example.com";

  function startEditing() {
    setEditName(userName);
    setEditAccountType(accountType);
    setEditLanguage(language);
    setEditing(true);
    setMessage(null);
  }

  const toggleAllergen = (a: string) =>
    setEditAllergens((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);

  async function handleSave() {
    if (editName.trim().length < 2) {
      setMessage("Name must be at least 2 characters.");
      setMessageIsError(true);
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      if (userEmail) {
        // Always use the authenticated user's own email as the key.
        // Child accounts cannot change their account type.
        await updateProfile({
          data: {
            email: userEmail,
            name: editName.trim(),
            accountType: isChild ? accountType : editAccountType,
            dietaryPreferences: [editDietaryPref],
            allergens: editAllergens,
            language: editLanguage,
          },
        });
      }
      onUpdateProfile?.(editName.trim(), isChild ? accountType : editAccountType);
      setEditing(false);
      setMessage("Profile updated successfully!");
      setMessageIsError(false);
    } catch {
      setMessage("Failed to update profile. Please try again.");
      setMessageIsError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 md:px-10">
      <div className="flex items-center gap-4">
        <span className="grid size-14 place-items-center rounded-full bg-primary-soft text-primary">
          <UserRound className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-bold">{t.profileTitle}</h1>
          <p className="text-lg font-semibold text-foreground">{userName}</p>
          {displayContact && <p className="text-sm text-muted-foreground">{displayContact}</p>}
        </div>
      </div>

      {message && (
        <div className={cn("mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold", messageIsError ? "bg-concern-soft text-concern" : "bg-safe-soft text-safe")}>
          {message}
        </div>
      )}

      {editing ? (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-bold">{t.editProfile}</h2>
          <div className="mt-4 grid gap-5">
            <label className="grid gap-2 text-sm font-semibold text-foreground">
              {t.fullNameLabel}
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-11 rounded-xl"
              />
            </label>

            {/* Child accounts: email is read-only, cannot change account type */}
            {isChild ? (
              <label className="grid gap-2 text-sm font-semibold text-foreground">
                Email (read-only)
                <Input value={userEmail || ""} disabled className="h-11 rounded-xl opacity-60 cursor-not-allowed" />
              </label>
            ) : (
              <div>
                <p className="mb-2 text-sm font-semibold">{t.accountTypeLabel}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Choice label={t.personal} selected={editAccountType === "Personal"} onClick={() => setEditAccountType("Personal")} />
                  <Choice label={t.parent} selected={editAccountType === "Parent"} onClick={() => setEditAccountType("Parent")} />
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-semibold">Food Preference</p>
              <div className="grid grid-cols-2 gap-2">
                {["Vegetarian", "Vegan", "Eggetarian", "Non-Vegetarian"].map((x) => (
                  <Choice key={x} label={x} selected={editDietaryPref === x} onClick={() => setEditDietaryPref(x)} />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold">{t.allergens} (to watch)</p>
              <div className="flex flex-wrap gap-2">
                {["Peanuts", "Milk", "Wheat / Gluten", "Soy", "Tree Nuts", "Eggs", "Fish", "Sesame"].map((a) => {
                  const active = editAllergens.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAllergen(a)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                        active ? "bg-primary text-primary-foreground" : "bg-muted border border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {active ? `✓ ${a}` : `+ ${a}`}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="grid gap-2 text-sm font-semibold">
              Preferred Language
              <select
                value={editLanguage}
                onChange={(e) => setEditLanguage(e.target.value as Language)}
                className="h-11 rounded-xl border border-input bg-surface px-4 text-base"
              >
                {languages.map((l) => <option key={l}>{l}</option>)}
              </select>
            </label>

            <div className="mt-2 flex gap-3">
              <Button onClick={handleSave} disabled={saving} className="rounded-xl flex-1">
                {saving ? "..." : t.saveProfile}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setMessage(null);
                }}
                className="rounded-xl"
              >
                {t.cancel}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-8 divide-y divide-border border-y border-border">
            <ProfileRow
              title={t.profileSub}
              items={[
                `${t.accountTypeLabel}: ${accountType === "Parent" ? t.parent : (accountType === "Child" ? (t.child || "Child") : t.personal)}`,
                ...(accountType === "Parent" && childEmail ? [`${t.childEmailLabel || "Child"}: ${childEmail}`] : []),
                language
              ]}
            />
            <ProfileRow title={t.allergens} items={editAllergens.length > 0 ? editAllergens : ["None set — edit profile to configure"]} />
            <ProfileRow
              title="Food Preference"
              items={[editDietaryPref]}
            />
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <Button
              className="h-12 w-full rounded-xl"
              onClick={startEditing}
            >
              {t.editProfile}
            </Button>

            {onSignOut && (
              <Button
                variant="outline"
                className="h-12 w-full rounded-xl text-concern hover:bg-concern-soft"
                onClick={onSignOut}
              >
                {t.signOut}
              </Button>
            )}
          </div>
        </>
      )}

      {/* Developer / Testing section */}
      <div className="mt-10 border-t border-border pt-8">
        <button
          onClick={() => setShowBenchmark(!showBenchmark)}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ChevronDown
            className={cn("size-4 transition-transform", showBenchmark && "rotate-180")}
          />
          Developer Tools &amp; Dataset 4 Benchmark
        </button>
        {showBenchmark && <BenchmarkPanel />}
      </div>
    </main>
  );
}


function ProfileRow({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="py-5">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((x) => <span key={x} className="rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground">{x}</span>)}
      </div>
    </section>
  );
}

// ─── Root App Component ──────────────────────────────────────

export function NutriGuardApp() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [language, setLanguage] = useState<Language>("English");
  const [accountType, setAccountType] = useState<AccountType>("Personal");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // User info collected during login/signup — flows throughout app
  const [userName, setUserName] = useState("Rahul");
  const [userEmail, setUserEmail] = useState("");
  const [childEmail, setChildEmail] = useState("");
  const [childName, setChildName] = useState("");
  const [childDietaryPreferences, setChildDietaryPreferences] = useState<string[]>(["Vegetarian"]);
  const [childAllergens, setChildAllergens] = useState<string[]>(["Peanuts", "Milk"]);
  const [userPassword, setUserPassword] = useState("");

  const go = useCallback((next: Screen) => {
    window.speechSynthesis?.cancel();
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleViewScan = useCallback(async (scanId: string) => {
    try {
      const detail = await getScanDetail({ data: { scanId, userEmail: userEmail || undefined } });
      if (detail) {
        setScanResult(detail);
        setScanError(null);
        go("result");
      }
    } catch (err) {
      console.error("Failed to view scan:", err);
    }
  }, [userEmail, go]);

  const appContent = useMemo(() => {
    const t = copy[language];
    const personalT = { ...t, greeting: `Hi, ${userName}` };
    if (screen === "home") {
      return (
        <HomeScreen
          go={go}
          t={personalT}
          parent={accountType === "Parent"}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          userEmail={userEmail}
          childEmail={childEmail}
          onViewScan={handleViewScan}
          language={language}
        />
      );
    }
    if (screen === "scanner") {
      return (
        <Scanner
          go={go}
          setScanResult={setScanResult}
          setScanError={setScanError}
          userEmail={userEmail}
          language={language}
        />
      );
    }
    if (screen === "loading") return <Loading />;
    if (screen === "result") return <Result go={go} scanResult={scanResult} scanError={scanError} language={language} userEmail={userEmail} />;
    if (screen === "report") return <Report go={go} scanResult={scanResult} language={language} />;
    if (screen === "compare") return <Compare />;
    if (screen === "messages") return <Messages go={go} />;
    return (
      <Profile
        userName={userName}
        userEmail={userEmail}
        childEmail={childEmail}
        accountType={accountType}
        language={language}
        onSignOut={() => {
          setUserEmail("");
          setChildEmail("");
          setChildName("");
          setUserName("User");
          go("welcome");
        }}
        onUpdateProfile={(newName, newType) => {
          setUserName(newName);
          setAccountType(newType);
        }}
      />
    );
  }, [screen, language, accountType, scanResult, scanError, showHistory, go, userName, userEmail, childEmail, handleViewScan]);

  if (screen === "welcome") return <Welcome go={go} language={language} setLanguage={setLanguage} />;
  if (screen === "login" || screen === "signup") return (
    <AuthScreen
      mode={screen}
      accountType={accountType}
      setAccountType={setAccountType}
      setUserName={setUserName}
      setUserEmail={setUserEmail}
      childEmail={childEmail}
      setChildEmail={setChildEmail}
      childName={childName}
      setChildName={setChildName}
      childDietaryPreferences={childDietaryPreferences}
      setChildDietaryPreferences={setChildDietaryPreferences}
      childAllergens={childAllergens}
      setChildAllergens={setChildAllergens}
      setUserPassword={setUserPassword}
      go={go}
      language={language}
      setLanguage={setLanguage}
    />
  );
  if (screen === "verify") return (
    <Verify
      accountType={accountType}
      userName={userName}
      userEmail={userEmail}
      childEmail={childEmail}
      childName={childName}
      childDietaryPreferences={childDietaryPreferences}
      childAllergens={childAllergens}
      userPassword={userPassword}
      go={go}
      language={language}
      setLanguage={setLanguage}
    />
  );
  if (screen === "setup") return <Setup go={go} language={language} setLanguage={setLanguage} />;
  if (screen === "profileSetup") return (
    <ProfileSetupScreen
      userEmail={userEmail}
      userName={userName}
      accountType={accountType}
      language={language}
      setLanguage={setLanguage}
      onComplete={(savedName) => {
        setUserName(savedName);
        go("home");
      }}
    />
  );

  return (
    <AppShell screen={screen} go={go} language={language} setLanguage={setLanguage}>
      {appContent}
    </AppShell>
  );
}




