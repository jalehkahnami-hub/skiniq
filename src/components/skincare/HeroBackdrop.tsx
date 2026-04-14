import { useEffect, useRef } from "react";

type Props = {
  className?: string;
  children: React.ReactNode;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? true;
}

/**
 * Signature moment: subtle “light field” background that follows the pointer.
 * Uses CSS vars consumed by --gradient-hero in the design system.
 */
export function HeroBackdrop({ className, children }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;

    const handler = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--mx", `${x.toFixed(2)}%`);
      el.style.setProperty("--my", `${y.toFixed(2)}%`);
    };

    el.addEventListener("pointermove", handler, { passive: true });
    return () => el.removeEventListener("pointermove", handler);
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
