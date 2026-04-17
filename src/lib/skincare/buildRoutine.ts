import type { CatalogProduct } from "./catalog";
import { CATALOG } from "./catalog";
import type { AcneType, BarrierScore, BudgetRange, Concern, GeneratedRoutine, Product, RoutineLevel, SkincareProfile, SkinType } from "./types";

function findProduct(name: string): Product | null {
  const found = CATALOG.find(p => p.name === name);
  if (!found) return null;
  return {
    name: found.name,
    type: found.category,
    brand: found.brand,
    clean: found.clean,
    price: found.price,
    affiliateUrl: found.affiliateUrl,
  };
}

function hasSkinType(profile: SkincareProfile, type: SkinType): boolean {
  return profile.skinType.includes(type);
}

function getPrimarySkinType(profile: SkincareProfile): SkinType {
  if (hasSkinType(profile, "Sensitive")) return "Sensitive";
  if (hasSkinType(profile, "Dry")) return "Dry";
  if (hasSkinType(profile, "Oily")) return "Oily";
  if (hasSkinType(profile, "Combination")) return "Combination";
  return "Normal";
}

function scoreProduct(p: CatalogProduct, profile: SkincareProfile): number {
  let score = 0;
  profile.skinType.forEach(st => { if (p.tags.skinTypes.includes(st)) score += 2; });
  profile.concerns.forEach(c => { if (p.tags.concerns.includes(c)) score += 1.5; });
  if (p.tags.budgets.includes(profile.budget)) score += 1;
  if (profile.acneType && p.tags.acneTypes?.includes(profile.acneType)) score += 2;
  return score;
}

function pickBestProduct(profile: SkincareProfile, category: CatalogProduct["category"]): Product | null {
  const items = CATALOG
    .filter(p => p.category === category)
    .map(p => ({ p, s: scoreProduct(p, profile) }))
    .sort((a, b) => b.s - a.s)
    .filter(x => x.s > 0);
  if (items.length === 0) return null;
  const best = items[0].p;
  return {
    name: best.name,
    type: best.category,
    brand: best.brand,
    clean: best.clean,
    price: best.price,
    affiliateUrl: best.affiliateUrl,
    reason: buildReason(best, profile),
  };
}

// ─── ROUTINE ORDERING ─────────────────────────────────────────────────────
const AM_ORDER = ["Cleanser", "Double Cleanser", "Toner", "Essence", "Vitamin C", "Serum", "Niacinamide", "Hyaluronic Acid", "Treatment", "Eye Cream", "Moisturizer", "Face Oil", "Sunscreen"];
const PM_ORDER = ["Cleanser", "Double Cleanser", "Toner", "Essence", "Serum", "Niacinamide", "Hyaluronic Acid", "Treatment", "Retinol", "Exfoliant", "Eye Cream", "Moisturizer", "Face Oil"];

function sortByRoutineOrder(products: Product[], order: string[]): Product[] {
  return [...products].sort((a, b) => {
    const ai = order.indexOf(a.type);
    const bi = order.indexOf(b.type);
    const aIdx = ai === -1 ? order.length : ai;
    const bIdx = bi === -1 ? order.length : bi;
    return aIdx - bIdx;
  });
}

// ─── REASONING CHIP ───────────────────────────────────────────────────────
function buildReason(product: { category: string; tags?: { skinTypes: string[]; concerns: string[]; budgets: string[] } }, profile: SkincareProfile): string {
  const parts: string[] = [];
  
  // Skin type match
  const skinMatches = profile.skinType.filter(st => product.tags?.skinTypes.includes(st));
  if (skinMatches.length > 0) parts.push(skinMatches[0].toLowerCase() + " skin");
  
  // Concern match  
  const concernMatches = profile.concerns.filter(c => product.tags?.concerns.includes(c));
  if (concernMatches.length > 0) parts.push(concernMatches[0].toLowerCase());
  
  // Budget
  const budgetLabels: Record<string, string> = { budget: "under $30", mid: "mid-range", luxury: "luxury", mixed: "your budget" };
  if (product.tags?.budgets.includes(profile.budget)) parts.push(budgetLabels[profile.budget] || "");

  if (parts.length === 0) return "matches your profile";
  return parts.filter(Boolean).slice(0, 2).join(" · ");
}

