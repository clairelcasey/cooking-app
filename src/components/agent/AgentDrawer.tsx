'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { X, ChefHat } from 'lucide-react'
import { AgentInput } from './AgentInput'
import { AgentMessage, parseActions, type AgentMessageData, type AgentPlanPreview } from './AgentMessage'
import { CookMode } from '@/components/cook-mode/CookMode'
import { applyAgentPlan } from '@/app/agent/actions'
import type { Recipe } from '@/types/recipe'
import type { ScaleFactor } from '@/lib/cook-mode/scale'

interface AgentDrawerProps {
  open: boolean
  onClose: () => void
}

const WELCOME: AgentMessageData = {
  role: 'assistant',
  content: "Hi! I'm your cooking assistant. Ask me anything — I can help balance your meal plan, find recipe ideas, suggest substitutes, scale recipes, or even draft a full week of meals for you.",
}

export function AgentDrawer({ open, onClose }: AgentDrawerProps) {
  const pathname = usePathname()
  const [messages, setMessages] = useState<AgentMessageData[]>([WELCOME])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [cookModeRecipe, setCookModeRecipe] = useState<Recipe | null>(null)
  const [cookModeScale, setCookModeScale] = useState<ScaleFactor>(1)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Listen for open-agent custom events (fired by banners)
  const openWithMessage = useCallback((msg?: string) => {
    if (msg) setInput(msg)
  }, [])

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<{ message?: string }>).detail
      openWithMessage(detail?.message)
    }
    window.addEventListener('open-agent', handler)
    return () => window.removeEventListener('open-agent', handler)
  }, [openWithMessage])

  async function handleSubmit() {
    const userContent = input.trim()
    if (!userContent || isStreaming) return

    setInput('')

    const userMsg: AgentMessageData = { role: 'user', content: userContent }
    const history = [...messages, userMsg]
    setMessages(history)

    // Placeholder for streaming assistant message
    const assistantMsg: AgentMessageData = { role: 'assistant', content: '' }
    setMessages([...history, assistantMsg])
    setIsStreaming(true)

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          pathname,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }))
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: err.error ?? 'Something went wrong. Please try again.' },
        ])
        return
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })
          setMessages((prev) => [
            ...prev.slice(0, -1),
            { role: 'assistant', content: accumulated },
          ])
        }
      }

      // Parse action blocks from completed message
      const actions = parseActions(accumulated)
      if (actions.length > 0) {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: accumulated, actions },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Connection error. Please try again.' },
      ])
    } finally {
      setIsStreaming(false)
    }
  }

  function handleOpenScaledPreview(recipe: Recipe, scaleFactor: ScaleFactor) {
    setCookModeRecipe(recipe)
    setCookModeScale(scaleFactor)
  }

  async function handleApplyPlan(entries: AgentPlanPreview['entries']) {
    const result = await applyAgentPlan(entries)
    if (result.error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Couldn't apply the plan: ${result.error}` },
      ])
    } else {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Done! I've added those meals to your planner. Head over to the Planner to review them." },
      ])
    }
  }

  function handleRetryPlan() {
    setInput("Give me a different meal plan for the week.")
    // Focus input
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]"
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col bg-background shadow-2xl transition-transform duration-300 ease-in-out sm:w-[400px] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0">
          <ChefHat className="size-5 text-primary shrink-0" />
          <span className="flex-1 text-sm font-semibold">Cooking Assistant</span>
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close assistant"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg, i) => (
            <AgentMessage
              key={i}
              message={msg}
              onOpenScaledPreview={handleOpenScaledPreview}
              onApplyPlan={handleApplyPlan}
              onRetryPlan={handleRetryPlan}
            />
          ))}

          {/* Streaming indicator */}
          {isStreaming && messages[messages.length - 1]?.content === '' && (
            <div className="flex items-start">
              <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-muted px-3.5 py-3">
                <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <AgentInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          disabled={isStreaming}
        />
      </div>

      {/* Scaled preview via CookMode */}
      {cookModeRecipe && (
        <CookMode
          recipe={cookModeRecipe}
          initialScaleFactor={cookModeScale}
          onClose={() => setCookModeRecipe(null)}
        />
      )}
    </>
  )
}
