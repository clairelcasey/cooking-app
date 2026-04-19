'use client'

import { useRef, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Lock, Eye, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ImageUpload } from './ImageUpload'
import { IngredientFields } from './IngredientFields'
import { StepFields } from './StepFields'
import { recipeSchema, type RecipeFormValues } from '@/lib/validations/recipe'
import { createRecipe, updateRecipe } from '@/app/recipes/actions'
import { cn } from '@/lib/utils'
import type { Recipe, Difficulty, MealType, Visibility } from '@/types/recipe'

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
]

const VISIBILITIES: { value: Visibility; label: string; icon: React.ReactNode }[] = [
  { value: 'private', label: 'Private', icon: <Lock className="size-3.5" /> },
  { value: 'family', label: 'Family', icon: <Users className="size-3.5" /> },
  { value: 'public', label: 'Public', icon: <Eye className="size-3.5" /> },
]

interface RecipeFormProps {
  existing?: Recipe
  prefill?: Partial<RecipeFormValues>
  existingImageUrl?: string
}

export function RecipeForm({ existing, prefill, existingImageUrl }: RecipeFormProps) {
  const router = useRouter()
  const imageFileRef = useRef<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const defaultValues: RecipeFormValues = existing
    ? {
        title: existing.title,
        description: existing.description ?? '',
        source_url: existing.source_url ?? '',
        cuisine: existing.cuisine ?? '',
        difficulty: existing.difficulty ?? undefined,
        meal_type: existing.meal_type ?? undefined,
        is_vegetarian: existing.is_vegetarian ?? false,
        prep_minutes: existing.prep_minutes ?? '',
        cook_minutes: existing.cook_minutes ?? '',
        visibility: existing.visibility,
        notes: existing.notes ?? '',
        ingredients:
          existing.ingredients.length > 0
            ? existing.ingredients.map((ing) => ({
                amount: String(ing.amount ?? ''),
                unit: ing.unit,
                ingredient: ing.ingredient,
                note: ing.note ?? '',
              }))
            : [{ amount: '', unit: '', ingredient: '', note: '' }],
        steps:
          existing.steps.length > 0
            ? existing.steps.map((s) => ({
                description: s.description,
                duration_minutes: s.duration_minutes ?? '',
              }))
            : [{ description: '', duration_minutes: '' }],
      }
    : {
        title: '',
        description: '',
        source_url: '',
        cuisine: '',
        visibility: 'private',
        is_vegetarian: false,
        notes: '',
        ingredients: [{ amount: '', unit: '', ingredient: '', note: '' }],
        steps: [{ description: '', duration_minutes: '' }],
        ...prefill,
      }

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues,
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form

  const watchedVisibility = watch('visibility')
  const watchedDifficulty = watch('difficulty')
  const watchedMealType = watch('meal_type')
  const watchedVegetarian = watch('is_vegetarian')

  function onSubmit(values: RecipeFormValues) {
    setError(null)
    startTransition(async () => {
      if (existing) {
        const result = await updateRecipe(existing.id, values, imageFileRef.current ?? undefined)
        if (result.error) {
          setError(result.error)
          return
        }
        router.push(`/recipes/${existing.id}`)
      } else {
        const result = await createRecipe(values, imageFileRef.current ?? undefined, existingImageUrl)
        if (result.error) {
          setError(result.error)
          return
        }
        router.push(`/recipes/${result.id}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic info */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Basic info</h2>

        <div className="space-y-1.5">
          <Label htmlFor="title">Title *</Label>
          <Input id="title" {...register('title')} placeholder="Chocolate chip cookies" />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="A short description of the recipe…"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cuisine">Cuisine</Label>
            <Input id="cuisine" {...register('cuisine')} placeholder="Italian" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="source_url">Source URL</Label>
          <Input id="source_url" {...register('source_url')} placeholder="https://…" />
          {errors.source_url && (
            <p className="text-sm text-destructive">{errors.source_url.message}</p>
          )}
        </div>
      </section>

      <Separator />

      {/* Photo */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Photo</h2>
        <ImageUpload
          onFileChange={(file) => { imageFileRef.current = file }}
          existingUrl={existing?.image_url}
        />
      </section>

      <Separator />

      {/* Classification */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Details</h2>

        <div className="space-y-2">
          <Label>Difficulty</Label>
          <div className="flex gap-2">
            {DIFFICULTIES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setValue('difficulty', watchedDifficulty === value ? undefined : value)
                }
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  watchedDifficulty === value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-transparent text-foreground hover:bg-muted'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Meal type</Label>
          <div className="flex gap-2">
            {MEAL_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setValue('meal_type', watchedMealType === value ? undefined : value)
                }
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  watchedMealType === value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-transparent text-foreground hover:bg-muted'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Dietary</Label>
          <button
            type="button"
            onClick={() => setValue('is_vegetarian', !watchedVegetarian)}
            className={cn(
              'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
              watchedVegetarian
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-transparent text-foreground hover:bg-muted'
            )}
          >
            Vegetarian
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="prep_minutes">Prep (min)</Label>
            <Input
              id="prep_minutes"
              type="number"
              min="0"
              {...register('prep_minutes')}
              placeholder="15"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cook_minutes">Cook (min)</Label>
            <Input
              id="cook_minutes"
              type="number"
              min="0"
              {...register('cook_minutes')}
              placeholder="30"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Visibility */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Visibility</h2>
        <div className="flex gap-2">
          {VISIBILITIES.map(({ value, label, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue('visibility', value)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                watchedVisibility === value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-transparent text-foreground hover:bg-muted'
              )}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </section>

      <Separator />

      {/* Ingredients */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Ingredients *</h2>
        <IngredientFields control={control} register={register} errors={errors} />
      </section>

      <Separator />

      {/* Steps */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Instructions *</h2>
        <StepFields control={control} register={register} errors={errors} />
      </section>

      <Separator />

      {/* Notes */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Notes</h2>
        <Textarea
          {...register('notes')}
          placeholder="Any additional notes, tips, or variations…"
          rows={3}
        />
      </section>

      {/* Error + submit */}
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending
            ? existing
              ? 'Saving…'
              : 'Creating…'
            : existing
              ? 'Save changes'
              : 'Create recipe'}
        </Button>
      </div>
    </form>
  )
}
