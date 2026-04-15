import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRecipes } from '@/lib/recipes/queries'
import { RecipeGrid } from '@/components/recipes/RecipeGrid'
import { FilterPanel } from '@/components/recipes/FilterPanel'
import type { RecipeFilters, Difficulty } from '@/types/recipe'

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
    cuisine: str(params.cuisine) || undefined,
    difficulty: (str(params.difficulty) as Difficulty) || undefined,
    minRating: params.minRating ? Number(str(params.minRating)) : undefined,
    sortBy: sortBy || 'created_at',
    sortDir: sortDir || 'desc',
  }

  const recipes = await getRecipes(supabase, user.id, filters)

  // Derive unique cuisines for the filter panel
  const allRecipes = await getRecipes(supabase, user.id, {})
  const cuisines = [...new Set(allRecipes.map((r) => r.cuisine).filter(Boolean) as string[])]

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-8 lg:items-start">
      <FilterPanel cuisines={cuisines} />
      <div className="min-w-0 flex-1">
        <RecipeGrid recipes={recipes} />
      </div>
    </div>
  )
}
