'use client'

import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    alert('Check your email for a login link.')
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-6">
        <h1 className="text-2xl font-bold">Sign In</h1>
        <button
          onClick={handleGoogleLogin}
          className="w-full rounded-md border px-4 py-2 hover:bg-muted"
        >
          Continue with Google
        </button>
        <form onSubmit={handleEmailLogin} className="space-y-3">
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            className="w-full rounded-md border px-3 py-2"
            required
          />
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            Send Magic Link
          </button>
        </form>
      </div>
    </main>
  )
}
