import { motion } from "framer-motion";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Jordan M.",
    skinType: "Oily + Acne-prone",
    quote: "Finally a routine builder that doesn't assume I'm a 25-year-old woman. The alternating actives schedule cleared my skin in 6 weeks.",
    rating: 5,
    avatar: "JM",
  },
  {
    name: "Priya S.",
    skinType: "Dry + Sensitive",
    quote: "The ingredient conflict warnings saved me — I had no idea my retinol and BHA were fighting each other. My redness is gone.",
    rating: 5,
    avatar: "PS",
  },
  {
    name: "Alex T.",
    skinType: "Combination",
    quote: "I was spending way too much on products that didn't work together. DermIQ built me a budget-friendly routine that actually makes sense.",
    rating: 5,
    avatar: "AT",
  },
  {
    name: "Sam K.",
    skinType: "Normal + Hyperpigmentation",
    quote: "The flare-up mode is a lifesaver. When my skin freaked out last month, I knew exactly what to strip back to.",
    rating: 4,
    avatar: "SK",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Real people, real routines
        </h2>
        <p className="mt-3 text-muted-foreground text-sm sm:text-base">
          Join thousands building smarter routines with DermIQ.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TESTIMONIALS.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft flex flex-col hover:shadow-elev hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: 5 }).map((_, s) => (
                <Star
                  key={s}
                  className={`h-3 w-3 ${s < t.rating ? "fill-amber-400 text-amber-400" : "text-border"}`}
                />
              ))}
            </div>

            <p className="text-sm text-foreground/75 leading-relaxed flex-1 mb-4">
              "{t.quote}"
            </p>

            <div className="flex items-center gap-3 pt-3 border-t border-border/50">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent text-primary font-bold text-xs flex items-center justify-center shrink-0">
                {t.avatar}
              </div>
              <div>
                <p className="font-semibold text-xs">{t.name}</p>
                <p className="text-[10px] text-muted-foreground">{t.skinType}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
