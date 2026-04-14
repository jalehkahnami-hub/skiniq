import { motion } from "framer-motion";
import { Layers, ShieldCheck, Sparkles, BookOpen } from "lucide-react";

const STATS = [
  {
    icon: Layers,
    value: "220+",
    label: "Products in catalog",
    description: "From budget drugstore to luxury, K-beauty to Canadian brands",
  },
  {
    icon: Sparkles,
    value: "3",
    label: "Routine levels",
    description: "Beginner, Standard, and Advanced — matched to your experience",
  },
  {
    icon: ShieldCheck,
    value: "Smart",
    label: "Ingredient conflict detection",
    description: "Warns you before you layer things that don't work together",
  },
  {
    icon: BookOpen,
    value: "Free",
    label: "No sign-up required",
    description: "Build your full personalized routine in under 2 minutes",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Built for real skin
        </h2>
        <p className="mt-3 text-muted-foreground text-sm sm:text-base">
          Everything you need to build a routine that actually works for you.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft flex flex-col hover:shadow-elev hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground mb-0.5">{stat.value}</p>
            <p className="text-sm font-semibold text-foreground/80 mb-2">{stat.label}</p>
            <p className="text-xs text-muted-foreground leading-relaxed flex-1">{stat.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
