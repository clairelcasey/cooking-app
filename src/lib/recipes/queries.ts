import type { SupabaseClient } from '@supabase/supabase-js'
import type { Recipe, RecipeFilters, RecipeListItem } from '@/types/recipe'

const LIST_COLUMNS = [
  'id',
  'title',
  'image_url',
  'rating',
  'tags',
  'cuisine',
  'difficulty',
  'prep_minutes',
  'cook_minutes',
  'visibility',
  'cook_count',
  'last_cooked_at',
  'created_at',
].join(', ')

export async function getRecipes(
  supabase: SupabaseClient,
  userId: string,
  filters: RecipeFilters = {}
): Promise<RecipeListItem[]> {
  const {
    cuisine,
    difficulty,
    minRating,
    search,
    sortBy = 'created_at',
    sortDir = 'desc',
  } = filters

  let query = supabase
    .from('recipes')
    .select(LIST_COLUMNS)
    .eq('owner_id', userId)

  if (cuisine) query = query.eq('cuisine', cuisine)
  if (difficulty) query = query.eq('difficulty', difficulty)
  if (minRating) query = query.gte('rating', minRating)
  if (search) query = query.ilike('title', `%${search}%`)

  query = query.order(sortBy, { ascending: sortDir === 'asc' })

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as RecipeListItem[]
}

export async function getRecipe(
  supabase: SupabaseClient,
  id: string
): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Recipe
}
