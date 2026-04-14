export type SkinCondition = "great" | "good" | "okay" | "bad" | "terrible";

export type ProgressEntry = {
  id: string;
  date: string; // ISO date string
  overallCondition: SkinCondition;
  concerns: {
    acne: number;       // 0-5 severity
    dryness: number;
    oiliness: number;
    redness: number;
    texture: number;
    pigmentation: number;
  };
  notes: string;
  productsUsed: string[]; // product names
  routineFollowed: "full" | "partial" | "skipped";
};

export type ProgressData = {
  entries: ProgressEntry[];
  currentRoutineId: string;
  routineStartDate: string;
};

const STORAGE_KEY = "skincare_progress";

export function loadProgress(): ProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { entries: [], currentRoutineId: "", routineStartDate: "" };
}

export function saveProgress(data: ProgressData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function addEntry(entry: ProgressEntry): ProgressData {
  const data = loadProgress();
  data.entries.unshift(entry);
  saveProgress(data);
  return data;
}

export function getRecentEntries(count: number = 14): ProgressEntry[] {
  return loadProgress().entries.slice(0, count);
}

export function getProgressSummary(entries: ProgressEntry[]): {
  trend: "improving" | "stable" | "declining";
  avgCondition: number;
  topConcerns: string[];
  adherence: number;
  recommendation: string;
} {
  if (entries.length < 2) {
    return {
      trend: "stable",
      avgCondition: 3,
      topConcerns: [],
      adherence: 100,
      recommendation: "Keep logging daily to see trends!",
    };
  }

  const conditionMap: Record<string, number> = {
    great: 5, good: 4, okay: 3, bad: 2, terrible: 1,
  };

  const scores = entries.map(e => conditionMap[e.overallCondition] || 3);
  const avgCondition = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Trend: compare first half vs second half
  const mid = Math.floor(scores.length / 2);
  const recentAvg = scores.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
  const olderAvg = scores.slice(mid).reduce((a, b) => a + b, 0) / (scores.length - mid);

  let trend: "improving" | "stable" | "declining" = "stable";
  if (recentAvg - olderAvg > 0.5) trend = "improving";
  else if (olderAvg - recentAvg > 0.5) trend = "declining";

  // Top concerns (highest average severity)
  const concernKeys = ["acne", "dryness", "oiliness", "redness", "texture", "pigmentation"] as const;
  const concernAvgs = concernKeys.map(key => ({
    key,
    avg: entries.reduce((sum, e) => sum + (e.concerns[key] || 0), 0) / entries.length,
  })).sort((a, b) => b.avg - a.avg);

  const topConcerns = concernAvgs.filter(c => c.avg > 2).map(c => c.key);

  // Adherence
  const fullCount = entries.filter(e => e.routineFollowed === "full").length;
  const adherence = Math.round((fullCount / entries.length) * 100);

  // Recommendation
  let recommendation = "";
  if (trend === "declining") {
    recommendation = "Your skin seems to be reacting. Consider simplifying your routine or checking for new product irritation.";
  } else if (trend === "improving") {
    recommendation = "Great progress! Your current routine is working well. Keep it up!";
  } else if (adherence < 50) {
    recommendation = "Try to be more consistent with your routine — consistency is key to seeing results.";
  } else if (topConcerns.length > 0) {
    recommendation = `Focus on addressing ${topConcerns.slice(0, 2).join(" and ")}. Consider adjusting products targeting these areas.`;
  } else {
    recommendation = "Your skin is stable. Keep your current routine for at least 4-6 weeks before making changes.";
  }

  return { trend, avgCondition, topConcerns, adherence, recommendation };
}