// ─── BARRIER SCORE ─────────────────────────────────────────────────────────
export function calculateBarrierScore(routine: Omit<GeneratedRoutine, "barrierScore">, profile: SkincareProfile): BarrierScore {
  let score = 60; // baseline
  const breakdown: BarrierScore["breakdown"] = [];

  const allProducts = [...routine.morning, ...routine.nightEveryNight, ...routine.night2x, ...routine.night3x];
  
  const hasCleanser = allProducts.some(p => p.type === "Cleanser");
  const hasMoisturizer = allProducts.some(p => p.type === "Moisturizer");
  const hasSunscreen = allProducts.some(p => p.type === "Sunscreen");
  const hasRetinol = allProducts.some(p => p.type === "Retinol");
  const hasExfoliant = allProducts.some(p => p.type === "Exfoliant");
  const hasHA = allProducts.some(p => p.type === "Hyaluronic Acid");
  const hasNiacinamide = allProducts.some(p => p.type === "Niacinamide");
  const activesCount = [hasRetinol, hasExfoliant].filter(Boolean).length;

  if (hasCleanser) { score += 5; breakdown.push({ factor: "Cleanser included", impact: "positive" }); }
  if (hasMoisturizer) { score += 10; breakdown.push({ factor: "Moisturizer seals barrier", impact: "positive" }); }
  if (hasSunscreen) { score += 10; breakdown.push({ factor: "SPF protects daily", impact: "positive" }); }
  if (hasHA) { score += 8; breakdown.push({ factor: "Hyaluronic acid hydrates", impact: "positive" }); }
  if (hasNiacinamide) { score += 5; breakdown.push({ factor: "Niacinamide strengthens barrier", impact: "positive" }); }
  
  if (activesCount === 0) { 
    score += 5; 
    breakdown.push({ factor: "No actives — low irritation risk", impact: "positive" }); 
  } else if (activesCount === 1) { 
    score += 2;
    breakdown.push({ factor: "1 active — well managed", impact: "neutral" });
  } else { 
    score -= 8; 
    breakdown.push({ factor: "Multiple actives — risk of over-exfoliation", impact: "negative" }); 
  }

  // Routine level modifier
  if (profile.routineLevel === "beginner") { score += 5; breakdown.push({ factor: "Simple routine — easy to maintain", impact: "positive" }); }
  if (profile.routineLevel === "advanced") { score -= 3; breakdown.push({ factor: "Advanced routine — needs discipline", impact: "neutral" }); }

  score = Math.min(100, Math.max(0, score));

  let label: string;
  let color: BarrierScore["color"];
  if (score >= 75) { label = "Well balanced"; color = "green"; }
  else if (score >= 50) { label = "Mostly balanced"; color = "amber"; }
  else { label = "Needs attention"; color = "red"; }

  return { score, label, color, breakdown };
}

