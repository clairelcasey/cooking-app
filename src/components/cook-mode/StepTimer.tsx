'use client'

import { useState, useEffect, useRef } from 'react'
import { Timer, Play, Pause, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StepTimerProps {
  durationMinutes: number
  onComplete: () => void
}

type TimerStatus = 'idle' | 'running' | 'paused' | 'done'

function playBeep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0)
    osc.start()
    osc.stop(ctx.currentTime + 1.0)
  } catch {
    // AudioContext not supported
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function StepTimer({ durationMinutes, onComplete }: StepTimerProps) {
  const total = durationMinutes * 60
  const [timeLeft, setTimeLeft] = useState(total)
  const [status, setStatus] = useState<TimerStatus>('idle')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  })

  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current!)
            setStatus('done')
            playBeep()
            // Small delay so the done state renders before advancing
            setTimeout(() => onCompleteRef.current(), 1200)
            return 0
          }
          return t - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [status])

  const progress = total > 0 ? (total - timeLeft) / total : 0
  const isDone = status === 'done'
  const circumference = 2 * Math.PI * 28 // radius 28

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/40 px-4 py-3">
      {/* Circular progress */}
      <div className="relative size-16 shrink-0">
        <svg className="size-16 -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-border"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            className={cn(
              'transition-all duration-1000',
              isDone ? 'text-green-500' : 'text-primary',
            )}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Timer
            className={cn('size-5', isDone ? 'text-green-500' : 'text-muted-foreground')}
          />
        </div>
      </div>

      {/* Time display */}
      <div className="flex-1">
        <div
          className={cn(
            'text-2xl font-mono font-semibold tabular-nums',
            isDone && 'text-green-600 dark:text-green-400',
          )}
        >
          {isDone ? 'Done!' : formatTime(timeLeft)}
        </div>
        <div className="text-xs text-muted-foreground">
          {durationMinutes} min timer
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {status === 'idle' && (
          <Button size="sm" onClick={() => setStatus('running')}>
            <Play className="size-3.5 mr-1" />
            Start
          </Button>
        )}
        {status === 'running' && (
          <>
            <Button size="sm" variant="outline" onClick={() => setStatus('paused')}>
              <Pause className="size-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setStatus('done')
                onCompleteRef.current()
              }}
            >
              <SkipForward className="size-3.5" />
            </Button>
          </>
        )}
        {status === 'paused' && (
          <>
            <Button size="sm" onClick={() => setStatus('running')}>
              <Play className="size-3.5 mr-1" />
              Resume
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setStatus('done')
                onCompleteRef.current()
              }}
            >
              <SkipForward className="size-3.5" />
            </Button>
          </>
        )}
        {isDone && (
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            Next up!
          </span>
        )}
      </div>
    </div>
  )
}
