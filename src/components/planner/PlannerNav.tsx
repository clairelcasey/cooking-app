'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, ChefHat } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PlannerNav() {
  const pathname = usePathname()

  return (
    <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
        <Link
          href="/planner"
          className={cn(
            'flex items-center gap-2 font-semibold transition-colors hover:text-stone-900',
            pathname.startsWith('/planner') ? 'text-stone-900' : 'text-stone-500'
          )}
        >
          <CalendarDays className="size-5" />
          Weekly Planner
        </Link>

        <Link
          href="/recipes"
          className={cn(
            'flex items-center gap-2 text-sm transition-colors hover:text-stone-900',
            pathname.startsWith('/recipes') ? 'text-stone-900 font-medium' : 'text-stone-500'
          )}
        >
          <ChefHat className="size-4" />
          Recipes
        </Link>
      </div>
    </header>
  )
}
