'use client'

import { useFieldArray } from 'react-hook-form'
import type { Control, UseFormRegister, FieldErrors } from 'react-hook-form'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { RecipeFormValues } from '@/lib/validations/recipe'

const COMMON_UNITS = [
  'cup', 'cups', 'tbsp', 'tsp', 'oz', 'lb', 'lbs',
  'g', 'kg', 'ml', 'l', 'pinch', 'handful', 'bunch',
  'can', 'slice', 'piece', 'clove',
]

interface IngredientFieldsProps {
  control: Control<RecipeFormValues>
  register: UseFormRegister<RecipeFormValues>
  errors: FieldErrors<RecipeFormValues>
}

export function IngredientFields({ control, register, errors }: IngredientFieldsProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' })

  return (
    <div className="space-y-3">
      <datalist id="unit-suggestions">
        {COMMON_UNITS.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>

      {fields.map((field, index) => (
        <div key={field.id} className="space-y-2 rounded-lg border border-border p-3">
          {/* Row 1: qty + unit + ingredient name + remove button */}
          <div className="flex items-center gap-2">
            <Input
              {...register(`ingredients.${index}.amount`)}
              placeholder="Qty"
              aria-label="Amount"
              className="w-16 shrink-0"
            />
            <Input
              {...register(`ingredients.${index}.unit`)}
              placeholder="Unit"
              list="unit-suggestions"
              aria-label="Unit"
              className="w-20 shrink-0"
            />
            <Input
              {...register(`ingredients.${index}.ingredient`)}
              placeholder="Ingredient"
              aria-label="Ingredient"
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => remove(index)}
              disabled={fields.length === 1}
              aria-label="Remove ingredient"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Row 2: note (full width) */}
          <Input
            {...register(`ingredients.${index}.note`)}
            placeholder="Note, e.g. sifted (optional)"
            aria-label="Note"
          />

          {/* Inline errors */}
          {(errors.ingredients?.[index]?.amount || errors.ingredients?.[index]?.unit || errors.ingredients?.[index]?.ingredient) && (
            <div className="space-y-0.5">
              {errors.ingredients?.[index]?.amount && (
                <p className="text-xs text-destructive">{errors.ingredients[index].amount?.message}</p>
              )}
              {errors.ingredients?.[index]?.unit && (
                <p className="text-xs text-destructive">{errors.ingredients[index].unit?.message}</p>
              )}
              {errors.ingredients?.[index]?.ingredient && (
                <p className="text-xs text-destructive">{errors.ingredients[index].ingredient?.message}</p>
              )}
            </div>
          )}
        </div>
      ))}

      {typeof errors.ingredients?.message === 'string' && (
        <p className="text-sm text-destructive">{errors.ingredients.message}</p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full gap-1.5 sm:w-auto"
        onClick={() => append({ amount: '', unit: '', ingredient: '', note: '' })}
      >
        <Plus className="size-4" />
        Add ingredient
      </Button>
    </div>
  )
}
