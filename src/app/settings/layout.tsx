import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '@/components/AppNav'

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const name = user.user_metadata?.full_name as string | undefined
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined

  return (
    <div className="min-h-dvh bg-background">
      <AppNav userName={name} userAvatarUrl={avatarUrl} />
      <main className="mx-auto max-w-2xl px-4 py-10">{children}</main>
    </div>
  )
}
