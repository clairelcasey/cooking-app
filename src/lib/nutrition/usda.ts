import type { Ingredient, Nutrition } from '@/types/recipe'

const FDC_BASE = 'https://api.nal.usda.gov/fdc/v1'

// Nutrient IDs from USDA FoodData Central
const NUTRIENT_IDS = {
  calories: 1008,   // Energy (kcal)
  protein_g: 1003,  // Protein
  carbs_g: 1005,    // Carbohydrate, by difference
  fat_g: 1004,      // Total lipid (fat)
  fiber_g: 1079,    // Fiber, total dietary
  sodium_mg: 1093,  // Sodium, Na
  sat_fat_g: 1258,  // Fatty acids, total saturated
}

// Approximate gram weights for common volume/unit conversions
const UNIT_TO_GRAMS: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000,
  mg: 0.001,
  oz: 28.35,
  ounce: 28.35,
  ounces: 28.35,
  lb: 453.6,
  lbs: 453.6,
  pound: 453.6,
  pounds: 453.6,
  ml: 1,
  milliliter: 1,
  milliliters: 1,
  l: 1000,
  liter: 1000,
  liters: 1000,
  cup: 240,
  cups: 240,
  tbsp: 15,
  tablespoon: 15,
  tablespoons: 15,
  tsp: 5,
  teaspoon: 5,
  teaspoons: 5,
}

function toGrams(amount: number | string | null, unit: string): number | null {
  if (amount === null || amount === '') return null
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num) || num <= 0) return null

  const unitLower = unit.toLowerCase().trim()
  // No unit (e.g. "2 eggs") — can't convert; caller falls back to Claude
  if (!unitLower) return null

  const factor = UNIT_TO_GRAMS[unitLower]
  if (!factor) return null

  return num * factor
}

export async function lookupIngredientUSDA(ingredient: Ingredient): Promise<Nutrition | null> {
  const apiKey = process.env.USDA_FDC_API_KEY
  if (!apiKey) return null

  const grams = toGrams(ingredient.amount, ingredient.unit)
  if (grams === null) return null

  try {
    const url = new URL(`${FDC_BASE}/foods/search`)
    url.searchParams.set('query', ingredient.ingredient)
    url.searchParams.set('api_key', apiKey)
    url.searchParams.set('dataType', 'Foundation,SR Legacy')
    url.searchParams.set('pageSize', '1')

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 86400 }, // cache USDA responses for 24h
    })

    if (!res.ok) return null

    const data = (await res.json()) as {
      foods?: Array<{ foodNutrients: Array<{ nutrientId: number; value: number }> }>
    }
    const food = data?.foods?.[0]
    if (!food) return null

    const nutrients = food.foodNutrients

    function getNutrient(id: number): number {
      return nutrients.find((n) => n.nutrientId === id)?.value ?? 0
    }

    const scale = grams / 100

    return {
      calories: Math.round(getNutrient(NUTRIENT_IDS.calories) * scale),
      protein_g: Math.round(getNutrient(NUTRIENT_IDS.protein_g) * scale * 10) / 10,
      carbs_g: Math.round(getNutrient(NUTRIENT_IDS.carbs_g) * scale * 10) / 10,
      fat_g: Math.round(getNutrient(NUTRIENT_IDS.fat_g) * scale * 10) / 10,
      fiber_g: Math.round(getNutrient(NUTRIENT_IDS.fiber_g) * scale * 10) / 10,
      sodium_mg: Math.round(getNutrient(NUTRIENT_IDS.sodium_mg) * scale),
      sat_fat_g: Math.round(getNutrient(NUTRIENT_IDS.sat_fat_g) * scale * 10) / 10,
    }
  } catch {
    return null
  }
}
