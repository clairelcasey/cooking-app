import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/profile/queries'
import { NutritionGoalsForm } from '@/components/settings/NutritionGoalsForm'

const DEFAULT_PROTEIN = 120
const DEFAULT_FIBER = 25

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await getProfile(supabase)
  const initialProtein = profile?.health_goals?.protein_goal_g ?? DEFAULT_PROTEIN
  const initialFiber = profile?.health_goals?.fiber_goal_g ?? DEFAULT_FIBER

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize your daily nutrition targets.
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Nutrition goals</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            These targets appear as progress bars on each day in your planner.
          </p>
        </div>
        <NutritionGoalsForm initialProtein={initialProtein} initialFiber={initialFiber} />
      </section>
    </div>
  )
}
