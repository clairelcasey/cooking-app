'use client'

import { useFieldArray } from 'react-hook-form'
import type { Control, UseFormRegister, FieldErrors } from 'react-hook-form'
import { Plus, X, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { RecipeFormValues } from '@/lib/validations/recipe'

interface StepFieldsProps {
  control: Control<RecipeFormValues>
  register: UseFormRegister<RecipeFormValues>
  errors: FieldErrors<RecipeFormValues>
}

export function StepFields({ control, register, errors }: StepFieldsProps) {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'steps' })

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-start gap-2">
          <div className="flex shrink-0 flex-col items-center gap-1 pt-1.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {index + 1}
            </span>
            <div className="flex flex-col gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-5 text-muted-foreground"
                onClick={() => index > 0 && move(index, index - 1)}
                disabled={index === 0}
                aria-label="Move step up"
              >
                <ChevronUp className="size-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-5 text-muted-foreground"
                onClick={() => index < fields.length - 1 && move(index, index + 1)}
                disabled={index === fields.length - 1}
                aria-label="Move step down"
              >
                <ChevronDown className="size-3" />
              </Button>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <Textarea
              {...register(`steps.${index}.description`)}
              placeholder="Describe this step…"
              rows={2}
              aria-label={`Step ${index + 1} description`}
            />
            {errors.steps?.[index]?.description && (
              <p className="text-xs text-destructive">
                {errors.steps[index].description?.message}
              </p>
            )}

            <div className="flex items-center gap-2">
              <Input
                {...register(`steps.${index}.duration_minutes`)}
                type="number"
                min="0"
                placeholder="Duration (min, optional)"
                className="w-48"
                aria-label={`Step ${index + 1} duration`}
              />
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="mt-1 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => remove(index)}
            disabled={fields.length === 1}
            aria-label="Remove step"
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}

      {typeof errors.steps?.message === 'string' && (
        <p className="text-sm text-destructive">{errors.steps.message}</p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => append({ description: '', duration_minutes: '' })}
      >
        <Plus className="size-4" />
        Add step
      </Button>
    </div>
  )
}
