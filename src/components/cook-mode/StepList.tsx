'use client'

import { useEffect, useRef } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StepTimer } from './StepTimer'
import { buildSegments } from '@/lib/cook-mode/inject-amounts'
import { cn } from '@/lib/utils'
import type { RecipeStep } from '@/types/recipe'
import type { ScaledIngredient } from '@/lib/cook-mode/scale'

interface StepListProps {
  steps: RecipeStep[]
  scaledIngredients: ScaledIngredient[]
  activeStep: number
  completedSteps: Set<number>
  onAdvance: () => void
  onJumpTo: (index: number) => void
  onFinish: () => void
}

export function StepList({
  steps,
  scaledIngredients,
  activeStep,
  completedSteps,
  onAdvance,
  onJumpTo,
  onFinish,
}: StepListProps) {
  const stepRefs = useRef<(HTMLLIElement | null)[]>([])

  useEffect(() => {
    stepRefs.current[activeStep]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeStep])

  const isLastStep = activeStep === steps.length - 1

  return (
    <ol className="space-y-3 px-4 py-4">
      {steps.map((step, i) => {
        const isCompleted = completedSteps.has(i)
        const isActive = i === activeStep
        const isUpcoming = !isCompleted && !isActive

        const segments = buildSegments(step.description, scaledIngredients)

        return (
          <li
            key={step.order}
            ref={(el) => { stepRefs.current[i] = el }}
            className={cn(
              'rounded-xl border transition-all duration-200',
              isActive && 'border-primary/30 bg-card shadow-md',
              isCompleted && 'border-transparent bg-muted/30 opacity-60',
              isUpcoming && 'border-transparent bg-muted/20 cursor-pointer hover:bg-muted/40',
            )}
            onClick={() => {
              if (isUpcoming) onJumpTo(i)
            }}
          >
            <div className="flex gap-3 p-4">
              {/* Step number / check */}
              <div className="mt-0.5 shrink-0">
                {isCompleted ? (
                  <CheckCircle2 className="size-6 text-green-500" />
                ) : (
                  <span
                    className={cn(
                      'flex size-6 items-center justify-center rounded-full text-xs font-semibold',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {step.order}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-3 min-w-0">
                <p
                  className={cn(
                    'leading-relaxed',
                    isActive ? 'text-base text-foreground' : 'text-sm text-muted-foreground',
                  )}
                >
                  {segments.map((seg, idx) =>
                    seg.type === 'text' ? (
                      <span key={idx}>{seg.content}</span>
                    ) : (
                      <span key={idx}>
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary mr-0.5">
                          {seg.badge}
                        </span>
                        <span>{seg.content}</span>
                      </span>
                    ),
                  )}
                </p>

                {/* Timer — only on active step */}
                {isActive && step.duration_minutes != null && step.duration_minutes > 0 && (
                  <StepTimer
                    durationMinutes={step.duration_minutes}
                    onComplete={isLastStep ? onFinish : onAdvance}
                  />
                )}

                {/* Next / Finish button — only on active step */}
                {isActive && (
                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      onClick={isLastStep ? onFinish : onAdvance}
                    >
                      {isLastStep ? 'Finish Cooking' : 'Mark Done / Next →'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
