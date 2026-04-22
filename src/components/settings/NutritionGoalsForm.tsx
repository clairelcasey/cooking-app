'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveNutritionGoals } from '@/app/settings/actions'

interface NutritionGoalsFormProps {
  initialProtein: number
  initialFiber: number
}

export function NutritionGoalsForm({ initialProtein, initialFiber }: NutritionGoalsFormProps) {
  const [protein, setProtein] = useState(String(initialProtein))
  const [fiber, setFiber] = useState(String(initialFiber))
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('saving')

    const proteinVal = parseInt(protein, 10)
    const fiberVal = parseInt(fiber, 10)

    if (isNaN(proteinVal) || isNaN(fiberVal) || proteinVal < 1 || fiberVal < 1) {
      setStatus('error')
      return
    }

    const result = await saveNutritionGoals({ protein_goal_g: proteinVal, fiber_goal_g: fiberVal })
    setStatus(result.error ? 'error' : 'saved')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="protein">Daily protein goal (g)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="protein"
              type="number"
              min={1}
              max={500}
              value={protein}
              onChange={(e) => { setProtein(e.target.value); setStatus('idle') }}
              className="w-28"
            />
            <span className="text-sm text-muted-foreground">g / day</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Recommended for active adults: 100–160g/day
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fiber">Daily fiber goal (g)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="fiber"
              type="number"
              min={1}
              max={100}
              value={fiber}
              onChange={(e) => { setFiber(e.target.value); setStatus('idle') }}
              className="w-28"
            />
            <span className="text-sm text-muted-foreground">g / day</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Standard recommendation: 25g/day (women), 38g/day (men)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? 'Saving…' : 'Save goals'}
        </Button>

        {status === 'saved' && (
          <p className="text-sm text-green-600 dark:text-green-400">Goals saved!</p>
        )}
        {status === 'error' && (
          <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
        )}
      </div>
    </form>
  )
}