// ─── BEGINNER ──────────────────────────────────────────────────────────────
// 4-step core: Cleanser → Treatment serum → Moisturizer → SPF
// No actives, no alternating nights, no toner/essence/eye cream
function generateBeginnerRoutine(profile: SkincareProfile): GeneratedRoutine {
  const hasAcneConcerns = profile.concerns.includes("Acne") || profile.concerns.includes("Large Pores");
  const hasPigmentation = profile.concerns.includes("Hyperpigmentation") || profile.concerns.includes("Dark Spots");
  const hasSensitivity = profile.concerns.includes("Redness") || profile.concerns.includes("Sensitivity") || hasSkinType(profile, "Sensitive");
  const hasDehydration = profile.concerns.includes("Dehydration") || hasSkinType(profile, "Dry");

  // 1. Cleanser
  const cleanser = pickBestProduct(profile, "Cleanser");

  // 2. One targeted treatment serum — pick the most relevant single one
  let treatment: Product | null = null;
  if (hasSensitivity) {
    treatment = findProduct("Skin1004 Madagascar Centella Ampoule") || findProduct("Purito Centella Green Level Buffet Serum");
  } else if (hasAcneConcerns && profile.acneType === "fungal") {
    treatment = findProduct("The Ordinary Azelaic Acid 10%");
  } else if (hasAcneConcerns) {
    treatment = findProduct("The Ordinary Niacinamide 10% + Zinc 1%");
  } else if (hasPigmentation) {
    treatment = findProduct("Naturium Tranexamic Acid 5%") || findProduct("Alpha Arbutin 2% + HA");
  } else if (hasDehydration) {
    treatment = findProduct("The Ordinary Hyaluronic Acid 2% + B5") || findProduct("Hada Labo Gokujyun Premium Lotion");
  } else {
    treatment = findProduct("The Ordinary Niacinamide 10% + Zinc 1%");
  }

  // 3. Moisturizer
  const moisturizer = pickBestProduct(profile, "Moisturizer");

  // 4. Sunscreen
  const sunscreen = pickBestProduct(profile, "Sunscreen");

  // Merge owned products — owned products replace recommended ones of the same category
  const ownedTypes = new Set(profile.ownedProducts.map(p => p.type));
  const baseAM = [cleanser, treatment, moisturizer, sunscreen].filter(Boolean) as Product[];
  const basePM = [cleanser, treatment, moisturizer].filter(Boolean) as Product[];

  // Replace any recommended product with owned product of same type, then append remaining owned
  const mergeOwned = (base: Product[], order: string[]): Product[] => {
    const result = base.map(p => {
      const owned = profile.ownedProducts.find(op => op.type === p.type);
      return owned || p;
    });
    profile.ownedProducts.forEach(op => {
      if (!result.find(p => p.type === op.type)) result.push(op);
    });
    return sortByRoutineOrder(result, order);
  };

  const morning: Product[] = mergeOwned(baseAM, AM_ORDER);
  const nightEveryNight: Product[] = mergeOwned(basePM, PM_ORDER).filter(p => p.type !== "Sunscreen");

  const partialRoutine = { morning, nightEveryNight, night2x: [] as Product[], night3x: [] as Product[] };
  return { ...partialRoutine, barrierScore: calculateBarrierScore(partialRoutine, profile) };
}

// ─── STANDARD ──────────────────────────────────────────────────────────────
// 5-7 steps: Cleanser → Toner (optional) → Vitamin C (AM) or Niacinamide/HA →
//            Moisturizer → SPF. No retinol, no exfoliant schedule.
function generateStandardRoutine(profile: SkincareProfile): GeneratedRoutine {
  const hasAcneConcerns = profile.concerns.includes("Acne") || profile.concerns.includes("Large Pores");
  const hasPigmentation = profile.concerns.includes("Hyperpigmentation") || profile.concerns.includes("Dark Spots");
  const hasTextureOrDullness = profile.concerns.includes("Dullness") || profile.concerns.includes("Uneven Texture");
  const hasSensitivity = profile.concerns.includes("Redness") || profile.concerns.includes("Sensitivity") || hasSkinType(profile, "Sensitive");
  const hasDehydration = profile.concerns.includes("Dehydration") || hasSkinType(profile, "Dry");

  const cleanser = pickBestProduct(profile, "Cleanser");
  const toner = pickBestProduct(profile, "Toner");

  // AM serum: Vitamin C for pigmentation/dullness, else niacinamide, else HA
  let amSerum: Product | null = null;
  if ((hasPigmentation || hasTextureOrDullness) && !hasSensitivity) {
    amSerum = pickBestProduct(profile, "Vitamin C");
    if (amSerum) amSerum = { ...amSerum, useTime: "morning" };
  } else if (hasAcneConcerns || hasPigmentation) {
    amSerum = pickBestProduct(profile, "Niacinamide");
    if (amSerum) amSerum = { ...amSerum, useTime: "morning" };
  } else {
    amSerum = pickBestProduct(profile, "Hyaluronic Acid") || findProduct("The Ordinary Hyaluronic Acid 2% + B5");
    if (amSerum) amSerum = { ...amSerum, useTime: "morning" };
  }

  // PM serum: niacinamide or HA (no retinol at this level)
  let pmSerum: Product | null = null;
  if (hasAcneConcerns || hasPigmentation) {
    pmSerum = pickBestProduct(profile, "Niacinamide");
  } else if (hasSensitivity) {
    pmSerum = findProduct("Skin1004 Madagascar Centella Ampoule") || findProduct("Purito Centella Green Level Buffet Serum");
  } else {
    pmSerum = pickBestProduct(profile, "Hyaluronic Acid") || findProduct("The Ordinary Hyaluronic Acid 2% + B5");
  }
  if (pmSerum) pmSerum = { ...pmSerum, useTime: "night" };

  // Eye cream only if dark circles concern
  const eyeCream = profile.concerns.includes("Dark Circles") ? pickBestProduct(profile, "Eye Cream") : null;

  const moisturizer = pickBestProduct(profile, "Moisturizer");
  const sunscreen = pickBestProduct(profile, "Sunscreen");

  const baseAM2 = [cleanser, toner, amSerum, eyeCream, moisturizer, sunscreen].filter(Boolean) as Product[];
  const basePM2 = [cleanser, toner, pmSerum, eyeCream, moisturizer].filter(Boolean) as Product[];

  const mergeOwned2 = (base: Product[], order: string[]): Product[] => {
    const result = base.map(p => {
      const owned = profile.ownedProducts.find(op => op.type === p.type);
      return owned || p;
    });
    profile.ownedProducts.forEach(op => {
      if (!result.find(p => p.type === op.type)) result.push(op);
    });
    return sortByRoutineOrder(result, order);
  };

  const morning: Product[] = mergeOwned2(baseAM2, AM_ORDER);
  const nightEveryNight: Product[] = mergeOwned2(basePM2, PM_ORDER).filter(p => p.type !== "Sunscreen");

  const partialRoutine2 = { morning, nightEveryNight, night2x: [] as Product[], night3x: [] as Product[] };
  return { ...partialRoutine2, barrierScore: calculateBarrierScore(partialRoutine2, profile) };
}

