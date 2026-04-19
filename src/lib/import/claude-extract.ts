import type { RecipeFormValues } from '@/lib/validations/recipe'

export const RECIPE_EXTRACTION_SYSTEM_PROMPT = `You are a recipe extraction assistant. Extract recipe information from the provided text or image and return ONLY a valid JSON object with no markdown, no code fences, and no explanation.

The JSON must have exactly this structure:
{
  "title": "string (required)",
  "description": "string or null",
  "cuisine": "string or null",
  "meal_type": "breakfast" | "lunch" | "dinner" | null,
  "difficulty": "easy" | "medium" | "hard" | null,
  "is_vegetarian": true | false,
  "prep_minutes": number or null,
  "cook_minutes": number or null,
  "ingredients": [
    { "amount": "string", "unit": "string", "ingredient": "string", "note": "string" }
  ],
  "steps": [
    { "order": number, "description": "string", "duration_minutes": number or null }
  ],
  "notes": "string or null"
}

Rules:
- ingredients and steps must each have at least one item
- amount should be a string like "2", "1/2", "3/4"
- unit can be empty string if no unit (e.g., "2 eggs" → amount: "2", unit: "", ingredient: "eggs")
- note is always a string, use "" for no note
- is_vegetarian should be true only if the recipe contains no meat or fish
- title should be a simple, clean dish name (e.g. "Salmon", "Chocolate Chip Cookies") — strip marketing words, time claims, and filler adjectives like "Easy", "Quick", "15-Minute", "Best Ever", "Weeknight", "Simple", "Homemade", etc.
- If you cannot find a recipe in the content, still return valid JSON with a best-effort extraction`

export interface ExtractedRecipe {
  title: string
  description: string | null
  cuisine: string | null
  meal_type: 'breakfast' | 'lunch' | 'dinner' | null
  difficulty: 'easy' | 'medium' | 'hard' | null
  is_vegetarian: boolean
  prep_minutes: number | null
  cook_minutes: number | null
  ingredients: Array<{ amount: string; unit: string; ingredient: string; note: string }>
  steps: Array<{ order: number; description: string; duration_minutes: number | null }>
  notes: string | null
}

export function parseClaudeRecipe(text: string): ExtractedRecipe {
  // Strip markdown code fences if Claude added them despite instructions
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()

  let raw: unknown
  try {
    raw = JSON.parse(cleaned)
  } catch {
    // Return a minimal valid structure so the UI can still show something
    return {
      title: 'Imported Recipe',
      description: null,
      cuisine: null,
      meal_type: null,
      difficulty: null,
      is_vegetarian: false,
      prep_minutes: null,
      cook_minutes: null,
      ingredients: [{ amount: '', unit: '', ingredient: '', note: '' }],
      steps: [{ order: 1, description: text.slice(0, 500), duration_minutes: null }],
      notes: null,
    }
  }

  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Invalid JSON structure')
  }

  const r = raw as Record<string, unknown>

  const ingredients = Array.isArray(r.ingredients) && r.ingredients.length > 0
    ? r.ingredients.map((ing: unknown, i: number) => {
        const item = (ing ?? {}) as Record<string, unknown>
        return {
          amount: String(item.amount ?? ''),
          unit: String(item.unit ?? ''),
          ingredient: String(item.ingredient ?? `Ingredient ${i + 1}`),
          note: String(item.note ?? ''),
        }
      })
    : [{ amount: '', unit: '', ingredient: '', note: '' }]

  const steps = Array.isArray(r.steps) && r.steps.length > 0
    ? r.steps.map((s: unknown, i: number) => {
        const step = (s ?? {}) as Record<string, unknown>
        const dur = step.duration_minutes
        return {
          order: i + 1,
          description: String(step.description ?? ''),
          duration_minutes: typeof dur === 'number' && !isNaN(dur) ? dur : null,
        }
      })
    : [{ order: 1, description: '', duration_minutes: null }]

  const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const
  const DIFFICULTIES = ['easy', 'medium', 'hard'] as const

  const meal_type = MEAL_TYPES.includes(r.meal_type as 'breakfast' | 'lunch' | 'dinner')
    ? (r.meal_type as 'breakfast' | 'lunch' | 'dinner')
    : null

  const difficulty = DIFFICULTIES.includes(r.difficulty as 'easy' | 'medium' | 'hard')
    ? (r.difficulty as 'easy' | 'medium' | 'hard')
    : null

  return {
    title: String(r.title ?? 'Imported Recipe'),
    description: typeof r.description === 'string' ? r.description || null : null,
    cuisine: typeof r.cuisine === 'string' ? r.cuisine || null : null,
    meal_type,
    difficulty,
    is_vegetarian: r.is_vegetarian === true,
    prep_minutes: typeof r.prep_minutes === 'number' && !isNaN(r.prep_minutes) ? r.prep_minutes : null,
    cook_minutes: typeof r.cook_minutes === 'number' && !isNaN(r.cook_minutes) ? r.cook_minutes : null,
    ingredients,
    steps,
    notes: typeof r.notes === 'string' ? r.notes || null : null,
  }
}

/** Convert an ExtractedRecipe into the shape RecipeForm expects for pre-filling */
export function extractedToFormValues(recipe: ExtractedRecipe): Partial<RecipeFormValues> {
  return {
    title: recipe.title,
    description: recipe.description ?? '',
    cuisine: recipe.cuisine ?? '',
    meal_type: recipe.meal_type ?? undefined,
    difficulty: recipe.difficulty ?? undefined,
    is_vegetarian: recipe.is_vegetarian,
    prep_minutes: recipe.prep_minutes ?? '',
    cook_minutes: recipe.cook_minutes ?? '',
    notes: recipe.notes ?? '',
    ingredients: recipe.ingredients.map((ing) => ({
      amount: ing.amount,
      unit: ing.unit,
      ingredient: ing.ingredient,
      note: ing.note,
    })),
    steps: recipe.steps.map((s) => ({
      description: s.description,
      duration_minutes: s.duration_minutes ?? '',
    })),
  }
}
