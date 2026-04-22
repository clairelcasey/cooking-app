import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRecipes } from '@/lib/recipes/queries'
import { getRecipePickerList } from '@/lib/grocery/queries'
import { GroceryList } from '@/components/grocery/GroceryList'

export default async function GroceryPage({
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
  const recipesParam = Array.isArray(params.recipes) ? params.recipes[0] : params.recipes
  const preSelectedIds = recipesParam ? recipesParam.split(',').filter(Boolean) : []

  const [recipes, existingList] = await Promise.all([
    getRecipes(supabase, user.id),
    getRecipePickerList(supabase, user.id),
  ])

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Grocery List</h1>
      <GroceryList
        listId={existingList?.id ?? null}
        initialItems={existingList?.items ?? []}
        recipes={recipes}
        initialSelectedIds={preSelectedIds}
      />
    </div>
  )
}
