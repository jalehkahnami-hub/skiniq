import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GeneratedRoutine, SkinType, AcneType, BudgetRange } from "@/lib/skincare/types";
import { ACNE_TYPES, BUDGET_RANGES } from "@/lib/skincare/catalog";
import { getProductExplanation } from "@/lib/skincare/buildRoutine";

interface Props {
  routine: GeneratedRoutine;
  skinType: SkinType[];
  concerns: string[];
  acneType: AcneType;
  budget: BudgetRange | "";
}

export function RoutineExport({ routine, skinType, concerns, acneType, budget }: Props) {
  const [exporting, setExporting] = useState(false);

  const exportAsText = () => {
    setExporting(true);

    const lines: string[] = [];
    const hr = "═".repeat(50);

    lines.push(hr);
    lines.push("  YOUR PERSONALIZED SKINCARE ROUTINE");
    lines.push(hr);
    lines.push("");
    lines.push(`Skin Type:  ${skinType.join(" + ")}`);
    lines.push(`Concerns:   ${concerns.join(", ")}`);
    if (acneType) lines.push(`Acne Type:  ${ACNE_TYPES.find((t) => t.id === acneType)?.name}`);
    if (budget) lines.push(`Budget:     ${BUDGET_RANGES.find((b) => b.id === budget)?.name}`);
    lines.push("");

    lines.push("─".repeat(50));
    lines.push("☀  MORNING ROUTINE");
    lines.push("─".repeat(50));
    routine.morning.forEach((p, i) => {
      const explanation = getProductExplanation(p);
      lines.push(`${i + 1}. ${p.name}`);
      lines.push(`   ${p.type} • ${p.brand}${p.price ? ` • $${p.price}` : ""}`);
      lines.push(`   → ${explanation.purpose}`);
      lines.push("");
    });

    lines.push("─".repeat(50));
    lines.push("🌙  NIGHT ROUTINE (Every Night)");
    lines.push("─".repeat(50));
    routine.nightEveryNight.forEach((p, i) => {
      const explanation = getProductExplanation(p);
      lines.push(`${i + 1}. ${p.name}`);
      lines.push(`   ${p.type} • ${p.brand}${p.price ? ` • $${p.price}` : ""}`);
      lines.push(`   → ${explanation.purpose}`);
      lines.push("");
    });

    if (routine.night2x.length > 0) {
      lines.push("+ RETINOL NIGHTS (Mon & Thu):");
      routine.night2x.forEach((p) => lines.push(`   • ${p.name}`));
      lines.push("");
    }

    if (routine.night3x.length > 0) {
      lines.push("+ EXFOLIANT NIGHTS (Tue, Fri & Sun):");
      routine.night3x.forEach((p) => lines.push(`   • ${p.name}`));
      lines.push("");
    }

    lines.push(hr);
    lines.push("  WEEKLY SCHEDULE");
    lines.push(hr);
    lines.push("Mon: Retinol  |  Tue: Exfoliant  |  Wed: Rest");
    lines.push("Thu: Retinol  |  Fri: Exfoliant  |  Sat: Rest");
    lines.push("Sun: Exfoliant");
    lines.push("");

    lines.push(hr);
    lines.push("  TIPS");
    lines.push(hr);
    lines.push("• Apply products thinnest to thickest");
    lines.push("• Wait 30-60 seconds between layers");
    lines.push("• SPF every morning, even indoors");
    lines.push("• Don't mix Vitamin C and Retinol in the same step");
    lines.push("• Introduce new products one at a time");
    lines.push("• Patch test on inner arm for 24 hours");
    lines.push("");
    lines.push("This is educational, not medical advice.");
    lines.push("Consult a dermatologist for persistent issues.");

    const text = lines.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-skincare-routine.txt";
    a.click();
    URL.revokeObjectURL(url);

    setExporting(false);
  };

  return (
    <Button variant="outline" onClick={exportAsText} disabled={exporting}>
      {exporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Export Routine
    </Button>
  );
}
