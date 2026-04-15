'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number | null
  onChange?: (val: number) => void
  readOnly?: boolean
  size?: 'sm' | 'default'
}

export function StarRating({ value, onChange, readOnly = false, size = 'default' }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const displayed = hoverValue ?? value ?? 0
  const iconSize = size === 'sm' ? 'size-3.5' : 'size-4'

  return (
    <div
      className="flex items-center gap-0.5"
      onMouseLeave={() => !readOnly && setHoverValue(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            iconSize,
            'transition-colors',
            displayed >= star
              ? 'fill-amber-400 text-amber-400'
              : 'fill-transparent text-muted-foreground/40',
            !readOnly && 'cursor-pointer hover:text-amber-400'
          )}
          onMouseEnter={() => !readOnly && setHoverValue(star)}
          onClick={() => !readOnly && onChange?.(star)}
        />
      ))}
    </div>
  )
}
