import { useState, useMemo, useCallback } from "react";
import { ChevronRight, Sparkles, Sun, Moon, Calendar, X, Search, ShoppingCart, ExternalLink, Crown, Check, Clipboard, ArrowLeftRight, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { WeeklyCalendar } from "@/components/skincare/WeeklyCalendar";
import { RoutineExport } from "@/components/skincare/RoutineExport";
import { IngredientConflicts } from "@/components/skincare/IngredientConflicts";
import { SkeletonRoutine } from "@/components/skincare/SkeletonRoutine";
import { ProgressTracker } from "@/components/skincare/ProgressTracker";
import { ProductComparison } from "@/components/skincare/ProductComparison";
import { getRecentEntries, getProgressSummary } from "@/lib/skincare/progressTypes";

import {
  CATALOG,
  CONCERNS,
  CONCERN_DESCRIPTIONS,
  SKIN_TYPES,
  SKIN_TYPE_DESCRIPTIONS,
  ACNE_TYPES,
  BUDGET_RANGES,
  PRODUCT_TYPES,
} from "@/lib/skincare/catalog";
import {
  generateFullRoutine,
  getProductExplanation,
  generateMinimumRoutine,
  checkProductCompatibility,
} from "@/lib/skincare/buildRoutine";
import type {
  Concern,
  SkinType,
  AcneType,
  BudgetRange,
  RoutineLevel,
  Product,
  GeneratedRoutine,
  SkincareProfile,
  ProductCategory,
} from "@/lib/skincare/types";

const ROUTINE_LEVELS: { id: RoutineLevel; name: string; tagline: string; description: string; steps: string; icon: string; color: string }[] = [
  {
    id: "beginner",
    name: "Start Simple",
    tagline: "Just getting started",
    description: "4 essential steps. Build a consistent habit before adding anything else. No actives, no complicated schedules.",
    steps: "Cleanser → Treatment Serum → Moisturizer → SPF",
    icon: "🌱",
    color: "emerald",
  },
  {
    id: "standard",
    name: "Balanced Routine",
    tagline: "Ready to level up",
    description: "5–7 steps with a targeted serum and optional toner. Includes vitamin C or niacinamide — no retinol yet.",
    steps: "Cleanser → Toner → Serum → Eye Cream* → Moisturizer → SPF",
    icon: "✨",
    color: "primary",
  },
  {
    id: "advanced",
    name: "Full Routine",
    tagline: "Comfortable with actives",
    description: "The complete protocol with retinol, exfoliants on a rotating schedule, and all categories. For experienced users only.",
    steps: "Cleanser → Toner → Essence → Serums → Retinol/Exfoliant nights → Eye Cream → Moisturizer → SPF",
    icon: "🔬",
    color: "purple",
  },
];

const STEP_LABELS = ["Skin Type", "Concerns", "Acne Type", "Budget", "Routine Level", "Products", "Routine"];

function ProgressBar({ step, hasConcernAcne }: { step: number; hasConcernAcne: boolean }) {
  const steps = hasConcernAcne ? STEP_LABELS : STEP_LABELS.filter(s => s !== "Acne Type");
  const progress = Math.min(step / steps.length, 1);
  
  return (
    <div className="mb-10">
      <div className="flex justify-between items-start mb-4">
        {steps.map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = step === stepNum || (step === 3 && !hasConcernAcne && idx === 2);
          const isComplete = step > stepNum;
          
          return (
            <div key={label} className="flex flex-col items-center gap-2 flex-1">
              <motion.div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                  isComplete
                    ? "bg-primary text-primary-foreground shadow-md"
                    : isActive
                    ? "bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                }`}
                animate={isActive ? { scale: 1.12 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {isComplete ? <Check className="h-3.5 w-3.5" /> : stepNum}
              </motion.div>
              <span className={`text-[10px] sm:text-xs text-center leading-tight transition-colors ${
                isActive ? "text-primary font-semibold" : isComplete ? "text-foreground/60" : "text-muted-foreground"
              }`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mx-4">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary-glow)))" }}
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function StepCard({ children, title, description }: { children: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Card className="shadow-elev border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-balance leading-tight">{title}</CardTitle>
          <CardDescription className="text-sm sm:text-base mt-1.5">{description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">{children}</CardContent>
      </Card>
    </motion.div>
  );
}

function NavigationButtons({
  onBack,
  onNext,
  nextLabel = "Continue",
  showBack = true,
  disabled = false,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  showBack?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-3 justify-center mt-8">
      {showBack && onBack && (
        <Button variant="outline" size="lg" onClick={onBack} className="min-w-[100px]">
          Back
        </Button>
      )}
      <Button variant="hero" size="lg" onClick={onNext} disabled={disabled} className="min-w-[140px] shadow-md shadow-primary/20 transition-shadow hover:shadow-lg hover:shadow-primary/30">
        {nextLabel} <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

export function SkincareRoutineBuilder() {
  // Wizard state
  const [step, setStep] = useState(1);
  
  // Profile state
  const [skinType, setSkinType] = useState<SkinType[]>([]);
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [acneType, setAcneType] = useState<AcneType>("");
  const [budget, setBudget] = useState<BudgetRange | "">("");
  const [routineLevel, setRoutineLevel] = useState<RoutineLevel | "">("");
  const [products, setProducts] = useState<Product[]>([]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [productWarnings, setProductWarnings] = useState<string[]>([]);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualBrand, setManualBrand] = useState("");
  const [manualCategory, setManualCategory] = useState<ProductCategory | "">("");
  
  // Result state
  const [routine, setRoutine] = useState<GeneratedRoutine | null>(null);
  
  // Shopping cart state
  const [shoppingCart, setShoppingCart] = useState<Product[]>([]);
  const [showCart, setShowCart] = useState(false);
  
  // Swap state
  const [swapTarget, setSwapTarget] = useState<{ product: Product; routineKey: keyof GeneratedRoutine; index: number } | null>(null);
  const [swapSearch, setSwapSearch] = useState("");
  
  // Feature states
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showFlareUpModal, setShowFlareUpModal] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  
  const hasConcernAcne = concerns.includes("Acne");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Search products
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    return CATALOG.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.brand.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    ).slice(0, 10);
  }, [searchQuery]);
  
  // Toggles
  const toggleSkinType = (type: SkinType) => {
    setSkinType(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };
  
  const toggleConcern = (concern: Concern) => {
    setConcerns(prev => prev.includes(concern) ? prev.filter(c => c !== concern) : [...prev, concern]);
  };
  
  const addManualProduct = () => {
    if (!manualName.trim() || !manualBrand.trim() || !manualCategory) return;
    const product: Product = {
      id: Date.now(),
      name: manualName.trim(),
      type: manualCategory as ProductCategory,
      brand: manualBrand.trim(),
    };
    const warnings = checkProductCompatibility(product, skinType, concerns, acneType, products);
    if (warnings.length > 0) setProductWarnings(prev => [...prev, ...warnings]);
    setProducts(prev => [...prev, product]);
    setManualName("");
    setManualBrand("");
    setManualCategory("");
    setShowManualAdd(false);
    setSearchQuery("");
    toast({ title: "Product added!", description: `${product.name} added to your list.` });
  };

  const addProduct = (p: typeof CATALOG[0]) => {
    const product: Product = {
      id: Date.now(),
      name: p.name,
      type: p.category,
      brand: p.brand,
      clean: p.clean,
      price: p.price,
      affiliateUrl: p.affiliateUrl,
    };
    
    const warnings = checkProductCompatibility(product, skinType, concerns, acneType, products);
    if (warnings.length > 0) {
      setProductWarnings(prev => [...prev, ...warnings]);
    }
    
    setProducts(prev => [...prev, product]);
    setSearchQuery("");
  };
  
  const removeProduct = (id: number | undefined) => {
    setProducts(products.filter(p => p.id !== id));
  };
  
  // Cart functions
  const addToCart = (product: Product) => {
    if (!shoppingCart.find(p => p.name === product.name)) {
      setShoppingCart([...shoppingCart, product]);
    }
  };
  
  const removeFromCart = (name: string) => {
    setShoppingCart(shoppingCart.filter(p => p.name !== name));
  };
  
  const cartTotal = shoppingCart.reduce((sum, p) => sum + (p.price || 0), 0);
  
  // Generate routine
  const generateRoutine = () => {
    setIsGenerating(true);
    setStep(hasConcernAcne ? 7 : 6);

    setTimeout(() => {
      const profile: SkincareProfile = {
        skinType,
        concerns,
        acneType,
        budget: budget as BudgetRange,
        routineLevel: (routineLevel as RoutineLevel) || "standard",
        ownedProducts: products,
      };

      const result = generateFullRoutine(profile);
      setRoutine(result);
      setIsGenerating(false);
      toast({
        title: "Your SkinIQ routine is ready!",
        description: "Scroll down to see your morning and night routines.",
      });
    }, 1200);
  };
  
  // Copy routine to clipboard
  const copyRoutine = async () => {
    if (!routine) return;
    
    const lines: string[] = [];
    lines.push(`Skin type: ${skinType.join(" + ")}`);
    lines.push(`Concerns: ${concerns.join(", ")}`);
    if (budget) lines.push(`Budget: ${BUDGET_RANGES.find(b => b.id === budget)?.name}`);
    lines.push("");
    
    lines.push("MORNING ROUTINE");
    lines.push("-".repeat(20));
    routine.morning.forEach((p, i) => lines.push(`${i + 1}. ${p.name} (${p.type})`));
    lines.push("");
    
    lines.push("NIGHT ROUTINE (Every Night)");
    lines.push("-".repeat(20));
    routine.nightEveryNight.forEach((p, i) => lines.push(`${i + 1}. ${p.name} (${p.type})`));
    
    if (routine.night2x.length > 0) {
      lines.push("");
      lines.push("+ RETINOL NIGHTS (Mon/Thu)");
      routine.night2x.forEach(p => lines.push(`   • ${p.name}`));
    }
    
    if (routine.night3x.length > 0) {
      lines.push("");
      lines.push("+ EXFOLIANT NIGHTS (Tue/Fri/Sun)");
      routine.night3x.forEach(p => lines.push(`   • ${p.name}`));
    }
    
    lines.push("");
    lines.push("Note: Patch test and introduce new actives slowly.");
    
    await navigator.clipboard.writeText(lines.join("\n"));
    toast({ title: "Copied!", description: "Routine copied to clipboard." });
  };
  
  // Swap product in routine
  const swapAlternatives = useMemo(() => {
    if (!swapTarget) return [];
    const query = swapSearch.toLowerCase();
    return CATALOG
      .filter(p => p.category === swapTarget.product.type || (query && (
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      )))
      .filter(p => p.name !== swapTarget.product.name)
      .slice(0, 12);
  }, [swapTarget, swapSearch]);

  const handleSwap = useCallback((newCatalogProduct: typeof CATALOG[0]) => {
    if (!routine || !swapTarget) return;
    const newProduct: Product = {
      name: newCatalogProduct.name,
      type: newCatalogProduct.category,
      brand: newCatalogProduct.brand,
      clean: newCatalogProduct.clean,
      price: newCatalogProduct.price,
      affiliateUrl: newCatalogProduct.affiliateUrl,
    };
    
    const updated = { ...routine };
    const arr = [...updated[swapTarget.routineKey]];
    arr[swapTarget.index] = newProduct;
    updated[swapTarget.routineKey] = arr;
    setRoutine(updated);
    setSwapTarget(null);
    setSwapSearch("");
    toast({ title: "Product swapped!", description: `Replaced with ${newProduct.name}` });
  }, [routine, swapTarget]);

  const removeFromRoutine = useCallback((routineKey: keyof GeneratedRoutine, index: number) => {
    if (!routine) return;
    const updated = { ...routine };
    const arr = [...updated[routineKey]];
    arr.splice(index, 1);
    updated[routineKey] = arr;
    setRoutine(updated);
    toast({ title: "Product removed", description: "You can always add it back." });
  }, [routine]);

  // Regenerate routine based on progress
  const regenerateFromProgress = useCallback(() => {
    const entries = getRecentEntries(14);
    const summary = getProgressSummary(entries);
    
    // Adjust concerns based on progress data
    const updatedConcerns = [...concerns];
    if (summary.topConcerns.includes("acne") && !updatedConcerns.includes("Acne")) {
      updatedConcerns.push("Acne");
    }
    if (summary.topConcerns.includes("dryness") && !updatedConcerns.includes("Dehydration")) {
      updatedConcerns.push("Dehydration");
    }
    if (summary.topConcerns.includes("redness") && !updatedConcerns.includes("Redness")) {
      updatedConcerns.push("Redness");
    }
    if (summary.topConcerns.includes("pigmentation") && !updatedConcerns.includes("Dark Spots")) {
      updatedConcerns.push("Dark Spots");
    }
    
    setConcerns(updatedConcerns);
    
    setIsGenerating(true);
    setTimeout(() => {
      const profile: SkincareProfile = {
        skinType,
        concerns: updatedConcerns,
        acneType,
        budget: budget as BudgetRange,
        routineLevel: (routineLevel as RoutineLevel) || "standard",
        ownedProducts: products,
      };
      const result = generateFullRoutine(profile);
      setRoutine(result);
      setIsGenerating(false);
      toast({
        title: "SkinIQ routine updated!",
        description: "Regenerated based on your skin progress data.",
      });
    }, 1200);
  }, [skinType, concerns, acneType, budget, products]);

  // Reset
  const reset = () => {
    setStep(1);
    setSkinType([]);
    setConcerns([]);
    setAcneType("");
    setBudget("");
    setRoutineLevel("");
    setProducts([]);
    setRoutine(null);
    setProductWarnings([]);
    setSwapTarget(null);
    setSwapSearch("");
  };
  
  return (
    <div className="mx-auto w-full max-w-4xl">
      <ProgressBar step={step} hasConcernAcne={hasConcernAcne} />
      
      <AnimatePresence mode="wait">
        {/* Step 1: Skin Type */}
        {step === 1 && (
          <StepCard
            key="step1"
            title="What's your skin type?"
            description="Select one or more that describe your skin (e.g., Combination + Sensitive)."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SKIN_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleSkinType(type)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-soft group relative overflow-hidden ${
                    skinType.includes(type)
                      ? "border-primary bg-accent shadow-soft"
                      : "border-border bg-card hover:border-primary/40 hover:bg-accent/30"
                  }`}
                >
                  {skinType.includes(type) && (
                    <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </span>
                  )}
                  <div className="font-semibold text-base">{type}</div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {SKIN_TYPE_DESCRIPTIONS[type]}
                  </p>
                </button>
              ))}
            </div>
            
            {skinType.length > 0 && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 bg-accent rounded-full px-4 py-1.5 mb-5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-medium">{skinType.join(" + ")}</span>
                </div>
                <NavigationButtons onNext={() => setStep(2)} showBack={false} />
              </div>
            )}
          </StepCard>
        )}
        
        {/* Step 2: Concerns */}
        {step === 2 && (
          <StepCard
            key="step2"
            title="What are your skin concerns?"
            description="Select all that apply - we'll prioritize your routine accordingly."
          >
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {CONCERNS.map((concern) => (
                <button
                  key={concern}
                  onClick={() => toggleConcern(concern)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-soft relative overflow-hidden ${
                    concerns.includes(concern)
                      ? "border-primary bg-accent shadow-soft"
                      : "border-border bg-card hover:border-primary/40 hover:bg-accent/30"
                  }`}
                >
                  {concerns.includes(concern) && (
                    <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </span>
                  )}
                  <div className="font-semibold text-sm pr-6">{concern}</div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {CONCERN_DESCRIPTIONS[concern]}
                  </p>
                </button>
              ))}
            </div>
            
            {concerns.length > 0 && (
              <NavigationButtons
                onBack={() => setStep(1)}
                onNext={() => setStep(concerns.includes("Acne") ? 3 : 4)}
              />
            )}
          </StepCard>
        )}
        
        {/* Step 3: Acne Type (conditional) */}
        {step === 3 && hasConcernAcne && (
          <StepCard
            key="step3"
            title="What type of acne do you have?"
            description="Different acne types respond to different treatments."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {ACNE_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setAcneType(type.id)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-soft relative overflow-hidden ${
                    acneType === type.id
                      ? "border-primary bg-accent shadow-soft"
                      : "border-border bg-card hover:border-primary/40 hover:bg-accent/30"
                  }`}
                >
                  {acneType === type.id && (
                    <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </span>
                  )}
                  <div className="font-semibold text-base pr-8">{type.name}</div>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{type.desc}</p>
                </button>
              ))}
            </div>
            
            {acneType && (
              <NavigationButtons
                onBack={() => setStep(2)}
                onNext={() => setStep(4)}
              />
            )}
          </StepCard>
        )}
        
        {/* Step 4: Budget */}
        {step === 4 && (
          <StepCard
            key="step4"
            title="What's your budget?"
            description="This helps us recommend products in your price range."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {BUDGET_RANGES.map((range) => (
                <button
                  key={range.id}
                  onClick={() => setBudget(range.id)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-soft relative overflow-hidden ${
                    budget === range.id
                      ? "border-primary bg-accent shadow-soft"
                      : "border-border bg-card hover:border-primary/40 hover:bg-accent/30"
                  }`}
                >
                  {budget === range.id && (
                    <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </span>
                  )}
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{range.icon}</span>
                    <div>
                      <div className="font-semibold text-base">{range.name}</div>
                      <p className="text-sm text-muted-foreground mt-1">{range.desc}</p>
                      {range.id === "mixed" && (
                        <p className="text-xs text-primary mt-2 font-medium">
                          💡 Invest in actives, save on basics
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {budget && (
              <NavigationButtons
                onBack={() => setStep(hasConcernAcne ? 3 : 2)}
                onNext={() => setStep(5)}
              />
            )}
          </StepCard>
        )}

        {/* Step 5: Routine Level */}
        {step === 5 && (
          <StepCard
            key="step-level"
            title="How experienced are you?"
            description="This shapes how many steps and which actives go into your routine."
          >
            <div className="grid gap-3">
              {ROUTINE_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setRoutineLevel(level.id)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-soft relative overflow-hidden ${
                    routineLevel === level.id
                      ? level.color === "emerald"
                        ? "border-emerald-500 bg-emerald-50/60 shadow-soft"
                        : level.color === "purple"
                        ? "border-purple-500 bg-purple-50/60 shadow-soft"
                        : "border-primary bg-accent shadow-soft"
                      : "border-border bg-card hover:border-primary/40 hover:bg-accent/30"
                  }`}
                >
                  {routineLevel === level.id && (
                    <span className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center ${
                      level.color === "emerald" ? "bg-emerald-500" : level.color === "purple" ? "bg-purple-500" : "bg-primary"
                    }`}>
                      <Check className="h-3 w-3 text-white" />
                    </span>
                  )}
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{level.icon}</span>
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-base">{level.name}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          level.color === "emerald" ? "bg-emerald-100 text-emerald-700"
                          : level.color === "purple" ? "bg-purple-100 text-purple-700"
                          : "bg-primary/10 text-primary"
                        }`}>{level.tagline}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{level.description}</p>
                      <p className={`text-xs font-mono mt-2 ${
                        level.color === "emerald" ? "text-emerald-700"
                        : level.color === "purple" ? "text-purple-700"
                        : "text-primary"
                      }`}>{level.steps}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {routineLevel && (
              <NavigationButtons
                onBack={() => setStep(4)}
                onNext={() => setStep(6)}
              />
            )}
          </StepCard>
        )}
        
        {/* Step 6: Products */}
        {step === 6 && (
          <StepCard
            key="step6"
            title="Add products you already have"
            description="Optional: Search and add skincare you own. We'll incorporate them into your routine."
          >
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products (e.g., CeraVe, retinol, sunscreen)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              
              {/* Catalog results */}
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-card rounded-2xl border shadow-elev max-h-80 overflow-y-auto">
                  {searchResults.map((product, idx) => (
                    <button
                      key={idx}
                      onClick={() => addProduct(product)}
                      className="w-full p-4 text-left hover:bg-accent transition-colors border-b last:border-b-0"
                    >
                      <p className="font-semibold text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {product.category} · {product.brand}
                        {product.price && ` · $${product.price}`}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* No results — offer manual add */}
              {searchQuery.trim().length >= 2 && searchResults.length === 0 && !showManualAdd && (
                <div className="absolute z-10 w-full mt-2 bg-card rounded-2xl border shadow-elev p-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    No matches for <span className="font-semibold text-foreground">"{searchQuery}"</span> in our catalog.
                  </p>
                  <button
                    onClick={() => { setShowManualAdd(true); setManualName(searchQuery.trim()); }}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-primary/40 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors"
                  >
                    <span className="text-lg">＋</span> Add "{searchQuery}" manually
                  </button>
                </div>
              )}
            </div>

            {/* Manual add form */}
            <AnimatePresence>
              {showManualAdd && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="mb-6 rounded-2xl border-2 border-primary/20 bg-primary/5 p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold text-sm">Add product manually</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Fill in what you know — brand and category help us place it correctly.</p>
                    </div>
                    <button
                      onClick={() => { setShowManualAdd(false); setManualName(""); setManualBrand(""); setManualCategory(""); }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Product name */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Product name *</label>
                      <Input
                        placeholder="e.g. The Ordinary AHA 30% + BHA 2%"
                        value={manualName}
                        onChange={e => setManualName(e.target.value)}
                        className="text-sm"
                      />
                    </div>

                    {/* Brand */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Brand *</label>
                      <Input
                        placeholder="e.g. The Ordinary"
                        value={manualBrand}
                        onChange={e => setManualBrand(e.target.value)}
                        className="text-sm"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category *</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(["Cleanser", "Toner", "Essence", "Vitamin C", "Niacinamide", "Hyaluronic Acid", "Retinol", "Exfoliant", "Treatment", "Serum", "Eye Cream", "Moisturizer", "Face Oil", "Sunscreen", "Mask"] as ProductCategory[]).map(cat => (
                          <button
                            key={cat}
                            onClick={() => setManualCategory(cat)}
                            className={`p-2 rounded-xl border text-xs font-medium text-left transition-all ${
                              manualCategory === cat
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-card text-muted-foreground hover:border-primary/40"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={addManualProduct}
                      disabled={!manualName.trim() || !manualBrand.trim() || !manualCategory}
                      className="w-full mt-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                    >
                      Add to my products
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Warnings */}
            {productWarnings.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6">
                <div className="font-semibold text-destructive mb-2">Product Warnings</div>
                {productWarnings.map((w, i) => (
                  <p key={i} className="text-sm text-destructive/80">{w}</p>
                ))}
                <button
                  onClick={() => setProductWarnings([])}
                  className="text-sm text-destructive underline mt-2"
                >
                  Dismiss
                </button>
              </div>
            )}
            
            {/* Added products */}
            {products.length > 0 && (
              <div className="space-y-3 mb-6">
                <h3 className="font-semibold text-lg">Your Products ({products.length})</h3>
                {products.map((product) => {
                  const isCustom = !CATALOG.find(c => c.name === product.name);
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 rounded-2xl border bg-card"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">{product.name}</p>
                          {isCustom && (
                            <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full shrink-0">custom</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {product.type} · {product.brand}
                        </p>
                      </div>
                      <button
                        onClick={() => removeProduct(product.id)}
                        className="text-muted-foreground hover:text-destructive ml-3 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            
            <NavigationButtons
              onBack={() => setStep(5)}
              onNext={generateRoutine}
              nextLabel="Generate Routine"
            />
          </StepCard>
        )}
        
        {/* Step 6: Loading / Results */}
        {((step === 7 && hasConcernAcne) || (step === 6 && !hasConcernAcne)) && isGenerating && (
          <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-2 rounded-full mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="h-4 w-4" />
                </motion.div>
                Analyzing your skin profile
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">Building your routine…</h2>
              <p className="text-muted-foreground mt-2 text-sm">Matching products to your skin type, concerns, and budget</p>
            </div>
            <SkeletonRoutine />
          </motion.div>
        )}

        {((step === 7 && hasConcernAcne) || (step === 6 && !hasConcernAcne && routine)) && routine && !isGenerating && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Shopping Cart Summary */}
            {shoppingCart.length > 0 && (
              <Card className="mb-6 border-primary/15 bg-gradient-to-r from-primary/5 to-accent/30 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <ShoppingCart className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Shopping Cart</p>
                        <p className="text-xs text-muted-foreground">
                          {shoppingCart.length} item{shoppingCart.length !== 1 ? "s" : ""} · ${cartTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowCart(!showCart)}>
                        {showCart ? "Hide" : "View"}
                      </Button>
                      <Button size="sm" asChild>
                        <a href="https://www.sephora.com" target="_blank" rel="noopener noreferrer">
                          Checkout <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                  
                  {showCart && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      {shoppingCart.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-background rounded-lg">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">${item.price}</p>
                          </div>
                          <button onClick={() => removeFromCart(item.name)} className="text-destructive">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Premium Banner */}
            {!isPremium && (
              <Card className="mb-6 border-purple-200/60 overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-md">
                      <Crown className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base">Upgrade to Premium</h3>
                      <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">
                        Unlimited updates, skin tracking, expiration alerts, and exclusive discounts.
                      </p>
                    </div>
                    <Button size="sm" className="shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 border-0 shadow-sm" onClick={() => setShowPremiumModal(true)}>
                      Try Free
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 mb-4">
                <Sparkles className="h-3.5 w-3.5" /> Personalized for you
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Your SkinIQ Routine</h2>
              <p className="text-muted-foreground mt-2">
                Tailored for <span className="text-primary font-semibold">{skinType.join(" + ")}</span> skin
                {acneType && ` · ${ACNE_TYPES.find(t => t.id === acneType)?.name}`}
              </p>
              {routineLevel && (
                <div className={`inline-flex items-center gap-1.5 mt-2 text-xs font-semibold px-3 py-1 rounded-full ${
                  routineLevel === "beginner" ? "bg-emerald-100 text-emerald-700"
                  : routineLevel === "advanced" ? "bg-purple-100 text-purple-700"
                  : "bg-primary/10 text-primary"
                }`}>
                  {ROUTINE_LEVELS.find(l => l.id === routineLevel)?.icon} {ROUTINE_LEVELS.find(l => l.id === routineLevel)?.name} routine
                </div>
              )}
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <Button variant="outline" onClick={copyRoutine}>
                  <Clipboard className="mr-2 h-4 w-4" /> Copy Routine
                </Button>
                <RoutineExport
                  routine={routine}
                  skinType={skinType}
                  concerns={concerns}
                  acneType={acneType}
                  budget={budget}
                />
                <Button variant="outline" onClick={() => setShowComparison(true)}>
                  <ArrowLeftRight className="mr-2 h-4 w-4" /> Compare Products
                </Button>
                <Button variant="outline" onClick={() => setShowFlareUpModal(true)}>
                  🚨 Flare-Up Mode
                </Button>
              </div>
            </div>

            {/* Beginner tip banner */}
            {routineLevel === "beginner" && (
              <div className="mb-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
                <span className="text-2xl">🌱</span>
                <div>
                  <p className="font-semibold text-sm text-emerald-900">Start here — keep it consistent</p>
                  <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                    Use this routine every day for 4–6 weeks before adding anything new. Consistency beats complexity every time. Once your skin is stable, you can upgrade to a Balanced Routine.
                  </p>
                </div>
              </div>
            )}

            {routineLevel === "advanced" && (
              <div className="mb-4 rounded-2xl bg-purple-50 border border-purple-200 p-4 flex items-start gap-3">
                <span className="text-2xl">🔬</span>
                <div>
                  <p className="font-semibold text-sm text-purple-900">Advanced routine — introduce actives slowly</p>
                  <p className="text-xs text-purple-700 mt-1 leading-relaxed">
                    Add retinol and exfoliants one at a time, 2–3 weeks apart. If your skin flares up, strip back to basics using Flare-Up Mode.
                  </p>
                </div>
              </div>
            )}

            {/* Ingredient Conflicts */}
            <IngredientConflicts routine={routine} />
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Morning Routine */}
              <Card className="shadow-soft border-amber-100/60 overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-amber-50 to-yellow-50/50 border-b border-amber-100/50 pb-4">
                  <CardTitle className="flex items-center gap-2.5 text-lg">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                      <Sun className="h-4 w-4 text-white" />
                    </div>
                    Morning Routine
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">Light, consistent, SPF always last.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-2.5">
                  {routine.morning.map((product, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className="p-4 rounded-2xl border bg-card hover:border-amber-200 hover:bg-amber-50/30 transition-all duration-200 group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-snug">{product.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {product.type} · {product.brand}
                          </p>
                          <p className="text-xs text-muted-foreground/80 mt-1.5 leading-relaxed">
                            {getProductExplanation(product).purpose}
                          </p>
                          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                            {product.price && (
                              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
                                ${product.price}
                              </span>
                            )}
                            {product.affiliateUrl && (
                              <button
                                onClick={() => addToCart(product)}
                                className="text-xs bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full flex items-center gap-1 hover:bg-primary/90 transition-colors"
                              >
                                <ShoppingCart className="h-3 w-3" /> Add
                              </button>
                            )}
                            <button
                              onClick={() => { setSwapTarget({ product, routineKey: "morning", index: idx }); setSwapSearch(""); }}
                              className="text-xs bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-colors"
                            >
                              <ArrowLeftRight className="h-3 w-3" /> Swap
                            </button>
                            <button
                              onClick={() => removeFromRoutine("morning", idx)}
                              className="text-xs text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-colors"
                            >
                              <X className="h-3 w-3" /> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
              
              {/* Night Routine */}
              <Card className="shadow-soft border-indigo-100/60 overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-indigo-50 to-purple-50/50 border-b border-indigo-100/50 pb-4">
                  <CardTitle className="flex items-center gap-2.5 text-lg">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center shadow-sm">
                      <Moon className="h-4 w-4 text-white" />
                    </div>
                    Night Routine
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">Repair + treatments. Start slow with actives.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-2.5">
                  {routine.nightEveryNight.map((product, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className="p-4 rounded-2xl border bg-card hover:border-indigo-200 hover:bg-indigo-50/20 transition-all duration-200"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-indigo-400 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-snug">{product.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {product.type} · {product.brand}
                          </p>
                          <p className="text-xs text-muted-foreground/80 mt-1.5 leading-relaxed">
                            {getProductExplanation(product).purpose}
                          </p>
                          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                            {product.price && (
                              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-semibold">
                                ${product.price}
                              </span>
                            )}
                            {product.affiliateUrl && (
                              <button
                                onClick={() => addToCart(product)}
                                className="text-xs bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full flex items-center gap-1 hover:bg-primary/90 transition-colors"
                              >
                                <ShoppingCart className="h-3 w-3" /> Add
                              </button>
                            )}
                            <button
                              onClick={() => { setSwapTarget({ product, routineKey: "nightEveryNight", index: idx }); setSwapSearch(""); }}
                              className="text-xs bg-muted text-muted-foreground hover:bg-indigo-50 hover:text-indigo-700 px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-colors"
                            >
                              <ArrowLeftRight className="h-3 w-3" /> Swap
                            </button>
                            <button
                              onClick={() => removeFromRoutine("nightEveryNight", idx)}
                              className="text-xs text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-colors"
                            >
                              <X className="h-3 w-3" /> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Alternating Nights */}
                  {routine.night2x.length > 0 && (
                    <div className="mt-3 p-4 rounded-2xl bg-primary/5 border border-primary/15">
                      <div className="flex items-center gap-2 mb-2.5">
                        <Calendar className="h-4 w-4 text-primary" />
                        <p className="text-sm font-semibold text-primary">Monday & Thursday</p>
                      </div>
                      {routine.night2x.map((product, idx) => (
                        <div key={idx} className="flex items-center gap-2 py-0.5">
                          <Sparkles className="h-3.5 w-3.5 text-primary/70 flex-shrink-0" />
                          <span className="font-medium text-sm">{product.name}</span>
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground mt-2 border-t border-primary/10 pt-2">Use after step {routine.nightEveryNight.filter(p => !["Eye Cream", "Moisturizer", "Face Oil"].includes(p.type)).length}</p>
                    </div>
                  )}
                  
                  {routine.night3x.length > 0 && (
                    <div className="p-4 rounded-2xl bg-muted/60 border border-border/60">
                      <div className="flex items-center gap-2 mb-2.5">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-semibold">Tue, Fri & Sunday</p>
                      </div>
                      {routine.night3x.map((product, idx) => (
                        <div key={idx} className="flex items-center gap-2 py-0.5">
                          <Sparkles className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium text-sm">{product.name}</span>
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground mt-2 border-t border-border/60 pt-2">Use after step {routine.nightEveryNight.filter(p => !["Eye Cream", "Moisturizer", "Face Oil"].includes(p.type)).length}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Pro Tips */}
            <Card className="mt-8 shadow-soft border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Pro Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
                    <h4 className="font-semibold text-sm mb-3 text-amber-900">Application Order</h4>
                    <ul className="space-y-2">
                      {["Apply products thinnest to thickest", "Wait 30–60 sec between layers", "Use gentle patting motions", "Apply eye cream with your ring finger"].map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
                          <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-700 font-bold flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px]">{i + 1}</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                    <h4 className="font-semibold text-sm mb-3 text-indigo-900">Safety Rules</h4>
                    <ul className="space-y-2">
                      {["SPF every morning, even indoors", "Never use Vitamin C + Retinol together", "Introduce new products one at a time", "Patch test on inner arm for 24 hours"].map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-indigo-800">
                          <span className="w-4 h-4 rounded-full bg-indigo-200 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px]">!</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Calendar - only for standard/advanced (beginners have no alternating schedule) */}
            {routineLevel !== "beginner" && (
              <Card className="mt-8 shadow-soft">
                <CardContent className="p-6">
                  <WeeklyCalendar routine={routine} />
                </CardContent>
              </Card>
            )}
            
            {/* Progress Tracker */}
            <div className="mt-8">
              <ProgressTracker
                routineProductNames={[
                  ...routine.morning.map(p => p.name),
                  ...routine.nightEveryNight.map(p => p.name),
                ]}
                onRequestRegenerate={regenerateFromProgress}
              />
            </div>

            {/* Start Over */}
            <div className="text-center mt-8">
              <Button variant="outline" size="lg" onClick={reset}>
                Start Over
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Premium Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPremiumModal(false)}>
          <div className="bg-card rounded-2xl p-8 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Crown className="h-8 w-8 text-purple-600" />
                <h2 className="text-2xl font-bold">Premium</h2>
              </div>
              <button onClick={() => setShowPremiumModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold">$9.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground">or $79.99/year (Save 33%)</p>
            </div>
            
            <div className="space-y-3 mb-6">
              {[
                "Unlimited Routine Updates",
                "Skin Tracking & Analytics",
                "Smart Reminders",
                "Product Expiration Alerts",
                "Exclusive Brand Discounts",
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            
            <Button
              className="w-full"
              onClick={() => {
                setIsPremium(true);
                setShowPremiumModal(false);
                toast({ title: "Premium activated!", description: "Enjoy your new features." });
              }}
            >
              <Crown className="mr-2 h-4 w-4" /> Start 7-Day Free Trial
            </Button>
          </div>
        </div>
      )}
      
      {/* Flare-Up Modal */}
      {showFlareUpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowFlareUpModal(false)}>
          <div className="bg-card rounded-2xl p-8 max-w-2xl w-full my-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-3xl">🚨</span>
                <h2 className="text-2xl font-bold">Flare-Up Rescue Mode</h2>
              </div>
              <button onClick={() => setShowFlareUpModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6">
              <h3 className="font-bold mb-2">Immediate Actions</h3>
              <ol className="space-y-1 text-sm">
                <li>1. Stop all actives (retinol, acids, vitamin C) immediately</li>
                <li>2. Switch to gentle, barrier-safe products only</li>
                <li>3. Apply soothing/healing treatments</li>
                <li>4. Avoid hot water, physical exfoliation, and makeup if possible</li>
              </ol>
            </div>
            
            <div className="mb-6">
              <h3 className="font-bold mb-3">Emergency Barrier-Safe Routine</h3>
              <div className="space-y-2">
                {generateMinimumRoutine().map((product, idx) => (
                  <div key={idx} className="bg-accent rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.type} - Safe for compromised skin</p>
                    </div>
                    {product.price && <span className="font-medium">${product.price}</span>}
                  </div>
                ))}
              </div>
            </div>
            
            <Button className="w-full" onClick={() => setShowFlareUpModal(false)}>
              Got It
            </Button>
          </div>
        </div>
      )}
      
      {/* Product Comparison Modal */}
      {showComparison && (
        <ProductComparison
          onClose={() => setShowComparison(false)}
          userSkinTypes={skinType}
          userConcerns={concerns}
        />
      )}
      
      {/* Swap Product Modal */}
      {swapTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => { setSwapTarget(null); setSwapSearch(""); }}>
          <div className="bg-card rounded-2xl p-6 max-w-lg w-full my-8 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5 text-primary" />
                  Swap Product
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Replacing: <span className="font-medium text-foreground">{swapTarget.product.name}</span>
                </p>
              </div>
              <button onClick={() => { setSwapTarget(null); setSwapSearch(""); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for alternatives..."
                value={swapSearch}
                onChange={(e) => setSwapSearch(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            
            <p className="text-xs text-muted-foreground mb-3">
              {swapSearch ? "Search results" : `Showing ${swapTarget.product.type} alternatives`}
            </p>
            
            <div className="overflow-y-auto flex-1 space-y-2">
              {swapAlternatives.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No alternatives found. Try a different search.</p>
              ) : (
                swapAlternatives.map((alt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSwap(alt)}
                    className="w-full p-4 rounded-xl border bg-card hover:bg-accent hover:border-primary/50 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{alt.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {alt.category} • {alt.brand}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {alt.price && (
                          <span className="text-sm font-medium">${alt.price}</span>
                        )}
                        <RefreshCw className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
