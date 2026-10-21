import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, ChevronDown, ChevronRight, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { runBenchmark, getOcrSamples } from "@/lib/api/ingredients";
import type { BenchmarkResult } from "@/lib/api/ingredients";
import type { OcrLabelSample } from "@/db/schema";

export function BenchmarkPanel() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<BenchmarkResult[] | null>(null);
  const [expanded, setExpanded] = useState(false);

  const { data: samples } = useQuery({
    queryKey: ["ocr-samples"],
    queryFn: () => getOcrSamples(),
  });

  const runAll = async () => {
    setRunning(true);
    setResults(null);
    try {
      const res = await runBenchmark({ data: {} });
      setResults(res);
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  };

  const passCount = results?.filter((r) => r.pass).length ?? 0;
  const totalCount = results?.length ?? 0;
  const accuracy = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0;

  return (
    <section className="mt-8 rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-secondary text-secondary-foreground">
            <FlaskConical className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold">OCR Benchmark</h2>
            <p className="text-sm text-muted-foreground">
              Test pipeline against {samples?.length ?? 150} Dataset 4 samples
            </p>
          </div>
        </div>
        <Button
          onClick={runAll}
          disabled={running}
          size="sm"
          className="rounded-xl"
        >
          {running ? "Running…" : "Run All"}
        </Button>
      </div>

      {results && (
        <div className="mt-5">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-safe-soft p-3 text-center">
              <p className="font-display text-2xl font-bold text-safe">{passCount}</p>
              <p className="text-xs font-semibold text-safe">Passed</p>
            </div>
            <div className="rounded-xl bg-concern-soft p-3 text-center">
              <p className="font-display text-2xl font-bold text-concern">
                {totalCount - passCount}
              </p>
              <p className="text-xs font-semibold text-concern">Failed</p>
            </div>
            <div className="rounded-xl bg-primary-soft p-3 text-center">
              <p className="font-display text-2xl font-bold text-primary">{accuracy}%</p>
              <p className="text-xs font-semibold text-primary">Accuracy</p>
            </div>
          </div>

          {/* Detail toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-4 flex w-full items-center justify-between py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            View all results
            {expanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>

          {expanded && (
            <div className="mt-2 max-h-96 overflow-y-auto rounded-xl border border-border">
              {results.map((r) => (
                <div
                  key={r.sample_id}
                  className={cn(
                    "grid grid-cols-[auto_1fr_auto] items-start gap-3 border-b border-border px-4 py-3 text-sm last:border-0",
                    r.pass ? "bg-safe-soft/30" : "bg-concern-soft/30",
                  )}
                >
                  <span className="mt-0.5">
                    {r.pass ? (
                      <CheckCircle2 className="size-4 text-safe" />
                    ) : (
                      <XCircle className="size-4 text-concern" />
                    )}
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">
                      {r.sample_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expected: {r.expected_ingredient ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Detected: {r.detected_ingredient ?? "Not matched"}{" "}
                      {r.detected_ingredient_id && (
                        <span className="text-primary">
                          ({r.detected_ingredient_id})
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                    {r.confidence}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
