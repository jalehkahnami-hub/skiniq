import { AlertTriangle, Info } from "lucide-react";
import type { Product } from "@/lib/skincare/types";

interface Conflict {
  severity: "warning" | "info";
  message: string;
}

function detectConflicts(products: Product[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const names = products.map((p) => p.name.toLowerCase());
  const types = products.map((p) => p.type);

  const hasRetinol = types.includes("Retinol");
  const hasVitC = types.includes("Vitamin C");
  const hasBHA = names.some((n) => n.includes("bha") || n.includes("salicylic"));
  const hasAHA = names.some((n) => n.includes("aha") || n.includes("glycolic") || n.includes("lactic"));
  const hasNiacinamide = types.includes("Niacinamide");

  if (hasRetinol && hasVitC) {
    conflicts.push({
      severity: "warning",
      message: "Vitamin C + Retinol: Use Vitamin C in the morning and Retinol at night only — they can irritate when layered together.",
    });
  }

  if (hasRetinol && (hasBHA || hasAHA)) {
    conflicts.push({
      severity: "warning",
      message: "Retinol + Exfoliating Acids: Never use on the same night. Your routine alternates them — stick to the schedule.",
    });
  }

  if (hasVitC && hasNiacinamide) {
    conflicts.push({
      severity: "info",
      message: "Vitamin C + Niacinamide: These work fine together despite old myths. Apply Vitamin C first, then Niacinamide.",
    });
  }

  if (hasBHA && hasAHA) {
    conflicts.push({
      severity: "warning",
      message: "Multiple acids detected: Using BHA and AHA together can over-exfoliate. Alternate nights or pick one.",
    });
  }

  const exfoliantCount = products.filter(
    (p) => p.type === "Exfoliant" || names.some((n) => n.includes("acid") && p.type !== "Hyaluronic Acid")
  ).length;
  if (exfoliantCount > 2) {
    conflicts.push({
      severity: "warning",
      message: "Too many exfoliants: You have " + exfoliantCount + " exfoliating products. This may damage your skin barrier.",
    });
  }

  return conflicts;
}

export function IngredientConflicts({ routine }: { routine: { morning: Product[]; nightEveryNight: Product[]; night2x: Product[]; night3x: Product[] } }) {
  const allProducts = [
    ...routine.morning,
    ...routine.nightEveryNight,
    ...routine.night2x,
    ...routine.night3x,
  ];

  // Dedupe
  const unique = allProducts.reduce((acc, p) => {
    if (!acc.find((x) => x.name === p.name)) acc.push(p);
    return acc;
  }, [] as Product[]);

  const conflicts = detectConflicts(unique);

  if (conflicts.length === 0) return null;

  return (
    <div className="space-y-2.5 mt-6 mb-6">
      <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground/80">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        Ingredient Interactions
      </h4>
      {conflicts.map((c, i) => (
        <div
          key={i}
          className={`rounded-2xl p-4 text-sm flex items-start gap-3 ${
            c.severity === "warning"
              ? "bg-amber-50 border border-amber-200/70"
              : "bg-blue-50 border border-blue-200/70"
          }`}
        >
          {c.severity === "warning" ? (
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          ) : (
            <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-xs leading-relaxed ${c.severity === "warning" ? "text-amber-900" : "text-blue-900"}`}>{c.message}</p>
        </div>
      ))}
    </div>
  );
}
