import type { Ingredient, Nutrition } from '@/types/recipe'

export type ProteinLevel = 'low' | 'medium' | 'high'
export type CalorieLevel = 'light' | 'moderate' | 'heavy'
export type WholeFoodsLevel = 'clean' | 'mixed' | 'processed'
export type MacroBalance = 'balanced' | 'unbalanced'
export type FiberLevel = 'low' | 'medium' | 'high'
export type SatietyLabel = 'low' | 'moderate' | 'high'

export interface NutritionDimensions {
  proteinLevel: ProteinLevel
  proteinG: number
  calorieLevel: CalorieLevel
  calories: number
  wholeFoods: WholeFoodsLevel
  macroBalance: MacroBalance
  proteinPct: number
  fatPct: number
  carbPct: number
  fiberLevel: FiberLevel
  fiberG: number
  satietyScore: number
  satietyLabel: SatietyLabel
  fiberDensity: number  // g fiber per 100 kcal
}

const PROCESSED_FLAGS = [
  'syrup', 'powder', 'artificial', 'modified starch', 'starch', 'extract',
  'concentrate', 'isolate', 'hydrolyzed', 'hydrogenated', 'enriched',
  'bleached', 'refined', 'flavoring', 'flavouring', 'high fructose',
  'maltodextrin', 'dextrose', 'msg', 'monosodium glutamate', 'sodium nitrate',
  'sodium benzoate', 'carrageenan', 'xanthan gum', 'soy lecithin',
]

const WHOLE_FOOD_SIGNALS = [
  // Proteins
  'chicken', 'beef', 'pork', 'lamb', 'turkey', 'salmon', 'tuna', 'cod',
  'shrimp', 'prawn', 'egg', 'eggs', 'tofu', 'tempeh', 'lentil', 'lentils',
  'chickpea', 'chickpeas', 'black bean', 'kidney bean', 'edamame',
  // Dairy
  'milk', 'yogurt', 'kefir', 'cottage cheese',
  // Vegetables
  'spinach', 'kale', 'broccoli', 'cauliflower', 'carrot', 'onion', 'garlic',
  'tomato', 'pepper', 'cucumber', 'zucchini', 'squash', 'celery', 'asparagus',
  'beet', 'cabbage', 'lettuce', 'arugula', 'sweet potato', 'potato',
  // Fruits
  'apple', 'banana', 'berry', 'berries', 'strawberry', 'blueberry',
  'raspberry', 'orange', 'lemon', 'lime', 'mango', 'avocado',
  // Grains & starches
  'oats', 'oatmeal', 'quinoa', 'barley', 'brown rice', 'whole wheat',
  'whole grain', 'buckwheat', 'millet',
  // Fats & nuts
  'olive oil', 'coconut oil', 'nuts', 'seeds', 'almond', 'walnut',
  'cashew', 'pecan', 'flaxseed', 'chia seed', 'hemp seed', 'sunflower seed',
]

export function computeWholeFoodsLevel(ingredients: Ingredient[]): WholeFoodsLevel {
  if (ingredients.length === 0) return 'mixed'

  let processedCount = 0
  let wholeCount = 0

  for (const ing of ingredients) {
    const name = ing.ingredient.toLowerCase()
    if (PROCESSED_FLAGS.some((flag) => name.includes(flag))) {
      processedCount++
    } else if (WHOLE_FOOD_SIGNALS.some((signal) => name.includes(signal))) {
      wholeCount++
    }
  }

  const processedFraction = processedCount / ingredients.length

  if (processedFraction >= 0.3) return 'processed'
  if (wholeCount / ingredients.length >= 0.35) return 'clean'
  return 'mixed'
}

/**
 * Satiety / fat loss composite score (0–100).
 *
 * Based on research showing protein % of calories and fiber density are
 * the two strongest independent predictors of satiety and fat loss success.
 * Simplified from the Holt Satiety Index to use data available from USDA.
 *
 * Formula:
 *   proteinPct (% of calories from protein) × 0.6 weight
 *   fiberDensity (g fiber per 100 kcal) × 10 × 0.4 weight
 */
