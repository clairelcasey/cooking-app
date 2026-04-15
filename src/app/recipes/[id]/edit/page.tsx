import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRecipe } from '@/lib/recipes/queries'
import { RecipeForm } from '@/components/recipes/RecipeForm'

export default async function EditRecipePage({
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

  // Only owner can edit
  if (recipe.owner_id !== user.id) notFound()

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Edit recipe</h1>
      <RecipeForm existing={recipe} />
    </div>
  )
}
