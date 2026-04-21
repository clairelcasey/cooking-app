'use client'

import type { ScaleFactor } from '@/lib/cook-mode/scale'
import type { Recipe } from '@/types/recipe'
import type { MealSlot } from '@/types/recipe'

export interface AgentScaleAction {
  type: 'scale_action'
  recipeId: string
  recipeName: string
  scaleFactor: ScaleFactor
  recipe: Recipe
}

export interface AgentPlanPreview {
  type: 'plan_preview'
  entries: { date: string; mealSlot: MealSlot; recipeId: string; recipeTitle: string }[]
}

export type AgentAction = AgentScaleAction | AgentPlanPreview

export interface AgentMessageData {
  role: 'user' | 'assistant'
  content: string
  /** Parsed action blocks extracted from assistant content */
  actions?: AgentAction[]
}

interface AgentMessageProps {
  message: AgentMessageData
  onOpenScaledPreview?: (recipe: Recipe, scaleFactor: ScaleFactor) => void
  onApplyPlan?: (entries: AgentPlanPreview['entries']) => void
  onRetryPlan?: () => void
}

/** Strip ```action-type ... ``` fences from display text */
function stripActionFences(text: string): string {
  return text
    .replace(/```plan_preview[\s\S]*?```/g, '')
    .replace(/```scale_action[\s\S]*?```/g, '')
    .trim()
}

export function AgentMessage({ message, onOpenScaledPreview, onApplyPlan, onRetryPlan }: AgentMessageProps) {
  const isUser = message.role === 'user'
  const displayText = isUser ? message.content : stripActionFences(message.content)

  return (
    <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
      {/* Text bubble */}
      {displayText && (
        <div
          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm'
          }`}
        >
          {displayText}
        </div>
      )}

      {/* Action cards */}
      {message.actions?.map((action, i) => {
        if (action.type === 'scale_action') {
          return (
            <div key={i} className="w-full max-w-[85%] rounded-xl border border-border bg-background p-3 shadow-sm">
              <p className="mb-2 text-xs text-muted-foreground">Scaled recipe preview</p>
              <p className="mb-3 text-sm font-medium">{action.recipeName}</p>
              <button
                onClick={() => onOpenScaledPreview?.(action.recipe, action.scaleFactor)}
                className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Open scaled preview ({action.scaleFactor}×)
              </button>
            </div>
          )
        }

        if (action.type === 'plan_preview') {
          const byDate = action.entries.reduce<Record<string, typeof action.entries>>((acc, e) => {
            acc[e.date] = acc[e.date] ?? []
            acc[e.date].push(e)
            return acc
          }, {})

          return (
            <div key={i} className="w-full max-w-[85%] rounded-xl border border-border bg-background p-3 shadow-sm">
              <p className="mb-2 text-xs text-muted-foreground">Proposed meal plan</p>
              <div className="mb-3 space-y-1.5">
                {Object.entries(byDate).map(([date, entries]) => (
                  <div key={date}>
                    <p className="text-xs font-medium text-muted-foreground">
                      {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    {entries.map((e, j) => (
                      <p key={j} className="text-sm">
                        <span className="capitalize text-muted-foreground">{e.mealSlot}: </span>
                        {e.recipeTitle}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onApplyPlan?.(action.entries)}
                  className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Apply to Planner
                </button>
                <button
                  onClick={onRetryPlan}
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  Try again
                </button>
              </div>
            </div>
          )
        }

        return null
      })}
    </div>
  )
}

/** Parse ```action-type ... ``` fences from assistant text into AgentAction objects */
export function parseActions(text: string): AgentAction[] {
  const actions: AgentAction[] = []

  // scale_action fence
  const scaleMatches = text.matchAll(/```scale_action\n([\s\S]*?)```/g)
  for (const match of scaleMatches) {
    try {
      const data = JSON.parse(match[1])
      if (data.recipeId && data.recipeName && data.scaleFactor && data.recipe) {
        actions.push({ type: 'scale_action', ...data })
      }
    } catch {
      // malformed JSON — skip
    }
  }

  // plan_preview fence
  const planMatches = text.matchAll(/```plan_preview\n([\s\S]*?)```/g)
  for (const match of planMatches) {
    try {
      const data = JSON.parse(match[1])
      if (Array.isArray(data.entries)) {
        actions.push({ type: 'plan_preview', entries: data.entries })
      }
    } catch {
      // malformed JSON — skip
    }
  }

  return actions
}