// ─── ADVANCED ──────────────────────────────────────────────────────────────
// Full routine: all categories, retinol, alternating nights schedule
function generateAdvancedRoutine(profile: SkincareProfile): GeneratedRoutine {
  const hasAcneConcerns = profile.concerns.includes("Acne") || profile.concerns.includes("Large Pores");
  const hasPigmentationConcerns = profile.concerns.includes("Hyperpigmentation") || profile.concerns.includes("Dark Spots");
  const hasAgingConcerns = profile.concerns.includes("Fine Lines") || profile.concerns.includes("Wrinkles");
  const hasTextureOrDullness = profile.concerns.includes("Dullness") || profile.concerns.includes("Uneven Texture");
  const hasSensitivityConcerns = profile.concerns.includes("Redness") || profile.concerns.includes("Sensitivity") || hasSkinType(profile, "Sensitive");

  const recommendedProducts: Product[] = [];

  // 1. Cleanser
  const cleanser = pickBestProduct(profile, "Cleanser");
  if (cleanser) recommendedProducts.push(cleanser);

  // 2. Exfoliant (alternating nights)
  let exfoliant: Product | null = null;
  if (hasSkinType(profile, "Sensitive")) {
    exfoliant = findProduct("The Ordinary Lactic Acid 10% + HA");
  } else if (hasAcneConcerns) {
    exfoliant = findProduct("Paula's Choice 2% BHA Liquid Exfoliant");
  } else if (hasPigmentationConcerns) {
    exfoliant = findProduct("COSRX AHA 7 Whitehead Power Liquid");
  } else {
    exfoliant = findProduct("Good Molecules Overnight Exfoliating Treatment");
  }
  if (exfoliant) recommendedProducts.push(exfoliant);

  // 3. Toner
  const toner = pickBestProduct(profile, "Toner");
  if (toner) recommendedProducts.push(toner);

  // 4. Essence (dry/aging/dehydration)
  if (hasSkinType(profile, "Dry") || hasAgingConcerns || profile.concerns.includes("Dehydration")) {
    const essence = pickBestProduct(profile, "Essence");
    if (essence) recommendedProducts.push(essence);
  }

  // 5. Serums
  const serums: Product[] = [];

  // Vitamin C (morning)
  if (!hasSkinType(profile, "Sensitive") || hasPigmentationConcerns || hasTextureOrDullness) {
    const vitC = pickBestProduct(profile, "Vitamin C");
    if (vitC) serums.push({ ...vitC, useTime: "morning", benefits: "Brightening, Antioxidant Protection" });
  }

  // Niacinamide
  if (hasAcneConcerns || hasPigmentationConcerns || profile.concerns.includes("Redness") || hasSkinType(profile, "Oily")) {
    const niacinamide = pickBestProduct(profile, "Niacinamide");
    if (niacinamide) serums.push({ ...niacinamide, useTime: "both", benefits: "Pores, Oil Control, Brightening" });
  }

  // HA
  const ha = pickBestProduct(profile, "Hyaluronic Acid") || findProduct("The Ordinary Hyaluronic Acid 2% + B5");
  if (ha) serums.push({ ...ha, useTime: "both", benefits: "Hydration, Plumping" });

  // Retinol — only for aging OR explicit pigmentation (NOT texture/dullness at advanced level)
  if (hasAgingConcerns || hasPigmentationConcerns) {
    const retinol = pickBestProduct(profile, "Retinol");
    if (retinol) serums.push({ ...retinol, useTime: "night", benefits: "Anti-Aging, Texture, Cell Turnover" });
  }

  // Acne-type targeted treatment
  if (profile.acneType && profile.concerns.includes("Acne")) {
    let targeted: Product | null = null;
    if (profile.acneType === "fungal") targeted = findProduct("The Ordinary Azelaic Acid 10%");
    else if (profile.acneType === "inflammatory") targeted = findProduct("IUNIK Propolis Vitamin Synergy Serum");
    else if (profile.acneType === "hormonal") targeted = findProduct("The INKEY List Succinic Acid Treatment");
    if (targeted && !serums.find(s => s.name === targeted!.name)) {
      serums.push({ ...targeted, useTime: "night", benefits: `${profile.acneType} Acne Treatment` });
    }
  }

  // Calming for sensitive
  if (hasSensitivityConcerns) {
    const calming = findProduct("Purito Centella Green Level Buffet Serum") || findProduct("IUNIK Beta Glucan Daily Moisture Serum");
    if (calming && !serums.find(s => s.name === calming.name)) {
      serums.push({ ...calming, useTime: "both", benefits: "Soothing, Barrier Repair" });
    }
  }

  serums.slice(0, 4).forEach(serum => {
    if (!recommendedProducts.find(p => p.name === serum.name)) recommendedProducts.push(serum);
  });

  // 6. Eye Cream
  const eyeCream = pickBestProduct(profile, "Eye Cream");
  if (eyeCream) recommendedProducts.push(eyeCream);

  // 7. Moisturizer
  const moisturizer = pickBestProduct(profile, "Moisturizer");
  if (moisturizer) recommendedProducts.push(moisturizer);

  // 8. Face Oil (dry skin, night)
  if (hasSkinType(profile, "Dry")) {
    const faceOil = pickBestProduct(profile, "Face Oil");
    if (faceOil) recommendedProducts.push(faceOil);
  }

  // 9. Sunscreen
  const sunscreen = pickBestProduct(profile, "Sunscreen");
  if (sunscreen) recommendedProducts.push(sunscreen);

  // Merge with owned products
  const allProducts = [...profile.ownedProducts, ...recommendedProducts];
  const uniqueProducts = allProducts.reduce((acc, product) => {
    if (!acc.find(p => p.name === product.name)) acc.push(product);
    return acc;
  }, [] as Product[]);

  // Build MORNING
  const morning: Product[] = [];
  ["Cleanser", "Toner", "Essence"].forEach(type => {
    const p = uniqueProducts.find(p => p.type === type);
    if (p) morning.push(p);
  });

  const morningAdded = new Set(morning.map(p => p.name));
  uniqueProducts
    .filter(p => p.type === "Vitamin C")
    .forEach(s => { if (!morningAdded.has(s.name)) { morning.push(s); morningAdded.add(s.name); }});
  uniqueProducts
    .filter(p =>
      (p.type === "Niacinamide" && p.useTime !== "night") ||
      (p.type === "Hyaluronic Acid" && p.useTime !== "night") ||
      (p.type === "Serum" && p.useTime !== "night")
    )
    .forEach(s => { if (!morningAdded.has(s.name)) { morning.push(s); morningAdded.add(s.name); }});

  ["Eye Cream", "Moisturizer"].forEach(type => {
    const p = uniqueProducts.find(p => p.type === type);
    if (p && !morningAdded.has(p.name)) morning.push(p);
  });
  const sunscreenProduct = uniqueProducts.find(p => p.type === "Sunscreen");
  if (sunscreenProduct && !morning.find(p => p.name === sunscreenProduct.name)) morning.push(sunscreenProduct);

  // Build NIGHT
  const nightEveryNight: Product[] = [];
  const night2x: Product[] = [];
  const night3x: Product[] = [];

  ["Cleanser", "Toner", "Essence"].forEach(type => {
    const p = uniqueProducts.find(p => p.type === type);
    if (p) nightEveryNight.push(p);
  });

  const retinol = uniqueProducts.find(p => p.type === "Retinol");
  const exfoliantProduct = uniqueProducts.find(p => p.type === "Exfoliant");
  if (retinol) night2x.push(retinol);
  if (exfoliantProduct) night3x.push(exfoliantProduct);

  const nightAdded = new Set<string>([
    ...nightEveryNight.map(p => p.name),
    ...night2x.map(p => p.name),
    ...night3x.map(p => p.name),
  ]);

  uniqueProducts.filter(p =>
    p.type !== "Sunscreen" && p.type !== "Retinol" && p.type !== "Exfoliant" && p.type !== "Vitamin C" &&
    (p.type === "Hyaluronic Acid" || p.type === "Niacinamide" ||
      (p.type === "Serum" && p.useTime !== "morning") ||
      (p.type === "Treatment" && !p.name.toLowerCase().includes("retinol")))
  ).forEach(s => {
    if (!nightAdded.has(s.name)) { nightEveryNight.push(s); nightAdded.add(s.name); }
  });

  ["Eye Cream", "Moisturizer", "Face Oil"].forEach(type => {
    const p = uniqueProducts.find(p => p.type === type);
    if (p && !nightAdded.has(p.name)) nightEveryNight.push(p);
  });

  const advancedRoutine = { morning, nightEveryNight, night2x, night3x };
  return { ...advancedRoutine, barrierScore: calculateBarrierScore(advancedRoutine, profile) };
}

