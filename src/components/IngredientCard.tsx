import { ExternalLink, AlertTriangle, CheckCircle2, HelpCircle, AlertCircle, ShieldCheck, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { MatchedIngredient } from "@/db/schema";

interface IngredientCardProps {
  ingredient: MatchedIngredient;
  index: number;
}

const CONFIDENCE_CONFIG = {
  High: {
    label: "Confirmed",
    icon: CheckCircle2,
    bg: "bg-safe-soft",
    text: "text-safe-strong",
    border: "border-safe/30",
    dot: "bg-safe",
  },
  Medium: {
    label: "Good match",
    icon: CheckCircle2,
    bg: "bg-primary-soft",
    text: "text-primary",
    border: "border-primary/30",
    dot: "bg-primary",
  },
  Low: {
    label: "Possible match",
    icon: AlertCircle,
    bg: "bg-caution-soft",
    text: "text-caution",
    border: "border-caution/30",
    dot: "bg-caution",
  },
  Unknown: {
    label: "Not identified",
    icon: HelpCircle,
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
    dot: "bg-muted-foreground",
  },
} as const;

export function IngredientCard({ ingredient, index }: IngredientCardProps) {
  const cfg = CONFIDENCE_CONFIG[ingredient.confidence] ?? CONFIDENCE_CONFIG.Unknown;
  const ConfidenceIcon = cfg.icon;
  const ing = ingredient.ingredient;
  const ev = ingredient.evidence;

  // ── Unrecognized token card ──
  if (ingredient.match_status === "unrecognized" || !ing) {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${ingredient.detected_text} food ingredient standard site:fao.org OR site:fda.gov OR site:fssai.gov.in`)}`;
    return (
      <article
        className={cn(
          "rounded-2xl border bg-surface p-5",
          "border-border opacity-90",
        )}
        aria-label={`Unrecognized ingredient: ${ingredient.detected_text}`}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
            <HelpCircle className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                #{index + 1}
              </span>
              <h3 className="font-display font-semibold text-foreground">
                {ingredient.detected_text}
              </h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Could not confidently identify this ingredient in our database.
            </p>
            <div className="mt-2.5">
              <a
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <Globe className="size-3" />
                Search "{ingredient.detected_text}" on Codex / FDA / FSSAI
                <ExternalLink className="size-2.5 opacity-80" />
              </a>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // ── Matched/Partial ingredient card ──
  const officialLink = ev?.official_detail_link || ev?.official_source_url || ing.official_source_link;
  const sourceOrg = ev?.source_organization || ing.source_organization;
  const sourceRef = ev?.source_reference || ing.source_reference;

  return (
    <article
      className={cn(
        "rounded-2xl border bg-surface p-5 transition-shadow hover:shadow-md",
        cfg.border,
      )}
      aria-label={`Ingredient: ${ing.ingredient_name}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full",
            cfg.bg,
            cfg.text,
          )}
        >
          <ConfidenceIcon className="size-4" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-xs font-semibold text-muted-foreground">
              #{index + 1}
            </span>
            <h3 className="font-display text-lg font-bold text-foreground">
              {ing.ingredient_name}
            </h3>
            {ing.ins_number && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                INS {ing.ins_number}
              </span>
            )}
          </div>

          {/* Confidence badge */}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                cfg.bg,
                cfg.text,
              )}
            >
              <span className={cn("size-1.5 rounded-full", cfg.dot)} />
              {cfg.label}
            </span>

            {ing.ingredient_type && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                {ing.ingredient_type}
              </span>
            )}

            {ingredient.match_status === "partial" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-caution-soft px-2.5 py-0.5 text-xs font-semibold text-caution">
                <AlertTriangle className="size-3" />
                Verify manually
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mt-4 space-y-3 border-t border-border pt-4">
        {/* Function */}
        {ing.function && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Function
            </p>
            <p className="mt-0.5 text-sm font-medium text-foreground">
              {ing.function}
            </p>
          </div>
        )}

        {/* OCR detected text (if different from canonical) */}
        {ingredient.detected_text.toLowerCase().trim() !==
          ing.ingredient_name.toLowerCase().trim() && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Detected as
            </p>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {ingredient.detected_text}
            </p>
          </div>
        )}

        {/* Evidence summary */}
        {ev?.evidence_summary && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Information
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-foreground">
              {ev.evidence_summary}
            </p>
            {ev.notes && (
              <p className="mt-1 text-xs italic text-muted-foreground">
                {ev.notes}
              </p>
            )}
          </div>
        )}

        {/* Official Organization Verification Block */}
        <div className="rounded-xl border border-primary/20 bg-primary-soft/40 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <ShieldCheck className="size-3.5" />
              Official Regulatory Standard
            </p>
            {sourceOrg && (
              <span className="rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-primary shadow-xs">
                {sourceOrg.split("(")[0]?.trim() || "Verified"}
              </span>
            )}
          </div>

          {sourceOrg && (
            <p className="mt-1.5 text-xs font-semibold text-foreground">
              {sourceOrg}
            </p>
          )}

          {sourceRef && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Standard: <span className="font-mono text-foreground">{sourceRef}</span>
            </p>
          )}

          <div className="mt-3">
            <Button
              variant="default"
              size="sm"
              className="h-8 w-full gap-2 rounded-lg bg-primary text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 sm:w-auto"
              asChild
            >
              <a
                href={
                  officialLink ||
                  `https://www.google.com/search?q=${encodeURIComponent(`${ing.ingredient_name} food standard site:fao.org OR site:fda.gov OR site:fssai.gov.in OR site:efsa.europa.eu`)}`
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                <Globe className="size-3.5" />
                Open Official Source Standard
                <ExternalLink className="size-3 opacity-80" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
