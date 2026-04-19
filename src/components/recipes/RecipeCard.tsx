'use client'

import Link from 'next/link'
import Image from 'next/image'
import { UtensilsCrossed, Clock, Eye, Lock, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { RecipeListItem, Difficulty } from '@/types/recipe'

function difficultyClass(d: Difficulty | null): string {
  if (d === 'easy') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
  if (d === 'medium') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  if (d === 'hard') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  return ''
}

function VisibilityIcon({ visibility }: { visibility: RecipeListItem['visibility'] }) {
  if (visibility === 'public') return <Eye className="size-3" />
  if (visibility === 'family') return <Users className="size-3" />
  return <Lock className="size-3" />
}

interface RecipeCardProps {
  recipe: RecipeListItem
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const totalTime = (recipe.prep_minutes ?? 0) + (recipe.cook_minutes ?? 0)

  return (
    <Link href={`/recipes/${recipe.id}`} className="group block">
      <Card className="h-full transition-shadow group-hover:shadow-md">
        {/* Image */}
        <div className="relative aspect-video w-full overflow-hidden">
          {recipe.image_url ? (
            <Image
              src={recipe.image_url}
              alt={recipe.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted">
              <UtensilsCrossed className="size-12 text-muted-foreground/30" />
            </div>
          )}
          {/* Visibility badge overlaid top-right */}
          <div className="absolute right-2 top-2">
            <Badge variant="outline" className="gap-1 bg-background/80 text-xs backdrop-blur-sm">
              <VisibilityIcon visibility={recipe.visibility} />
              {recipe.visibility}
            </Badge>
          </div>
        </div>

        <CardContent className="space-y-2 py-3">
          {/* Title */}
          <h3 className="line-clamp-2 font-medium leading-snug">{recipe.title}</h3>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {totalTime > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {totalTime} min
              </span>
            )}
            {recipe.difficulty && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  difficultyClass(recipe.difficulty)
                )}
              >
                {recipe.difficulty}
              </span>
            )}
            {recipe.is_vegetarian && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                Vegetarian
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
