import { useState, useMemo } from "react";
import { X, Search, ArrowLeftRight, Check, Minus, Star, DollarSign, Leaf, ExternalLink, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CATALOG } from "@/lib/skincare/catalog";
import type { CatalogProduct } from "@/lib/skincare/catalog";
import type { Concern, SkinType } from "@/lib/skincare/types";

interface ProductComparisonProps {
  onClose: () => void;
  userSkinTypes?: SkinType[];
  userConcerns?: Concern[];
}

function scoreMatch(product: CatalogProduct, skinTypes: SkinType[], concerns: Concern[]): number {
  let score = 0;
  skinTypes.forEach(st => { if (product.tags.skinTypes.includes(st)) score += 1; });
  concerns.forEach(c => { if (product.tags.concerns.includes(c)) score += 1; });
  return score;
}

function getBudgetLabel(budgets: string[]) {
  if (budgets.includes("budget") && budgets.includes("luxury")) return "All budgets";
  if (budgets.includes("luxury")) return "Luxury";
  if (budgets.includes("mid")) return "Mid-range";
  return "Budget-friendly";
}

function BudgetDots({ budgets }: { budgets: string[] }) {
  const levels = ["budget", "mid", "luxury"];
  const maxActive = budgets.includes("luxury") ? 3 : budgets.includes("mid") ? 2 : 1;
  return (
    <div className="flex gap-1">
      {levels.map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${i < maxActive ? "bg-primary" : "bg-muted"}`}
        />
      ))}
    </div>
  );
}

function ProductCard({
  product,
  slot,
  onSelect,
  onClear,
  userSkinTypes,
  userConcerns,
}: {
  product: CatalogProduct | null;
  slot: 1 | 2;
  onSelect: (p: CatalogProduct) => void;
  onClear: () => void;
  userSkinTypes: SkinType[];
  userConcerns: Concern[];
}) {
  const [search, setSearch] = useState("");

  const results = useMemo(() => {
    if (!search.trim() || search.length < 2) return [];
    const q = search.toLowerCase();
    return CATALOG.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [search]);

  if (!product) {
    return (
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6 flex flex-col gap-4 min-h-[400px]">
          <p className="text-sm font-semibold text-muted-foreground text-center mt-4">
            {slot === 1 ? "Search for Product A" : "Search for Product B"}
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, brand, or category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
              autoFocus={slot === 1}
            />
          </div>
          {results.length > 0 && (
            <div className="rounded-xl border bg-card shadow-md overflow-hidden">
              {results.map((p, i) => (
                <button
                  key={i}
                  onClick={() => { onSelect(p); setSearch(""); }}
                  className="w-full p-3 text-left hover:bg-accent transition-colors border-b last:border-b-0"
                >
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.category} · {p.brand} {p.price ? `· $${p.price}` : ""}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const matchScore = scoreMatch(product, userSkinTypes, userConcerns);
  const maxScore = userSkinTypes.length + userConcerns.length;
  const matchPct = maxScore > 0 ? Math.round((matchScore / maxScore) * 100) : null;

  return (
    <motion.div
      className="flex-1 min-w-0"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="rounded-2xl border-2 border-primary/20 bg-card shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/8 to-accent/40 p-5 relative">
          <button
            onClick={onClear}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-background/80 hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <span className="inline-block text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full mb-2">
            {product.category}
          </span>
          <h3 className="font-bold text-base leading-snug pr-8">{product.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{product.brand}</p>

          {matchPct !== null && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${matchPct}%` }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                />
              </div>
              <span className="text-xs font-semibold text-primary">{matchPct}% match</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-5 space-y-4">
          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <DollarSign className="h-4 w-4" />
              <span>Price</span>
            </div>
            <span className="font-semibold">{product.price ? `$${product.price}` : "—"}</span>
          </div>

          {/* Budget tier */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Budget tier</span>
            <div className="flex items-center gap-2">
              <BudgetDots budgets={product.tags.budgets} />
              <span className="text-xs text-muted-foreground">{getBudgetLabel(product.tags.budgets)}</span>
            </div>
          </div>

          {/* Clean beauty */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <Leaf className="h-4 w-4" />
              <span>Clean beauty</span>
            </div>
            {product.clean ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <Check className="h-3 w-3" /> Yes
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                <Minus className="h-3 w-3" /> No
              </span>
            )}
          </div>

          {/* Skin types */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Works for</p>
            <div className="flex flex-wrap gap-1.5">
              {product.tags.skinTypes.map(st => (
                <span
                  key={st}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    userSkinTypes.includes(st)
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {userSkinTypes.includes(st) && "✓ "}{st}
                </span>
              ))}
            </div>
          </div>

          {/* Concerns */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Targets</p>
            <div className="flex flex-wrap gap-1.5">
              {product.tags.concerns.map(c => (
                <span
                  key={c}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    userConcerns.includes(c)
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {userConcerns.includes(c) && "✓ "}{c}
                </span>
              ))}
            </div>
          </div>

          {/* Notes */}
          {product.notes && (
            <p className="text-xs text-muted-foreground italic border-t pt-3">{product.notes}</p>
          )}

          {/* CTA */}
          {product.affiliateUrl && (
            <Button size="sm" variant="outline" className="w-full" asChild>
              <a href={product.affiliateUrl} target="_blank" rel="noopener noreferrer">
                <ShoppingCart className="h-3.5 w-3.5 mr-1.5" /> Shop Now
                <ExternalLink className="h-3 w-3 ml-1 opacity-50" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function ProductComparison({ onClose, userSkinTypes = [], userConcerns = [] }: ProductComparisonProps) {
  const [productA, setProductA] = useState<CatalogProduct | null>(null);
  const [productB, setProductB] = useState<CatalogProduct | null>(null);

  // Summary verdict
  const verdict = useMemo(() => {
    if (!productA || !productB) return null;
    const scoreA = scoreMatch(productA, userSkinTypes, userConcerns);
    const scoreB = scoreMatch(productB, userSkinTypes, userConcerns);
    if (scoreA > scoreB) return { winner: productA.name, reason: "better matches your skin type and concerns" };
    if (scoreB > scoreA) return { winner: productB.name, reason: "better matches your skin type and concerns" };
    if (productA.price && productB.price && productA.price < productB.price) {
      return { winner: productA.name, reason: "equal match but more budget-friendly" };
    }
    if (productA.price && productB.price && productB.price < productA.price) {
      return { winner: productB.name, reason: "equal match but more budget-friendly" };
    }
    return { winner: null, reason: "Both products are equally matched for your profile" };
  }, [productA, productB, userSkinTypes, userConcerns]);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        className="bg-background rounded-2xl shadow-2xl w-full max-w-3xl my-8"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 16 }}
        transition={{ duration: 0.25 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Compare Products</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Comparison grid */}
        <div className="p-6">
          <div className="flex gap-4 flex-col sm:flex-row">
            <ProductCard
              product={productA}
              slot={1}
              onSelect={setProductA}
              onClear={() => setProductA(null)}
              userSkinTypes={userSkinTypes}
              userConcerns={userConcerns}
            />

            {/* VS divider */}
            <div className="flex sm:flex-col items-center justify-center gap-2 text-muted-foreground shrink-0">
              <div className="h-px sm:h-16 w-16 sm:w-px bg-border" />
              <span className="text-xs font-bold bg-muted px-2 py-1 rounded-full">VS</span>
              <div className="h-px sm:h-16 w-16 sm:w-px bg-border" />
            </div>

            <ProductCard
              product={productB}
              slot={2}
              onSelect={setProductB}
              onClear={() => setProductB(null)}
              userSkinTypes={userSkinTypes}
              userConcerns={userConcerns}
            />
          </div>

          {/* Verdict */}
          <AnimatePresence>
            {verdict && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mt-6 rounded-xl border bg-accent/50 p-4 flex items-start gap-3"
              >
                <Star className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">
                    {verdict.winner ? (
                      <>
                        We recommend{" "}
                        <span className="text-primary">{verdict.winner}</span>
                      </>
                    ) : (
                      "It's a tie!"
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">{verdict.reason}</p>
                  {!userSkinTypes.length && !userConcerns.length && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      Complete the routine builder first to see personalized match scores.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