export function computeSatietyScore(
  protein_g: number,
  fiber_g: number,
  calories: number
): { score: number; label: SatietyLabel; fiberDensity: number } {
  if (calories <= 0) return { score: 0, label: 'low', fiberDensity: 0 }

  const proteinPct = (protein_g * 4) / calories * 100
  const fiberDensity = (fiber_g / calories) * 100  // g per 100 kcal

  const score = Math.min(Math.round(proteinPct * 0.6 + fiberDensity * 10 * 0.4), 100)
  const label: SatietyLabel = score >= 55 ? 'high' : score >= 30 ? 'moderate' : 'low'

  return { score, label, fiberDensity: Math.round(fiberDensity * 10) / 10 }
}

export function computeNutritionDimensions(
  nutrition: Nutrition,
  ingredients: Ingredient[]
): NutritionDimensions {
  const calories = nutrition.calories ?? 0
  const protein_g = nutrition.protein_g ?? 0
  const carbs_g = nutrition.carbs_g ?? 0
  const fat_g = nutrition.fat_g ?? 0
  const fiber_g = nutrition.fiber_g ?? 0

  const proteinLevel: ProteinLevel =
    protein_g >= 30 ? 'high' : protein_g >= 15 ? 'medium' : 'low'

  const calorieLevel: CalorieLevel =
    calories < 400 ? 'light' : calories < 650 ? 'moderate' : 'heavy'

  const fiberLevel: FiberLevel =
    fiber_g >= 7 ? 'high' : fiber_g >= 3 ? 'medium' : 'low'

  // Macro % of total calories from macros
  const totalCalsFromMacros = protein_g * 4 + carbs_g * 4 + fat_g * 9
  const proteinPct =
    totalCalsFromMacros > 0 ? Math.round((protein_g * 4 / totalCalsFromMacros) * 100) : 0
  const fatPct =
    totalCalsFromMacros > 0 ? Math.round((fat_g * 9 / totalCalsFromMacros) * 100) : 0
  const carbPct =
    totalCalsFromMacros > 0 ? Math.round((carbs_g * 4 / totalCalsFromMacros) * 100) : 0

  const macroBalance: MacroBalance =
    proteinPct >= 15 &&
    proteinPct <= 40 &&
    fatPct >= 15 &&
    fatPct <= 45 &&
    carbPct <= 65
      ? 'balanced'
      : 'unbalanced'

  const { score: satietyScore, label: satietyLabel, fiberDensity } =
    computeSatietyScore(protein_g, fiber_g, calories)

  return {
    proteinLevel,
    proteinG: protein_g,
    calorieLevel,
    calories,
    wholeFoods: computeWholeFoodsLevel(ingredients),
    macroBalance,
    proteinPct,
    fatPct,
    carbPct,
    fiberLevel,
    fiberG: fiber_g,
    satietyScore,
    satietyLabel,
    fiberDensity,
  }
}

/**
 * Composite integer score (0–100) for sort/filter in DB.
 * Fiber weighted at 25pts (up from 20) to reflect its fat loss importance.
 * Calorie threshold reduced to 15pts to keep total at 100.
 */
export function computeHealthScore(nutrition: Nutrition): number {
  const scores = {
    protein: Math.min((nutrition.protein_g ?? 0) / 30, 1) * 25,
    fiber: Math.min((nutrition.fiber_g ?? 0) / 7, 1) * 25,
    calories:
      (nutrition.calories ?? 0) < 600 ? 15 : (nutrition.calories ?? 0) < 800 ? 8 : 0,
    sodium:
      (nutrition.sodium_mg ?? 0) < 600 ? 20 : (nutrition.sodium_mg ?? 0) < 1000 ? 10 : 0,
    fat: (nutrition.sat_fat_g ?? 0) < 5 ? 15 : (nutrition.sat_fat_g ?? 0) < 10 ? 8 : 0,
  }
  return Math.round(Object.values(scores).reduce((a, b) => a + b, 0))
}
