import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RecipesNav } from './RecipesNav'

export default async function RecipesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-dvh bg-background">
      <RecipesNav />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
