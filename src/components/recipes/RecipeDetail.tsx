'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Clock,
  ChefHat,
  Eye,
  Lock,
  Users,
  Edit2,
  Trash2,
  ExternalLink,
  Timer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { convertIngredients } from '@/lib/recipes/conversions'
import { deleteRecipe } from '@/app/recipes/actions'
import { cn } from '@/lib/utils'
import type { Recipe } from '@/types/recipe'

interface RecipeDetailProps {
  recipe: Recipe
}

export function RecipeDetail({ recipe }: RecipeDetailProps) {
  const router = useRouter()
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const ingredients = convertIngredients(recipe.ingredients, unitSystem)
  const totalTime = (recipe.prep_minutes ?? 0) + (recipe.cook_minutes ?? 0)

  function handleDelete() {
    startTransition(async () => {
      await deleteRecipe(recipe.id)
      router.push('/recipes')
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      {/* Hero image */}
      {recipe.image_url && (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl">
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 672px"
          />
        </div>
      )}

      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold leading-tight">{recipe.title}</h1>

        {/* Action buttons — below title on mobile, beside on sm+ */}
        <div className="flex gap-2">
          <Button
            render={<Link href={`/recipes/${recipe.id}/edit`} />}
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 sm:flex-none"
          >
            <Edit2 className="size-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 text-destructive hover:bg-destructive hover:text-destructive-foreground sm:flex-none"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>

        {recipe.description && (
          <p className="text-muted-foreground">{recipe.description}</p>
        )}

        {/* Meta chips */}
        <div className="flex flex-wrap items-center gap-2">
          {recipe.cuisine && <Badge variant="secondary">{recipe.cuisine}</Badge>}
          {recipe.difficulty && (
            <Badge
              variant="outline"
              className={cn(
                recipe.difficulty === 'easy' && 'border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300',
                recipe.difficulty === 'medium' && 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
                recipe.difficulty === 'hard' && 'border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300'
              )}
            >
              {recipe.difficulty}
            </Badge>
          )}
          {recipe.visibility !== 'private' && (
            <Badge variant="outline" className="gap-1">
              {recipe.visibility === 'public' ? <Eye className="size-3" /> : <Users className="size-3" />}
              {recipe.visibility}
            </Badge>
          )}
          {recipe.visibility === 'private' && (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <Lock className="size-3" />
              private
            </Badge>
          )}
        </div>

        {/* Time */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {recipe.prep_minutes != null && recipe.prep_minutes > 0 && (
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" />
              Prep: {recipe.prep_minutes} min
            </span>
          )}
          {recipe.cook_minutes != null && recipe.cook_minutes > 0 && (
            <span className="flex items-center gap-1.5">
              <ChefHat className="size-4" />
              Cook: {recipe.cook_minutes} min
            </span>
          )}
          {totalTime > 0 && recipe.prep_minutes != null && recipe.cook_minutes != null && (
            <span className="flex items-center gap-1.5">
              <Timer className="size-4" />
              Total: {totalTime} min
            </span>
          )}
        </div>

        {recipe.source_url && (
          <a
            href={recipe.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ExternalLink className="size-3.5" />
            Original recipe
          </a>
        )}
      </div>

      <Separator />

      {/* Ingredients */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ingredients</h2>
          {/* Unit toggle */}
          <div className="flex rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => setUnitSystem('metric')}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                unitSystem === 'metric'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Metric
            </button>
            <button
              type="button"
              onClick={() => setUnitSystem('imperial')}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                unitSystem === 'imperial'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Imperial
            </button>
          </div>
        </div>
        <ul className="space-y-2">
          {ingredients.map((ing, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span className="w-20 shrink-0 text-right font-medium text-muted-foreground">
                {ing.amount} {ing.unit}
              </span>
              <span>
                {ing.ingredient}
                {ing.note && (
                  <span className="ml-1 text-muted-foreground/70">({ing.note})</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <Separator />

      {/* Steps */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Instructions</h2>
        <ol className="space-y-4">
          {recipe.steps.map((step) => (
            <li key={step.order} className="flex gap-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                {step.order}
              </span>
              <div className="space-y-1 pt-0.5">
                <p className="text-sm leading-relaxed">{step.description}</p>
                {step.duration_minutes != null && step.duration_minutes > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Timer className="size-3" />
                    {step.duration_minutes} min
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Notes */}
      {recipe.notes && (
        <>
          <Separator />
          <section>
            <h2 className="mb-2 text-lg font-semibold">Notes</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{recipe.notes}</p>
          </section>
        </>
      )}

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete recipe?</DialogTitle>
            <DialogDescription>
              This will permanently delete &ldquo;{recipe.title}&rdquo;. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? 'Deleting…' : 'Delete recipe'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
