import { motion } from "framer-motion";

function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}

export function SkeletonRoutine() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid gap-6 lg:grid-cols-2"
    >
      {[0, 1].map((col) => (
        <div key={col} className="rounded-2xl border bg-card p-6 shadow-soft space-y-4">
          <Pulse className="h-6 w-40" />
          <Pulse className="h-4 w-56" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Pulse className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Pulse className="h-4 w-3/4" />
                <Pulse className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </motion.div>
  );
}
