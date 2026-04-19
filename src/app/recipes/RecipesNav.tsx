'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChefHat, CalendarDays, Plus, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/auth/actions'

export function RecipesNav() {
  const pathname = usePathname()
  const isNew = pathname === '/recipes/new'

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        {/* Left: nav links */}
        <nav className="flex items-center gap-4">
          <Link
            href="/recipes"
            className={cn(
              'flex items-center gap-2 font-semibold transition-colors hover:text-primary',
              pathname.startsWith('/recipes') ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            <ChefHat className="size-5" />
            <span className="hidden sm:inline">My Recipes</span>
          </Link>

          <Link
            href="/planner"
            className={cn(
              'flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary',
              pathname.startsWith('/planner') ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            <CalendarDays className="size-4" />
            <span className="hidden sm:inline">Planner</span>
          </Link>
        </nav>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button render={<Link href="/recipes/new" />} size="sm" className="gap-1.5">
              <Plus className="size-4" />
              <span className="hidden sm:inline">New recipe</span>
            </Button>
          )}

          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
