import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRecipes } from '@/lib/recipes/queries'
import { FilterPanel } from '@/components/recipes/FilterPanel'
import { RecipeGroupedView } from '@/components/recipes/RecipeGroupedView'
import type { RecipeFilters, Difficulty, MealType, RecipeListItem } from '@/types/recipe'

function groupByMealType(recipes: RecipeListItem[]): Record<MealType | 'other', RecipeListItem[]> {
  return {
    breakfast: recipes.filter((r) => r.meal_type === 'breakfast'),
    lunch: recipes.filter((r) => r.meal_type === 'lunch'),
    dinner: recipes.filter((r) => r.meal_type === 'dinner'),
    other: recipes.filter((r) => r.meal_type === null),
  }
}

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams

  function str(val: string | string[] | undefined): string {
    if (Array.isArray(val)) return val[0] ?? ''
    return val ?? ''
  }

  const sortRaw = str(params.sort) || 'created_at:desc'
  const [sortBy, sortDir] = sortRaw.split(':') as [RecipeFilters['sortBy'], 'asc' | 'desc']

  const filters: RecipeFilters = {
    search: str(params.search) || undefined,
    difficulty: (str(params.difficulty) as Difficulty) || undefined,
    vegetarian: params.vegetarian === 'true' ? true : undefined,
    sortBy: sortBy || 'created_at',
    sortDir: sortDir || 'desc',
  }

  const recipes = await getRecipes(supabase, user.id, filters)
  const groups = groupByMealType(recipes)

  return (
    <div className="flex flex-col gap-2">
      <FilterPanel />
      <RecipeGroupedView groups={groups} />
    </div>
  )
}
