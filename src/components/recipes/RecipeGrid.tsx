import Link from 'next/link'
import { BookOpen, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RecipeCard } from './RecipeCard'
import type { RecipeListItem } from '@/types/recipe'

interface RecipeGridProps {
  recipes: RecipeListItem[]
}

export function RecipeGrid({ recipes }: RecipeGridProps) {
  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <BookOpen className="size-16 text-muted-foreground/30" />
        <div className="space-y-1">
          <p className="font-medium text-muted-foreground">No recipes yet</p>
          <p className="text-sm text-muted-foreground/70">
            Add your first recipe to get started
          </p>
        </div>
        <Button render={<Link href="/recipes/new" />} className="gap-2">
          <Plus className="size-4" />
          Add your first recipe
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  )
}
