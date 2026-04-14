import { motion } from "framer-motion";
import { Sun, Moon, Sparkles } from "lucide-react";
import type { GeneratedRoutine, Product } from "@/lib/skincare/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

type DaySchedule = {
  day: string;
  morning: Product[];
  night: Product[];
  activeLabel?: string;
};

function buildWeek(routine: GeneratedRoutine): DaySchedule[] {
  return DAYS.map((day) => {
    const isRetinolDay = day === "Mon" || day === "Thu";
    const isExfoliantDay = day === "Tue" || day === "Fri" || day === "Sun";

    const nightProducts = [...routine.nightEveryNight];

    // Insert alternating actives before the closing steps (eye cream, moisturizer, face oil)
    const closingTypes = ["Eye Cream", "Moisturizer", "Face Oil"];
    const insertIdx = nightProducts.findIndex((p) => closingTypes.includes(p.type));
    const insertAt = insertIdx === -1 ? nightProducts.length : insertIdx;

    if (isRetinolDay && routine.night2x.length > 0) {
      nightProducts.splice(insertAt, 0, ...routine.night2x);
    }
    if (isExfoliantDay && routine.night3x.length > 0) {
      nightProducts.splice(insertAt, 0, ...routine.night3x);
    }

    let activeLabel: string | undefined;
    if (isRetinolDay && routine.night2x.length > 0) activeLabel = "Retinol";
    else if (isExfoliantDay && routine.night3x.length > 0) activeLabel = "Exfoliant";
    else activeLabel = "Rest";

    return { day, morning: routine.morning, night: nightProducts, activeLabel };
  });
}

export function WeeklyCalendar({ routine }: { routine: GeneratedRoutine }) {
  const week = buildWeek(routine);

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        Weekly Calendar
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Your actives rotate automatically — no guesswork needed.
      </p>

      {/* Desktop: horizontal grid */}
      <div className="hidden md:grid md:grid-cols-7 gap-2">
        {week.map((d, i) => (
          <motion.div
            key={d.day}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border bg-card p-3 text-center"
          >
            <p className="font-semibold text-sm mb-2">{d.day}</p>
            <div
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-block mb-3 ${
                d.activeLabel === "Retinol"
                  ? "bg-primary/15 text-primary"
                  : d.activeLabel === "Exfoliant"
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {d.activeLabel}
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex items-center gap-1 text-amber-600 mb-1">
                <Sun className="h-3 w-3" />
                <span className="text-[10px] font-medium">AM</span>
              </div>
              {d.morning.slice(0, 3).map((p, j) => (
                <p key={j} className="text-[10px] text-muted-foreground truncate" title={p.name}>
                  {p.name}
                </p>
              ))}
              {d.morning.length > 3 && (
                <p className="text-[10px] text-muted-foreground">+{d.morning.length - 3} more</p>
              )}

              <div className="flex items-center gap-1 text-indigo-600 mt-2 mb-1">
                <Moon className="h-3 w-3" />
                <span className="text-[10px] font-medium">PM</span>
              </div>
              {d.night.slice(0, 3).map((p, j) => (
                <p key={j} className="text-[10px] text-muted-foreground truncate" title={p.name}>
                  {p.name}
                </p>
              ))}
              {d.night.length > 3 && (
                <p className="text-[10px] text-muted-foreground">+{d.night.length - 3} more</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Mobile: scrollable list */}
      <div className="md:hidden space-y-3">
        {week.map((d, i) => (
          <motion.div
            key={d.day}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-xl border bg-card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold">{d.day}</p>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  d.activeLabel === "Retinol"
                    ? "bg-primary/15 text-primary"
                    : d.activeLabel === "Exfoliant"
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {d.activeLabel}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1 text-amber-600 mb-1.5">
                  <Sun className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Morning</span>
                </div>
                {d.morning.map((p, j) => (
                  <p key={j} className="text-xs text-muted-foreground truncate">{p.name}</p>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-indigo-600 mb-1.5">
                  <Moon className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Night</span>
                </div>
                {d.night.map((p, j) => (
                  <p key={j} className="text-xs text-muted-foreground truncate">{p.name}</p>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