// ─── PUBLIC API ────────────────────────────────────────────────────────────
export function generateFullRoutine(profile: SkincareProfile): GeneratedRoutine {
  const level = profile.routineLevel ?? "standard";
  if (level === "beginner") return generateBeginnerRoutine(profile);
  if (level === "advanced") return generateAdvancedRoutine(profile);
  return generateStandardRoutine(profile);
}

export function getProductExplanation(product: Product) {
  const explanations: Record<string, { purpose: string; irritationRisk: string; nextStep: string }> = {
    "Cleanser": { purpose: "Removes dirt, oil, and impurities without stripping your skin barrier", irritationRisk: "low", nextStep: "If too drying, switch to a cream cleanser; if not cleansing enough, try a foaming formula" },
    "Double Cleanser": { purpose: "First step to dissolve sunscreen, makeup, and oil-based impurities", irritationRisk: "low", nextStep: "Follow with a water-based cleanser for thorough cleansing" },
    "Toner": { purpose: "Balances skin pH, preps skin for better absorption of following products", irritationRisk: "low", nextStep: "If drying, look for hydrating toners without alcohol" },
    "Essence": { purpose: "Adds an extra layer of hydration and helps other products absorb better", irritationRisk: "very low", nextStep: "Pat into damp skin for best absorption" },
    "Vitamin C": { purpose: "Antioxidant protection, brightens dark spots, stimulates collagen production", irritationRisk: "medium", nextStep: "If stinging occurs, try a gentler derivative like ascorbyl glucoside" },
    "Niacinamide": { purpose: "Reduces inflammation, controls oil, strengthens barrier, fades hyperpigmentation", irritationRisk: "very low", nextStep: "Safe to use with most products; can be used morning and night" },
    "Hyaluronic Acid": { purpose: "Draws moisture into skin, plumps fine lines, improves hydration", irritationRisk: "very low", nextStep: "Apply to damp skin and seal with moisturizer" },
    "Retinol": { purpose: "Increases cell turnover, reduces fine lines, improves texture and pigmentation", irritationRisk: "high", nextStep: "If irritation occurs, reduce to 2x/week or try lower concentration" },
    "Treatment": { purpose: "Targets specific skin concerns with active ingredients", irritationRisk: "medium", nextStep: "Introduce slowly and watch for irritation" },
    "Exfoliant": { purpose: "Removes dead skin cells, unclogs pores, improves texture and brightness", irritationRisk: "medium", nextStep: "Start 2x/week and gradually increase; never use with retinol same night" },
    "Eye Cream": { purpose: "Targets delicate eye area for dark circles, puffiness, and fine lines", irritationRisk: "low", nextStep: "Apply with ring finger using gentle patting motions" },
    "Moisturizer": { purpose: "Seals in hydration, repairs skin barrier, prevents moisture loss", irritationRisk: "low", nextStep: "If too heavy, try a gel-cream; if not enough, layer with face oil" },
    "Face Oil": { purpose: "Locks in all previous layers, adds extra nourishment and glow", irritationRisk: "low", nextStep: "Always apply as last step (before sunscreen in AM)" },
    "Sunscreen": { purpose: "Prevents UV damage, premature aging, dark spots, and skin cancer", irritationRisk: "low", nextStep: "Reapply every 2 hours during sun exposure" },
    "Serum": { purpose: "Delivers concentrated active ingredients deep into skin", irritationRisk: "varies", nextStep: "Layer from thinnest to thickest consistency" },
    "Mask": { purpose: "Intensive treatment for specific concerns, used weekly", irritationRisk: "varies", nextStep: "Use 1-2x per week maximum" },
  };
  return explanations[product.type] || { purpose: "Supports skin health", irritationRisk: "low", nextStep: "Follow with moisturizer" };
}

