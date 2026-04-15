'use client'

import { useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  onFileChange: (file: File | null) => void
  existingUrl?: string | null
  className?: string
}

export function ImageUpload({ onFileChange, existingUrl, className }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingUrl ?? null)

  function handleFile(file: File) {
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    onFileChange(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) handleFile(file)
  }

  function handleRemove() {
    setPreviewUrl(null)
    onFileChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={cn('relative', className)}>
      {previewUrl ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Recipe preview"
            className="h-full w-full object-cover"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute right-2 top-2 bg-black/40 text-white hover:bg-black/60"
            onClick={handleRemove}
          >
            <X className="size-3.5" />
            <span className="sr-only">Remove image</span>
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-ring hover:bg-muted/50"
        >
          <ImagePlus className="size-8" />
          <span className="text-sm font-medium">Upload photo</span>
          <span className="text-xs">Drag & drop or click to browse</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleInputChange}
      />
    </div>
  )
}
