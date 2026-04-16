import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRecipes } from '@/lib/recipes/queries'
import { RecipeGrid } from '@/components/recipes/RecipeGrid'
import { FilterPanel } from '@/components/recipes/FilterPanel'
import type { RecipeFilters, Difficulty, MealType } from '@/types/recipe'

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
    mealType: (str(params.mealType) as MealType) || undefined,
    vegetarian: params.vegetarian === 'true' ? true : undefined,
    sortBy: sortBy || 'created_at',
    sortDir: sortDir || 'desc',
  }

  const recipes = await getRecipes(supabase, user.id, filters)

  return (
    <div className="flex flex-col gap-2">
      <FilterPanel />
      <RecipeGrid recipes={recipes} />
    </div>
  )
}
