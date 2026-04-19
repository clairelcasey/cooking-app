'use client'

import { useState, useRef, useTransition } from 'react'
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
  Check,
  X,
  Plus,
  ChevronUp,
  ChevronDown,
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
import { deleteRecipe, patchRecipe } from '@/app/recipes/actions'
import { cn } from '@/lib/utils'
import type { Recipe, Ingredient, RecipeStep } from '@/types/recipe'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface RecipeDetailProps {
  recipe: Recipe
}

export function RecipeDetail({ recipe }: RecipeDetailProps) {
  const router = useRouter()
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Inline editing
  const [isEditing, setIsEditing] = useState(false)
  const [localRecipe, setLocalRecipe] = useState<Recipe>(recipe)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<Recipe>(recipe)
  const hasPendingRef = useRef(false)

  const displayIngredients = isEditing
    ? localRecipe.ingredients
    : convertIngredients(recipe.ingredients, unitSystem)
  const totalTime = (localRecipe.prep_minutes ?? 0) + (localRecipe.cook_minutes ?? 0)

  function scheduleAutoSave(updated: Recipe) {
    pendingRef.current = updated
    hasPendingRef.current = true
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSaveStatus('idle')
    debounceRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      const result = await patchRecipe(recipe.id, pendingRef.current)
      hasPendingRef.current = false
      if (result.error) {
        setSaveStatus('error')
        setSaveError(result.error)
      } else {
        setSaveStatus('saved')
      }
    }, 1500)
  }

  function update(patch: Partial<Recipe>) {
    const updated = { ...localRecipe, ...patch }
    setLocalRecipe(updated)
    scheduleAutoSave(updated)
  }

  function updateIngredient(index: number, patch: Partial<Ingredient>) {
    update({
      ingredients: localRecipe.ingredients.map((ing, i) =>
        i === index ? { ...ing, ...patch } : ing
      ),
    })
  }

  function addIngredient() {
    update({
      ingredients: [...localRecipe.ingredients, { amount: '', unit: '', ingredient: '' }],
    })
  }

  function removeIngredient(index: number) {
    if (localRecipe.ingredients.length <= 1) return
    update({ ingredients: localRecipe.ingredients.filter((_, i) => i !== index) })
  }

  function updateStep(index: number, patch: Partial<RecipeStep>) {
    update({
      steps: localRecipe.steps.map((step, i) =>
        i === index ? { ...step, ...patch } : step
      ),
    })
  }

  function addStep() {
    update({
      steps: [
        ...localRecipe.steps,
        { order: localRecipe.steps.length + 1, description: '' },
      ],
    })
  }

  function removeStep(index: number) {
    if (localRecipe.steps.length <= 1) return
    update({
      steps: localRecipe.steps
        .filter((_, i) => i !== index)
        .map((step, i) => ({ ...step, order: i + 1 })),
    })
  }

  function moveStep(index: number, direction: 'up' | 'down') {
    const steps = [...localRecipe.steps]
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= steps.length) return
    ;[steps[index], steps[target]] = [steps[target], steps[index]]
    update({ steps: steps.map((step, i) => ({ ...step, order: i + 1 })) })
  }

  function handleStartEditing() {
    pendingRef.current = localRecipe
    hasPendingRef.current = false
    setIsEditing(true)
    setSaveStatus('idle')
    setSaveError(null)
  }

  async function handleDoneEditing() {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    if (hasPendingRef.current) {
      hasPendingRef.current = false
      setSaveStatus('saving')
      const result = await patchRecipe(recipe.id, pendingRef.current)
      if (result.error) {
        setSaveStatus('error')
        setSaveError(result.error)
        hasPendingRef.current = true
        return
      }
      setSaveStatus('saved')
    }
    setIsEditing(false)
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteRecipe(recipe.id)
      router.push('/recipes')
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      {/* Hero image */}
      {localRecipe.image_url && (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl">
          <Image
            src={localRecipe.image_url}
            alt={localRecipe.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 672px"
          />
          {isEditing && (
            <div className="absolute bottom-2 right-2">
              <Button
                render={<Link href={`/recipes/${recipe.id}/edit`} />}
                variant="secondary"
                size="sm"
                className="text-xs opacity-80"
              >
                Change photo
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="space-y-3">
        {/* Title */}
        {isEditing ? (
          <input
            type="text"
            value={localRecipe.title}
            onChange={(e) => update({ title: e.target.value })}
            className="w-full bg-transparent text-2xl font-semibold leading-tight focus:outline-none focus:ring-0 border-b border-transparent focus:border-primary transition-colors"
            placeholder="Recipe title"
          />
        ) : (
          <h1 className="text-2xl font-semibold leading-tight">{localRecipe.title}</h1>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isEditing ? (
            <Button
              variant="default"
              size="sm"
              className="gap-1.5"
              onClick={handleDoneEditing}
            >
              <Check className="size-3.5" />
              Done editing
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleStartEditing}
            >
              <Edit2 className="size-3.5" />
              Edit
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
          {/* Save status indicator */}
          {isEditing && (
            <span
              className={cn(
                'text-xs',
                saveStatus === 'saving' && 'text-muted-foreground',
                saveStatus === 'saved' && 'text-green-600 dark:text-green-400',
                saveStatus === 'error' && 'text-destructive',
              )}
            >
              {saveStatus === 'saving' && 'Saving\u2026'}
              {saveStatus === 'saved' && 'Saved \u2713'}
              {saveStatus === 'error' && (saveError ?? 'Error saving')}
            </span>
          )}
          {isEditing && (
            <Link
              href={`/recipes/${recipe.id}/edit`}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Full edit (photo & more)
            </Link>
          )}
        </div>

        {/* Description */}
        {isEditing ? (
          <textarea
            value={localRecipe.description ?? ''}
            onChange={(e) => update({ description: e.target.value || null })}
            rows={2}
            className="w-full resize-none bg-transparent text-muted-foreground focus:outline-none focus:ring-0 border-b border-transparent focus:border-primary transition-colors"
            placeholder="Add a description\u2026"
          />
        ) : (
          localRecipe.description && (
            <p className="text-muted-foreground">{localRecipe.description}</p>
          )
        )}

        {/* Meta chips */}
        {isEditing ? (
          <div className="flex flex-wrap gap-3">
            {/* Cuisine */}
            <input
              type="text"
              value={localRecipe.cuisine ?? ''}
              onChange={(e) => update({ cuisine: e.target.value || null })}
              placeholder="Cuisine"
              className="w-28 rounded border border-input bg-background px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {/* Difficulty */}
            <div className="flex rounded-lg border border-border p-0.5 gap-0.5">
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => update({ difficulty: localRecipe.difficulty === d ? null : d })}
                  className={cn(
                    'rounded-md px-2.5 py-0.5 text-xs font-medium capitalize transition-colors',
                    localRecipe.difficulty === d
                      ? d === 'easy'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                        : d === 'medium'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
            {/* Visibility */}
            <div className="flex rounded-lg border border-border p-0.5 gap-0.5">
              {([
                { value: 'private', icon: <Lock className="size-3" />, label: 'Private' },
                { value: 'family', icon: <Users className="size-3" />, label: 'Family' },
                { value: 'public', icon: <Eye className="size-3" />, label: 'Public' },
              ] as const).map(({ value, icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update({ visibility: value })}
                  className={cn(
                    'flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors',
                    localRecipe.visibility === value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
            {/* Vegetarian */}
            <button
              type="button"
              onClick={() => update({ is_vegetarian: !localRecipe.is_vegetarian })}
              className={cn(
                'rounded-lg border px-2.5 py-0.5 text-xs font-medium transition-colors',
                localRecipe.is_vegetarian
                  ? 'border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              Vegetarian
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {localRecipe.cuisine && <Badge variant="secondary">{localRecipe.cuisine}</Badge>}
            {localRecipe.difficulty && (
              <Badge
                variant="outline"
                className={cn(
                  localRecipe.difficulty === 'easy' && 'border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300',
                  localRecipe.difficulty === 'medium' && 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
                  localRecipe.difficulty === 'hard' && 'border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300'
                )}
              >
                {localRecipe.difficulty}
              </Badge>
            )}
            {localRecipe.visibility !== 'private' && (
              <Badge variant="outline" className="gap-1">
                {localRecipe.visibility === 'public' ? <Eye className="size-3" /> : <Users className="size-3" />}
                {localRecipe.visibility}
              </Badge>
            )}
            {localRecipe.visibility === 'private' && (
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <Lock className="size-3" />
                private
              </Badge>
            )}
            {localRecipe.is_vegetarian && (
              <Badge variant="outline" className="border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300">
                Vegetarian
              </Badge>
            )}
          </div>
        )}

        {/* Time */}
        {isEditing ? (
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">Prep</span>
              <input
                type="number"
                min="0"
                value={localRecipe.prep_minutes ?? ''}
                onChange={(e) =>
                  update({ prep_minutes: e.target.value ? Number(e.target.value) : null })
                }
                className="w-16 rounded border border-input bg-background px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="min"
              />
              <span className="text-muted-foreground">min</span>
            </label>
            <label className="flex items-center gap-2">
              <ChefHat className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">Cook</span>
              <input
                type="number"
                min="0"
                value={localRecipe.cook_minutes ?? ''}
                onChange={(e) =>
                  update({ cook_minutes: e.target.value ? Number(e.target.value) : null })
                }
                className="w-16 rounded border border-input bg-background px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="min"
              />
              <span className="text-muted-foreground">min</span>
            </label>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {localRecipe.prep_minutes != null && localRecipe.prep_minutes > 0 && (
              <span className="flex items-center gap-1.5">
                <Clock className="size-4" />
                Prep: {localRecipe.prep_minutes} min
              </span>
            )}
            {localRecipe.cook_minutes != null && localRecipe.cook_minutes > 0 && (
              <span className="flex items-center gap-1.5">
                <ChefHat className="size-4" />
                Cook: {localRecipe.cook_minutes} min
              </span>
            )}
            {totalTime > 0 && localRecipe.prep_minutes != null && localRecipe.cook_minutes != null && (
              <span className="flex items-center gap-1.5">
                <Timer className="size-4" />
                Total: {totalTime} min
              </span>
            )}
          </div>
        )}

        {/* Source URL */}
        {isEditing ? (
          <div className="flex items-center gap-2">
            <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              type="url"
              value={localRecipe.source_url ?? ''}
              onChange={(e) => update({ source_url: e.target.value || null })}
              placeholder="Original recipe URL"
              className="w-full bg-transparent text-sm text-primary focus:outline-none focus:ring-0 border-b border-transparent focus:border-primary transition-colors"
            />
          </div>
        ) : (
          localRecipe.source_url && (
            <a
              href={localRecipe.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="size-3.5" />
              Original recipe
            </a>
          )
        )}
      </div>

      <Separator />

      {/* Ingredients */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ingredients</h2>
          {/* Unit toggle — only in view mode */}
          {!isEditing && (
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
          )}
        </div>

        {isEditing ? (
          <ul className="space-y-2">
            {localRecipe.ingredients.map((ing, i) => (
              <li key={i} className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={ing.amount != null ? String(ing.amount) : ''}
                    onChange={(e) => updateIngredient(i, { amount: e.target.value })}
                    placeholder="Amt"
                    className="w-14 rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <input
                    type="text"
                    value={ing.unit}
                    onChange={(e) => updateIngredient(i, { unit: e.target.value })}
                    placeholder="Unit"
                    className="w-16 rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <input
                    type="text"
                    value={ing.ingredient}
                    onChange={(e) => updateIngredient(i, { ingredient: e.target.value })}
                    placeholder="Ingredient"
                    className="min-w-0 flex-1 rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(i)}
                    disabled={localRecipe.ingredients.length <= 1}
                    className="shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors"
                    aria-label="Remove ingredient"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={ing.note ?? ''}
                  onChange={(e) => updateIngredient(i, { note: e.target.value || undefined })}
                  placeholder="Note (optional)"
                  className="ml-32 w-full max-w-xs rounded border border-input bg-background px-2 py-0.5 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={addIngredient}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="size-4" />
                Add ingredient
              </button>
            </li>
          </ul>
        ) : (
          <ul className="space-y-2">
            {displayIngredients.map((ing, i) => (
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
        )}
      </section>

      <Separator />

      {/* Steps */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Instructions</h2>

        {isEditing ? (
          <ol className="space-y-3">
            {localRecipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                  {step.order}
                </span>
                <div className="flex-1 space-y-1.5">
                  <textarea
                    value={step.description}
                    onChange={(e) => updateStep(i, { description: e.target.value })}
                    rows={2}
                    placeholder="Describe this step\u2026"
                    className="w-full resize-none rounded border border-input bg-background px-2 py-1 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <div className="flex items-center gap-2">
                    <Timer className="size-3 text-muted-foreground" />
                    <input
                      type="number"
                      min="0"
                      value={step.duration_minutes ?? ''}
                      onChange={(e) =>
                        updateStep(i, {
                          duration_minutes: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder="Duration"
                      className="w-20 rounded border border-input bg-background px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-center gap-0.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => moveStep(i, 'up')}
                    disabled={i === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                    aria-label="Move step up"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStep(i, 'down')}
                    disabled={i === localRecipe.steps.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                    aria-label="Move step down"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStep(i)}
                    disabled={localRecipe.steps.length <= 1}
                    className="text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors"
                    aria-label="Remove step"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={addStep}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="size-4" />
                Add step
              </button>
            </li>
          </ol>
        ) : (
          <ol className="space-y-4">
            {localRecipe.steps.map((step) => (
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
        )}
      </section>

      {/* Notes */}
      {(localRecipe.notes || isEditing) && (
        <>
          <Separator />
          <section>
            <h2 className="mb-2 text-lg font-semibold">Notes</h2>
            {isEditing ? (
              <textarea
                value={localRecipe.notes ?? ''}
                onChange={(e) => update({ notes: e.target.value || null })}
                rows={3}
                placeholder="Any notes about this recipe\u2026"
                className="w-full resize-none rounded border border-input bg-background px-2 py-1.5 text-sm leading-relaxed text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">{localRecipe.notes}</p>
            )}
          </section>
        </>
      )}

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete recipe?</DialogTitle>
            <DialogDescription>
              This will permanently delete &ldquo;{localRecipe.title}&rdquo;. This action cannot be undone.
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
              {isPending ? 'Deleting\u2026' : 'Delete recipe'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
