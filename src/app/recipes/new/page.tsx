import { RecipeForm } from '@/components/recipes/RecipeForm'

export default function NewRecipePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">New recipe</h1>
      <RecipeForm />
    </div>
  )
}
