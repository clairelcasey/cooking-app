'use client'

import { useState, useRef } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AddItemInputProps {
  onAdd: (ingredient: string, amount: string, unit: string) => Promise<void>
}

export function AddItemInput({ onAdd }: AddItemInputProps) {
  const [ingredient, setIngredient] = useState('')
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState('')
  const [pending, setPending] = useState(false)
  const ingredientRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ingredient.trim() || pending) return
    setPending(true)
    await onAdd(ingredient.trim(), amount.trim(), unit.trim())
    setIngredient('')
    setAmount('')
    setUnit('')
    setPending(false)
    ingredientRef.current?.focus()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 border-t border-border pt-4 mt-2"
    >
      <input
        ref={ingredientRef}
        type="text"
        placeholder="Add item…"
        value={ingredient}
        onChange={e => setIngredient(e.target.value)}
        className={cn(
          'flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm',
          'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
        )}
      />
      <input
        type="text"
        placeholder="Qty"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        className={cn(
          'w-16 rounded-md border border-input bg-background px-3 py-2 text-sm',
          'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
        )}
      />
      <input
        type="text"
        placeholder="Unit"
        value={unit}
        onChange={e => setUnit(e.target.value)}
        className={cn(
          'w-20 rounded-md border border-input bg-background px-3 py-2 text-sm',
          'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
        )}
      />
      <button
        type="submit"
        disabled={pending || !ingredient.trim()}
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-md',
          'cursor-pointer bg-primary text-primary-foreground transition-opacity',
          'hover:opacity-90 disabled:pointer-events-none disabled:opacity-40'
        )}
        aria-label="Add item"
      >
        <Plus className="size-4" />
      </button>
    </form>
  )
}
