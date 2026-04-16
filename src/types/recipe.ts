export interface Ingredient {
  amount: number | string | null
  unit: string
  ingredient: string
  note?: string
}

export interface RecipeStep {
  order: number
  description: string
  duration_minutes?: number | null
}

export interface Nutrition {
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  fiber_g?: number
  sodium_mg?: number
  sat_fat_g?: number
}

export type Visibility = 'private' | 'family' | 'public'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type MealType = 'breakfast' | 'lunch' | 'dinner'

export interface Recipe {
  id: string
  owner_id: string
  family_id: string | null
  visibility: Visibility
  public_slug: string | null
  title: string
  description: string | null
  source_url: string | null
  image_url: string | null
  ingredients: Ingredient[]
  steps: RecipeStep[]
  cuisine: string | null
  meal_type: MealType | null
  is_vegetarian: boolean
  difficulty: Difficulty | null
  prep_minutes: number | null
  cook_minutes: number | null
  nutrition: Nutrition
  health_score: number | null
  last_cooked_at: string | null
  cook_count: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type RecipeListItem = Pick<
  Recipe,
  | 'id'
  | 'title'
  | 'image_url'
  | 'meal_type'
  | 'is_vegetarian'
  | 'cuisine'
  | 'difficulty'
  | 'prep_minutes'
  | 'cook_minutes'
  | 'visibility'
  | 'cook_count'
  | 'last_cooked_at'
  | 'created_at'
>

export interface PlanEntry {
  id: string
  plan_id: string
  entry_date: string
  meal_slot: MealSlot
  recipe_id: string | null
  free_text_meal: string | null
  status: 'planned' | 'cooked' | 'skipped'
  recipe?: {
    id: string
    title: string
    image_url: string | null
    prep_minutes: number | null
  }
}

export interface WeekPlan {
  planId: string
  entries: PlanEntry[]
}

export interface RecipeFilters {
  cuisine?: string
  difficulty?: Difficulty
  mealType?: MealType
  vegetarian?: boolean
  search?: string
  sortBy?: 'created_at' | 'cook_count' | 'last_cooked_at' | 'prep_minutes'
  sortDir?: 'asc' | 'desc'
}
