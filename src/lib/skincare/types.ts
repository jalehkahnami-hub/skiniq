export type SkinType = "Oily" | "Dry" | "Combination" | "Normal" | "Sensitive";

export type Concern =
  | "Acne"
  | "Hyperpigmentation"
  | "Dark Spots"
  | "Fine Lines"
  | "Wrinkles"
  | "Dullness"
  | "Large Pores"
  | "Uneven Texture"
  | "Dark Circles"
  | "Dehydration"
  | "Redness"
  | "Sensitivity";

export type AcneType = "hormonal" | "fungal" | "inflammatory" | "comedonal" | "";

export type BudgetRange = "budget" | "mid" | "luxury" | "mixed";

export type RoutineLevel = "beginner" | "standard" | "advanced";

export type ProductCategory =
  | "Cleanser"
  | "Double Cleanser"
  | "Toner"
  | "Essence"
  | "Serum"
  | "Treatment"
  | "Vitamin C"
  | "Niacinamide"
  | "Hyaluronic Acid"
  | "Retinol"
  | "Exfoliant"
  | "Eye Cream"
  | "Moisturizer"
  | "Face Oil"
  | "Sunscreen"
  | "Mask";

export type TimeOfDay = "AM" | "PM";

export type Product = {
  id?: number;
  name: string;
  type: ProductCategory;
  brand: string;
  clean?: boolean;
  price?: number;
  affiliateUrl?: string;
  useTime?: "morning" | "night" | "both";
  benefits?: string;
  reason?: string; // Routine reasoning chip
};

export type BarrierScore = {
  score: number; // 0-100
  label: string; // e.g. "Well balanced"
  color: "green" | "amber" | "red";
  breakdown: { factor: string; impact: "positive" | "neutral" | "negative" }[];
};

export type RoutineStep = {
  time: TimeOfDay;
  order: number;
  category: ProductCategory;
  title: string;
  why: string;
  suggestedProducts: string[];
};

export type SkincareProfile = {
  skinType: SkinType[];
  concerns: Concern[];
  acneType: AcneType;
  budget: BudgetRange;
  routineLevel: RoutineLevel;
  ownedProducts: Product[];
};

export type GeneratedRoutine = {
  morning: Product[];
  nightEveryNight: Product[];
  night2x: Product[]; // Retinol days (Mon/Thu)
  night3x: Product[]; // Exfoliant days (Tue/Fri/Sun)
  barrierScore: BarrierScore;
};

export type ContextFactors = {
  weather: "normal" | "cold" | "hot" | "dry";
  travel: boolean;
  exercise: "low" | "moderate" | "high";
  stress: "normal" | "high";
  uv: "low" | "moderate" | "high" | "extreme";
};
