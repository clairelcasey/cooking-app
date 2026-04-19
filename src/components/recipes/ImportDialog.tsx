'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Link2, Camera, FileText, Upload, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { ExtractedRecipe } from '@/lib/import/claude-extract'

export interface ImportReviewData {
  recipe: ExtractedRecipe
  image_url: string | null
  source_url: string | null
  method: 'url' | 'photo' | 'text'
}

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTab?: 'url' | 'photo' | 'text'
}

export function ImportDialog({ open, onOpenChange, initialTab = 'url' }: ImportDialogProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>(initialTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // URL tab
  const [url, setUrl] = useState('')

  // Photo tab
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Text tab
  const [pasteText, setPasteText] = useState('')

  function handlePhotoSelect(file: File) {
    setPhotoFile(file)
    const url = URL.createObjectURL(file)
    setPhotoPreview(url)
    setError(null)
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) {
      handlePhotoSelect(file)
    } else {
      setError('Please drop an image file.')
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handlePhotoSelect(file)
  }

  async function handleImport() {
    setError(null)
    setLoading(true)

    try {
      let result: { recipe: ExtractedRecipe; image_url?: string | null; source_url?: string | null }

      if (activeTab === 'url') {
        if (!url.trim()) { setError('Please enter a URL.'); setLoading(false); return }
        const res = await fetch('/api/import/url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim() }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'Import failed.')
          setLoading(false)
          return
        }
        result = data

      } else if (activeTab === 'photo') {
        if (!photoFile) { setError('Please select a photo.'); setLoading(false); return }
        const fd = new FormData()
        fd.append('file', photoFile)
        const res = await fetch('/api/import/photo', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'Import failed.')
          setLoading(false)
          return
        }
        result = data

      } else {
        if (!pasteText.trim() || pasteText.trim().length < 20) {
          setError('Please paste more recipe text.')
          setLoading(false)
          return
        }
        const res = await fetch('/api/import/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: pasteText }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'Import failed.')
          setLoading(false)
          return
        }
        result = data
      }

      // Store in sessionStorage and navigate to review
      const reviewData: ImportReviewData = {
        recipe: result.recipe,
        image_url: result.image_url ?? null,
        source_url: result.source_url ?? null,
        method: activeTab as 'url' | 'photo' | 'text',
      }
      sessionStorage.setItem('import_review', JSON.stringify(reviewData))
      onOpenChange(false)
      router.push('/recipes/import/review')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Reset state when dialog closes
  function handleOpenChange(open: boolean) {
    if (!open) {
      setUrl('')
      setPhotoFile(null)
      setPhotoPreview(null)
      setPasteText('')
      setError(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import a recipe</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="url" className="gap-1.5">
              <Link2 className="size-3.5" />
              URL
            </TabsTrigger>
            <TabsTrigger value="photo" className="gap-1.5">
              <Camera className="size-3.5" />
              Photo
            </TabsTrigger>
            <TabsTrigger value="text" className="gap-1.5">
              <FileText className="size-3.5" />
              Paste text
            </TabsTrigger>
          </TabsList>

          {/* URL tab */}
          <TabsContent value="url" className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="import-url">Recipe URL</Label>
              <Input
                id="import-url"
                type="url"
                placeholder="https://example.com/chocolate-cake"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleImport()}
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Paste any recipe URL — we&apos;ll fetch and extract it automatically.
            </p>
          </TabsContent>

          {/* Photo tab */}
          <TabsContent value="photo" className="space-y-3">
            <div
              className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
            >
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt="Recipe preview"
                  className="max-h-40 rounded-md object-contain"
                />
              ) : (
                <>
                  <Upload className="size-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Drop a photo here</p>
                    <p className="text-xs text-muted-foreground">or tap to upload</p>
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={handleFileInput}
                disabled={loading}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-1.5"
              onClick={() => {
                const el = document.createElement('input')
                el.type = 'file'
                el.accept = 'image/*'
                el.capture = 'environment'
                el.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) handlePhotoSelect(file)
                }
                el.click()
              }}
              disabled={loading}
            >
              <Camera className="size-3.5" />
              Use camera
            </Button>
          </TabsContent>

          {/* Paste text tab */}
          <TabsContent value="text" className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="import-text">Recipe text</Label>
              <Textarea
                id="import-text"
                placeholder="Paste the recipe here — ingredients, steps, and all..."
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={7}
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Useful for paywalled sites or emails. Just copy-paste the recipe content.
            </p>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p>{error}</p>
              {activeTab === 'url' && error.includes('URL') && (
                <button
                  className="mt-1 text-xs underline"
                  onClick={() => setActiveTab('text')}
                >
                  Switch to paste text instead
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 gap-1.5"
            onClick={handleImport}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Extracting…
              </>
            ) : (
              'Extract recipe'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
