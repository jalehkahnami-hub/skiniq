import { X, FlaskConical, AlertTriangle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "@/lib/skincare/types";

interface IngredientInfo {
  active: string;
  what: string;
  evidence: "clinical" | "good" | "anecdotal";
}

const INGREDIENT_DATA: Record<string, IngredientInfo[]> = {
  "Cleanser": [
    { active: "Ceramides", what: "Restore and maintain the skin's protective barrier", evidence: "clinical" },
    { active: "Niacinamide", what: "Reduce inflammation and support barrier function", evidence: "clinical" },
  ],
  "Vitamin C": [
    { active: "L-Ascorbic Acid", what: "Brightens skin, boosts collagen, fights free radicals", evidence: "clinical" },
    { active: "Ferulic Acid", what: "Stabilizes vitamin C and enhances its antioxidant effect", evidence: "clinical" },
  ],
  "Retinol": [
    { active: "Retinol / Retinaldehyde", what: "Increases cell turnover, reduces fine lines and texture", evidence: "clinical" },
    { active: "Squalane", what: "Buffers irritation and adds lightweight hydration", evidence: "good" },
  ],
  "Niacinamide": [
    { active: "Niacinamide (Vitamin B3)", what: "Controls oil, fades hyperpigmentation, strengthens barrier", evidence: "clinical" },
    { active: "Zinc", what: "Reduces acne-causing bacteria and sebum production", evidence: "good" },
  ],
  "Hyaluronic Acid": [
    { active: "Hyaluronic Acid", what: "Draws moisture into skin, plumps and hydrates", evidence: "clinical" },
    { active: "Panthenol (B5)", what: "Soothes and helps retain moisture in the skin", evidence: "good" },
  ],
  "Exfoliant": [
    { active: "AHA / BHA / PHA", what: "Dissolve dead skin cells, unclog pores, improve texture", evidence: "clinical" },
    { active: "Glycolic / Lactic / Salicylic Acid", what: "Exfoliate at different depths depending on the acid", evidence: "clinical" },
  ],
  "Moisturizer": [
    { active: "Ceramides", what: "Seal the barrier and prevent moisture loss", evidence: "clinical" },
    { active: "Glycerin", what: "Humectant that attracts water to the skin surface", evidence: "clinical" },
  ],
  "Sunscreen": [
    { active: "Zinc Oxide / Titanium Dioxide", what: "Physical UV blockers that reflect and scatter UV rays", evidence: "clinical" },
    { active: "Chemical filters (Avobenzone etc.)", what: "Absorb UV rays and convert them to heat", evidence: "clinical" },
  ],
  "Toner": [
    { active: "Centella Asiatica", what: "Calms redness and supports wound healing", evidence: "good" },
    { active: "Witch Hazel", what: "Tightens pores and controls excess oil", evidence: "anecdotal" },
  ],
  "Treatment": [
    { active: "Azelaic Acid", what: "Targets redness, acne bacteria, and hyperpigmentation", evidence: "clinical" },
    { active: "Tranexamic Acid", what: "Fades dark spots and post-inflammatory marks", evidence: "good" },
  ],
  "Serum": [
    { active: "Peptides", what: "Signal skin to produce more collagen and elastin", evidence: "good" },
    { active: "Centella / Propolis", what: "Soothe inflammation and support skin healing", evidence: "good" },
  ],
  "Eye Cream": [
    { active: "Caffeine", what: "Constricts blood vessels to reduce puffiness and dark circles", evidence: "good" },
    { active: "Peptides", what: "Firm and smooth the delicate eye area over time", evidence: "good" },
  ],
  "Face Oil": [
    { active: "Squalane", what: "Lightweight, non-comedogenic oil that mimics skin's sebum", evidence: "good" },
    { active: "Rosehip / Jojoba", what: "Rich in fatty acids that nourish and repair the barrier", evidence: "good" },
  ],
  "Essence": [
    { active: "Fermented extracts", what: "Boost absorption of subsequent products and add hydration", evidence: "good" },
    { active: "Beta-Glucan", what: "Deeply hydrating and soothing for reactive skin", evidence: "clinical" },
  ],
};

const evidenceColors = {
  clinical: { bg: "bg-emerald-100 text-emerald-700", label: "Clinically proven" },
  good: { bg: "bg-blue-100 text-blue-700", label: "Good evidence" },
  anecdotal: { bg: "bg-amber-100 text-amber-700", label: "Anecdotal" },
};

interface IngredientModalProps {
  product: Product;
  onClose: () => void;
}

export function IngredientModal({ product, onClose }: IngredientModalProps) {
  const ingredients = INGREDIENT_DATA[product.type] || [
    { active: product.type, what: "Supports skin health and targets your specific concerns", evidence: "good" as const },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        className="bg-background rounded-2xl w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">{product.type}</span>
            </div>
            <h3 className="font-bold text-base leading-snug">{product.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{product.brand}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground mt-0.5">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Key actives */}
        <div className="p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Key actives</p>
          <div className="space-y-3">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{ing.active}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${evidenceColors[ing.evidence].bg}`}>
                      {evidenceColors[ing.evidence].label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{ing.what}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Conflicts note */}
          {(product.type === "Retinol" || product.type === "Exfoliant" || product.type === "Vitamin C") && (
            <div className="mt-4 pt-4 border-t flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {product.type === "Retinol" && "Don't layer with vitamin C or exfoliating acids on the same night."}
                {product.type === "Exfoliant" && "Don't use on the same night as retinol. Start 2x/week max."}
                {product.type === "Vitamin C" && "Use in the morning only. Don't mix with retinol same application."}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