export function generateMinimumRoutine(): Product[] {
  return [
    findProduct("Vanicream Gentle Facial Cleanser") || findProduct("CeraVe Hydrating Facial Cleanser"),
    findProduct("CeraVe Moisturizing Cream") || findProduct("La Roche-Posay Cicaplast Baume B5"),
    findProduct("La Roche-Posay Anthelios SPF 50"),
  ].filter(Boolean) as Product[];
}

export function parseOwnedProducts(raw: string): string[] {
  return Array.from(new Set(
    raw.split(/\n|,|;/g).map(s => s.trim()).filter(Boolean).slice(0, 50)
  ));
}

export function checkProductCompatibility(
  product: Product,
  skinType: SkinType[],
  concerns: Concern[],
  acneType: AcneType,
  existingProducts: Product[]
): string[] {
  const warnings: string[] = [];
  const name = product.name.toLowerCase();
  if (skinType.includes("Sensitive") && (name.includes("glycolic") || name.includes("salicylic") || name.includes("fragrance"))) {
    warnings.push(`⚠️ ${product.name} may be too harsh for sensitive skin. Consider gentler alternatives.`);
  }
  if (skinType.includes("Dry") && (name.includes("foaming") || (name.includes("gel cleanser") && !name.includes("hydrating")))) {
    warnings.push(`⚠️ ${product.name} may be too drying. Consider a cream or hydrating cleanser.`);
  }
  if (skinType.includes("Oily") && ((name.includes("oil") && product.type === "Moisturizer") || name.includes("rich cream"))) {
    warnings.push(`⚠️ ${product.name} might be too heavy for oily skin. Consider a gel or lightweight moisturizer.`);
  }
  if (concerns.includes("Acne") && (name.includes("coconut oil") || name.includes("cocoa butter"))) {
    warnings.push(`⚠️ ${product.name} is comedogenic and may worsen acne.`);
  }
  if (acneType === "fungal" && (name.includes("ferment") || name.includes("yeast"))) {
    warnings.push(`⚠️ ${product.name} may feed fungal acne. Consider azelaic acid instead.`);
  }
  const existingRetinol = existingProducts.some(p => p.type === "Retinol");
  const existingBHA = existingProducts.some(p => p.name.toLowerCase().includes("bha") || p.name.toLowerCase().includes("salicylic"));
  const existingAHA = existingProducts.some(p => p.name.toLowerCase().includes("aha") || p.name.toLowerCase().includes("glycolic") || p.name.toLowerCase().includes("lactic"));
  const isRetinol = product.type === "Retinol";
  const isVitaminC = product.type === "Vitamin C";
  const isBHA = name.includes("bha") || name.includes("salicylic");
  const isAHA = name.includes("aha") || name.includes("glycolic") || name.includes("lactic");
  if (isRetinol && (existingBHA || existingAHA)) warnings.push(`⚠️ You already have exfoliating acids. Don't use retinol with BHA/AHA on the same night - alternate them!`);
  if (isVitaminC && existingRetinol) warnings.push(`💡 Use Vitamin C in the morning and retinol at night - they can be irritating together.`);
  if ((isBHA || isAHA) && (existingBHA || existingAHA)) warnings.push(`⚠️ You already have an exfoliant. Using multiple acids can over-exfoliate and damage your skin barrier.`);
  return warnings;
}
