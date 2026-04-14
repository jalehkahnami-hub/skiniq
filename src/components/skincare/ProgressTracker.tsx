import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Plus, Calendar, ClipboardList, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import type { SkinCondition, ProgressEntry } from "@/lib/skincare/progressTypes";
import {
  loadProgress,
  addEntry,
  getRecentEntries,
  getProgressSummary,
} from "@/lib/skincare/progressTypes";

const CONDITIONS: { value: SkinCondition; emoji: string; label: string }[] = [
  { value: "great", emoji: "✨", label: "Great" },
  { value: "good", emoji: "😊", label: "Good" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "bad", emoji: "😟", label: "Bad" },
  { value: "terrible", emoji: "😣", label: "Terrible" },
];

const CONCERN_LABELS: Record<string, string> = {
  acne: "Acne / Breakouts",
  dryness: "Dryness",
  oiliness: "Oiliness",
  redness: "Redness",
  texture: "Rough Texture",
  pigmentation: "Dark Spots",
};

function SeveritySlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const colors = ["bg-green-500", "bg-lime-500", "bg-yellow-500", "bg-orange-500", "bg-red-500", "bg-red-700"];
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-28 flex-shrink-0">{label}</span>
      <div className="flex gap-1 flex-1">
        {[0, 1, 2, 3, 4, 5].map(level => (
          <button
            key={level}
            onClick={() => onChange(level)}
            className={`h-6 flex-1 rounded-sm transition-all ${
              level <= value ? colors[level] : "bg-muted"
            } ${level === value ? "ring-2 ring-foreground ring-offset-1" : ""}`}
            title={`${level}/5`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground w-6 text-right">{value}/5</span>
    </div>
  );
}

interface ProgressTrackerProps {
  routineProductNames: string[];
  onRequestRegenerate: () => void;
}

export function ProgressTracker({ routineProductNames, onRequestRegenerate }: ProgressTrackerProps) {
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [entries, setEntries] = useState<ProgressEntry[]>([]);

  // Form state
  const [condition, setCondition] = useState<SkinCondition>("okay");
  const [concerns, setConcerns] = useState({
    acne: 0, dryness: 0, oiliness: 0, redness: 0, texture: 0, pigmentation: 0,
  });
  const [notes, setNotes] = useState("");
  const [routineFollowed, setRoutineFollowed] = useState<"full" | "partial" | "skipped">("full");

  useEffect(() => {
    setEntries(getRecentEntries(30));
  }, []);

  const summary = getProgressSummary(entries);

  const handleSubmit = () => {
    const entry: ProgressEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      overallCondition: condition,
      concerns,
      notes,
      productsUsed: routineProductNames,
      routineFollowed,
    };
    const data = addEntry(entry);
    setEntries(data.entries.slice(0, 30));
    setShowForm(false);
    setCondition("okay");
    setConcerns({ acne: 0, dryness: 0, oiliness: 0, redness: 0, texture: 0, pigmentation: 0 });
    setNotes("");
    setRoutineFollowed("full");
    toast({ title: "Progress logged!", description: "Keep tracking daily for the best insights." });
  };

  const TrendIcon = summary.trend === "improving" ? TrendingUp : summary.trend === "declining" ? TrendingDown : Minus;
  const trendColor = summary.trend === "improving" ? "text-green-600" : summary.trend === "declining" ? "text-red-500" : "text-muted-foreground";
  const trendLabel = summary.trend === "improving" ? "Improving" : summary.trend === "declining" ? "Needs Attention" : "Stable";

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Skin Progress Tracker
        </CardTitle>
        <CardDescription>Log your skin condition daily and track improvements over time.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        {entries.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-accent rounded-xl p-3 text-center">
              <TrendIcon className={`h-5 w-5 mx-auto mb-1 ${trendColor}`} />
              <p className={`text-sm font-semibold ${trendColor}`}>{trendLabel}</p>
              <p className="text-xs text-muted-foreground">Trend</p>
            </div>
            <div className="bg-accent rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{summary.adherence}%</p>
              <p className="text-xs text-muted-foreground">Adherence</p>
            </div>
            <div className="bg-accent rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{entries.length}</p>
              <p className="text-xs text-muted-foreground">Entries</p>
            </div>
          </div>
        )}

        {/* AI Recommendation */}
        {entries.length >= 2 && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <p className="text-sm font-semibold mb-1">💡 Insight</p>
            <p className="text-sm text-muted-foreground">{summary.recommendation}</p>
            {summary.trend === "declining" && (
              <Button size="sm" variant="outline" className="mt-3" onClick={onRequestRegenerate}>
                <RefreshCw className="mr-2 h-3 w-3" /> Regenerate Routine Based on Progress
              </Button>
            )}
          </div>
        )}

        {/* Regenerate Button (always available) */}
        {entries.length >= 3 && summary.trend !== "declining" && (
          <Button variant="outline" size="sm" className="w-full" onClick={onRequestRegenerate}>
            <RefreshCw className="mr-2 h-4 w-4" /> Regenerate Routine Based on My Progress
          </Button>
        )}

        {/* Log Entry Button */}
        <Button
          className="w-full"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="mr-2 h-4 w-4" /> Log Today's Skin Condition
        </Button>

        {/* Log Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-5 pt-4 border-t">
                {/* Overall Condition */}
                <div>
                  <p className="text-sm font-semibold mb-3">How does your skin look/feel today?</p>
                  <div className="flex gap-2">
                    {CONDITIONS.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setCondition(c.value)}
                        className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${
                          condition === c.value
                            ? "border-primary bg-accent"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="text-2xl">{c.emoji}</span>
                        <p className="text-xs mt-1">{c.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Concern Severity */}
                <div>
                  <p className="text-sm font-semibold mb-3">Rate each concern (0 = none, 5 = severe)</p>
                  <div className="space-y-3">
                    {(Object.keys(concerns) as Array<keyof typeof concerns>).map(key => (
                      <SeveritySlider
                        key={key}
                        label={CONCERN_LABELS[key]}
                        value={concerns[key]}
                        onChange={v => setConcerns(prev => ({ ...prev, [key]: v }))}
                      />
                    ))}
                  </div>
                </div>

                {/* Routine Adherence */}
                <div>
                  <p className="text-sm font-semibold mb-3">Did you follow your routine today?</p>
                  <div className="flex gap-2">
                    {([
                      { value: "full" as const, label: "Full routine", emoji: "✅" },
                      { value: "partial" as const, label: "Partially", emoji: "⚡" },
                      { value: "skipped" as const, label: "Skipped", emoji: "❌" },
                    ]).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setRoutineFollowed(opt.value)}
                        className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${
                          routineFollowed === opt.value
                            ? "border-primary bg-accent"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="text-lg">{opt.emoji}</span>
                        <p className="text-xs mt-1">{opt.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-sm font-semibold mb-2">Notes (optional)</p>
                  <Input
                    placeholder="e.g., Tried a new moisturizer, skin felt tight after exfoliating..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    maxLength={500}
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button className="flex-1" onClick={handleSubmit}>Save Entry</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        {entries.length > 0 && (
          <div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center"
            >
              {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showHistory ? "Hide" : "View"} History ({entries.length} entries)
            </button>

            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 mt-3 max-h-64 overflow-y-auto">
                    {entries.map(entry => {
                      const cond = CONDITIONS.find(c => c.value === entry.overallCondition);
                      const date = new Date(entry.date);
                      return (
                        <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                          <span className="text-xl">{cond?.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                            </p>
                            {entry.notes && (
                              <p className="text-xs text-muted-foreground truncate">{entry.notes}</p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {entry.routineFollowed === "full" ? "✅" : entry.routineFollowed === "partial" ? "⚡" : "❌"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
