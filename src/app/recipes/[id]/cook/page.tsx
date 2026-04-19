import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRecipe } from '@/lib/recipes/queries'
import { CookMode } from '@/components/cook-mode/CookMode'

export default async function CookPage({
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

  if (recipe.owner_id !== user.id && recipe.visibility === 'private') {
    notFound()
  }

  return <CookMode recipe={recipe} />
}
