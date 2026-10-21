import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, ChevronRight, ScanLine, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getScanHistory, deleteScan } from "@/lib/api/ingredients";
import type { ScanHistoryItem } from "@/lib/api/ingredients";

interface ScanHistoryProps {
  userEmail?: string;
  onViewScan?: (scanId: string) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

function statusLabel(status: string) {
  switch (status) {
    case "success": return { text: "Complete", cls: "text-safe" };
    case "partial": return { text: "Partial", cls: "text-caution" };
    case "no_ingredients": return { text: "No ingredients", cls: "text-muted-foreground" };
    default: return { text: "Failed", cls: "text-concern" };
  }
}

export function ScanHistory({ userEmail, onViewScan }: ScanHistoryProps) {
  const queryClient = useQueryClient();

  const { data: history, isLoading } = useQuery({
    queryKey: ["scan-history", userEmail],
    queryFn: () => getScanHistory({ data: { userEmail } }),
    staleTime: 10_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (scanId: string) => deleteScan({ data: { scanId, userEmail } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scan-history"] });
    },
  });

  if (isLoading) {
    return (
      <div className="mt-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-border bg-surface p-6 text-center">
        <ScanLine className="mx-auto size-10 text-muted-foreground" />
        <p className="mt-3 font-semibold text-muted-foreground">No scans yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Scan a food product label to see your history here.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 divide-y divide-border border-y border-border">
      {history.map((scan: ScanHistoryItem) => {
        const status = statusLabel(scan.processing_status);
        return (
          <article
            key={scan.scan_id}
            className="flex items-center gap-4 py-4 transition-colors hover:bg-muted/40 px-2 rounded-xl"
          >
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-4 text-left cursor-pointer"
              onClick={() => onViewScan?.(scan.scan_id)}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <ScanLine className="size-5" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">
                  {scan.ingredient_count} ingredient
                  {scan.ingredient_count !== 1 ? "s" : ""} detected
                </p>
                {scan.top_ingredients.length > 0 && (
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {scan.top_ingredients.join(", ")}
                    {scan.ingredient_count > 3 && "…"}
                  </p>
                )}
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {formatDate(scan.scan_date)}
                  <span className={`font-semibold ${status.cls}`}>
                    · {status.text}
                  </span>
                </div>
              </div>
            </button>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-concern"
                onClick={() => {
                  if (confirm("Delete this scan from your history?")) {
                    deleteMutation.mutate(scan.scan_id);
                  }
                }}
                disabled={deleteMutation.isPending}
                aria-label="Delete scan"
              >
                <Trash2 className="size-4" />
              </Button>

              {onViewScan && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => onViewScan(scan.scan_id)}
                  aria-label="View scan details"
                >
                  <ChevronRight className="size-5" />
                </Button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
