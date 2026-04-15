import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRecipe } from '@/lib/recipes/queries'
import { RecipeDetail } from '@/components/recipes/RecipeDetail'

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const recipe = await getRecipe(supabase, id)
  if (!recipe) notFound()

  // Users can only see their own private recipes
  if (recipe.owner_id !== user.id && recipe.visibility === 'private') {
    notFound()
  }

  return <RecipeDetail recipe={recipe} />
}
