import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { BarrierScore } from "@/lib/skincare/types";

export function BarrierScoreCard({ score }: { score: BarrierScore }) {
  const [expanded, setExpanded] = useState(false);

  const colorMap = {
    green: { bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    amber: { bar: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    red: { bar: "bg-red-400", text: "text-red-700", bg: "bg-red-50 border-red-200" },
  };

  const colors = colorMap[score.color];

  return (
    <div className={`rounded-2xl border p-4 mb-6 ${colors.bg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold ${colors.text}`}>{score.score}</span>
              <span className={`text-xs font-medium ${colors.text} opacity-60`}>/100</span>
            </div>
            <p className={`text-xs font-semibold ${colors.text}`}>Barrier Score · {score.label}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-32 h-1.5 bg-black/10 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${colors.bar}`}
              initial={{ width: 0 }}
              animate={{ width: `${score.score}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className={`text-xs flex items-center gap-1 ${colors.text} opacity-70 hover:opacity-100 transition-opacity`}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expanded ? "Less" : "Why?"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 pt-3 border-t border-black/10 space-y-1.5"
          >
            {score.breakdown.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  item.impact === "positive" ? "bg-emerald-500" :
                  item.impact === "negative" ? "bg-red-400" : "bg-amber-400"
                }`} />
                <span className={`text-xs ${colors.text} opacity-80`}>{item.factor}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
