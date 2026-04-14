import { HeroBackdrop } from "@/components/skincare/HeroBackdrop";
import { SkincareRoutineBuilder } from "@/components/skincare/SkincareRoutineBuilder";
import { Testimonials } from "@/components/skincare/Testimonials";

const Index = () => {
  return (
    <HeroBackdrop className="min-h-screen bg-hero bg-hero-gradient">
      <header className="mx-auto max-w-6xl px-4 sm:px-6 pt-12 sm:pt-20 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          SkinIQ — Personalized for you
        </div>
        <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-6xl leading-[1.1]">
          Build your perfect<br className="hidden sm:block" />
          <span className="text-primary"> SkinIQ routine</span>
        </h1>
        <p className="mt-5 max-w-xl text-balance text-sm text-muted-foreground sm:text-base leading-relaxed">
          Tell us your skin type and concerns. We'll create a personalized AM/PM routine with product recommendations tailored to your needs and budget.
        </p>
      </header>

      <main className="px-4 sm:px-6 pb-10 pt-8 sm:pt-12">
        <SkincareRoutineBuilder />
      </main>

      <Testimonials />

      <footer className="px-4 sm:px-6 pb-10">
        <div className="mx-auto max-w-6xl rounded-2xl border bg-card/70 p-5 text-sm text-muted-foreground shadow-soft backdrop-blur">
          This is educational and not medical advice. If you have persistent irritation, severe acne, or conditions like eczema or rosacea, consider consulting a dermatologist.
        </div>
      </footer>
    </HeroBackdrop>
  );
};

export default Index;
