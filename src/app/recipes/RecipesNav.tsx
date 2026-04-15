'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChefHat, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function RecipesNav() {
  const pathname = usePathname()
  const isNew = pathname === '/recipes/new'

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/recipes"
          className={cn(
            'flex items-center gap-2 font-semibold transition-colors hover:text-primary',
            pathname === '/recipes' ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          <ChefHat className="size-5" />
          My Recipes
        </Link>

        {!isNew && (
          <Button render={<Link href="/recipes/new" />} size="sm" className="gap-1.5">
            <Plus className="size-4" />
            New recipe
          </Button>
        )}
      </div>
    </header>
  )
}
