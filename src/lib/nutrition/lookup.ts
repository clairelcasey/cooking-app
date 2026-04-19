import type { Ingredient, Nutrition } from '@/types/recipe'
import { lookupIngredientUSDA } from './usda'
import { estimateIngredientNutrition } from './claude-estimate'
import { computeHealthScore } from './score'

export interface NutritionLookupResult {
  nutrition: Nutrition
  health_score: number
}

/**
 * Look up nutrition for a recipe's ingredients.
 * Tries USDA FoodData Central first; falls back to Claude estimation
 * for ingredients that can't be matched (e.g., no unit, unrecognized name).
 *
 * Returns null if no data could be gathered for any ingredient.
 *
 * Nutrition values are per serving (defaults to 4 servings if not specified).
 */
export async function lookupRecipeNutrition(
  ingredients: Ingredient[],
  servings = 4
): Promise<NutritionLookupResult | null> {
  const totals = {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0,
    sodium_mg: 0,
    sat_fat_g: 0,
  }

  let hasData = false

  for (const ingredient of ingredients) {
    // Skip blank/placeholder ingredients
    if (!ingredient.ingredient.trim()) continue

    let nutrition = await lookupIngredientUSDA(ingredient)

    // Fall back to Claude when USDA can't match (e.g., countable items like eggs, or unknown units)
    if (!nutrition) {
      nutrition = await estimateIngredientNutrition(ingredient)
    }

    if (nutrition) {
      hasData = true
      totals.calories += nutrition.calories ?? 0
      totals.protein_g += nutrition.protein_g ?? 0
      totals.carbs_g += nutrition.carbs_g ?? 0
      totals.fat_g += nutrition.fat_g ?? 0
      totals.fiber_g += nutrition.fiber_g ?? 0
      totals.sodium_mg += nutrition.sodium_mg ?? 0
      totals.sat_fat_g += nutrition.sat_fat_g ?? 0
    }
  }

  if (!hasData) return null

  const s = Math.max(servings, 1)

  const perServing: Nutrition = {
    calories: Math.round(totals.calories / s),
    protein_g: Math.round((totals.protein_g / s) * 10) / 10,
    carbs_g: Math.round((totals.carbs_g / s) * 10) / 10,
    fat_g: Math.round((totals.fat_g / s) * 10) / 10,
    fiber_g: Math.round((totals.fiber_g / s) * 10) / 10,
    sodium_mg: Math.round(totals.sodium_mg / s),
    sat_fat_g: Math.round((totals.sat_fat_g / s) * 10) / 10,
  }

  return {
    nutrition: perServing,
    health_score: computeHealthScore(perServing),
  }
}
