import { z } from 'zod'

export const ingredientSchema = z.object({
  amount: z.string().min(1, 'Required'),
  unit: z.string().min(1, 'Required'),
  ingredient: z.string().min(1, 'Required'),
  note: z.string().optional(),
})

export const stepSchema = z.object({
  description: z.string().min(1, 'Required'),
  duration_minutes: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
})

export const recipeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  source_url: z.union([z.string().url('Must be a valid URL'), z.literal('')]).optional(),
  cuisine: z.string().max(100).optional(),
  tags: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  prep_minutes: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  cook_minutes: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  visibility: z.enum(['private', 'family', 'public']),
  rating: z.union([z.coerce.number().min(1).max(5), z.literal('')]).optional(),
  notes: z.string().max(5000).optional(),
  ingredients: z.array(ingredientSchema).min(1, 'At least one ingredient required'),
  steps: z.array(stepSchema).min(1, 'At least one step required'),
})

export type RecipeFormValues = z.infer<typeof recipeSchema>
