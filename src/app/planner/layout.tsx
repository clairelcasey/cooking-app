import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PlannerNav } from '@/components/planner/PlannerNav'

export default async function PlannerLayout({
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
    <div className="min-h-dvh bg-stone-50">
      <PlannerNav />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  )
}
