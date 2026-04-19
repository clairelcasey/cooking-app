'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { X, ChefHat } from 'lucide-react'
import { IngredientOverview } from './IngredientOverview'
import { StepList } from './StepList'
import { scaleIngredients, type ScaleFactor } from '@/lib/cook-mode/scale'
import type { Recipe } from '@/types/recipe'

interface CookModeProps {
  recipe: Recipe
}

export function CookMode({ recipe }: CookModeProps) {
  const router = useRouter()
  const [phase, setPhase] = useState<'overview' | 'steps'>('overview')
  const [scaleFactor, setScaleFactor] = useState<ScaleFactor>(1)
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric')
  const [activeStep, setActiveStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  // WakeLock — acquire while in steps phase, release otherwise
  useEffect(() => {
    if (phase !== 'steps') return
    if (!('wakeLock' in navigator)) return

    let wakeLock: WakeLockSentinel | null = null
    let released = false

    async function acquire() {
      try {
        wakeLock = await navigator.wakeLock.request('screen')
      } catch {
        // WakeLock denied or not supported — non-fatal
      }
    }
    acquire()

    return () => {
      released = true
      if (wakeLock && !released) wakeLock.release()
      wakeLock?.release().catch(() => {})
    }
  }, [phase])

  const scaledIngredients = useMemo(
    () => scaleIngredients(recipe.ingredients, scaleFactor, unitSystem),
    [recipe.ingredients, scaleFactor, unitSystem],
  )

  function handleAdvance() {
    setCompletedSteps((prev) => new Set([...prev, activeStep]))
    if (activeStep < recipe.steps.length - 1) {
      setActiveStep(activeStep + 1)
    }
  }

  function handleFinish() {
    setCompletedSteps((prev) => new Set([...prev, activeStep]))
    setPhase('overview')
    setActiveStep(0)
    setCompletedSteps(new Set())
  }

  function handleJumpTo(index: number) {
    setActiveStep(index)
  }

  function handleClose() {
    router.push(`/recipes/${recipe.id}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0">
        <ChefHat className="size-5 text-primary shrink-0" />
        <span className="flex-1 truncate text-sm font-medium text-muted-foreground">
          {phase === 'overview' ? 'Cook Mode' : recipe.title}
        </span>
        {phase === 'steps' && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {activeStep + 1} / {recipe.steps.length}
          </span>
        )}
        <button
          type="button"
          onClick={handleClose}
          className="ml-2 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Exit cook mode"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto">
        {phase === 'overview' ? (
          <IngredientOverview
            title={recipe.title}
            scaleFactor={scaleFactor}
            onScaleChange={(f) => {
              setScaleFactor(f)
            }}
            unitSystem={unitSystem}
            onUnitSystemChange={setUnitSystem}
            scaledIngredients={scaledIngredients}
            onStart={() => {
              setActiveStep(0)
              setCompletedSteps(new Set())
              setPhase('steps')
            }}
          />
        ) : (
          <StepList
            steps={recipe.steps}
            scaledIngredients={scaledIngredients}
            activeStep={activeStep}
            completedSteps={completedSteps}
            onAdvance={handleAdvance}
            onJumpTo={handleJumpTo}
            onFinish={handleFinish}
          />
        )}
      </div>
    </div>
  )
}
