'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, ArrowLeft } from 'lucide-react'
import { RecipeForm } from '@/components/recipes/RecipeForm'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { extractedToFormValues } from '@/lib/import/claude-extract'
import type { ImportReviewData } from '@/components/recipes/ImportDialog'
import type { RecipeFormValues } from '@/lib/validations/recipe'

export default function ImportReviewPage() {
  const router = useRouter()
  const [data, setData] = useState<ImportReviewData | null>(null)
  const [prefill, setPrefill] = useState<Partial<RecipeFormValues> | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('import_review')
    if (!raw) {
      router.replace('/recipes')
      return
    }
    try {
      const parsed: ImportReviewData = JSON.parse(raw)
      setData(parsed)
      const formValues = extractedToFormValues(parsed.recipe)
      // Pre-fill source_url for URL imports
      if (parsed.method === 'url' && parsed.source_url) {
        formValues.source_url = parsed.source_url
      }
      setPrefill(formValues)
    } catch {
      sessionStorage.removeItem('import_review')
      router.replace('/recipes')
    }
    setReady(true)
  }, [router])

  if (!ready || !data || !prefill) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const hasSource = data.image_url || data.source_url

  // Source pane content (reused in both layouts)
  const sourcePaneContent = (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Original source
      </p>

      {data.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.image_url}
          alt="Recipe source"
          className="w-full rounded-lg object-cover"
          style={{ maxHeight: '260px' }}
        />
      )}

      {data.source_url && (
        <a
          href={data.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 break-all text-xs text-primary hover:underline"
        >
          <ExternalLink className="size-3 shrink-0" />
          {data.source_url}
        </a>
      )}

      {data.method === 'photo' && !data.image_url && (
        <p className="text-sm text-muted-foreground">Photo imported</p>
      )}

      {data.method === 'text' && (
        <p className="text-sm text-muted-foreground">Imported from pasted text</p>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => {
              sessionStorage.removeItem('import_review')
              router.push('/recipes')
            }}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <h1 className="text-base font-semibold">Review imported recipe</h1>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Desktop: side-by-side */}
        {hasSource && (
          <div className="hidden md:grid md:grid-cols-[280px_1fr] md:gap-8">
            {/* Source pane */}
            <aside className="sticky top-6 self-start rounded-xl border border-border bg-card p-4">
              {sourcePaneContent}
            </aside>

            {/* Form pane */}
            <div>
              <RecipeForm
                prefill={prefill}
                existingImageUrl={data.image_url ?? undefined}
              />
            </div>
          </div>
        )}

        {/* Desktop: no source (text import with no image) */}
        {!hasSource && (
          <div className="hidden md:block">
            <RecipeForm
              prefill={prefill}
              existingImageUrl={undefined}
            />
          </div>
        )}

        {/* Mobile: tabs */}
        <div className={hasSource ? 'md:hidden' : ''}>
          {hasSource ? (
            <Tabs defaultValue="form">
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="source">Source</TabsTrigger>
                <TabsTrigger value="form">Edit recipe</TabsTrigger>
              </TabsList>
              <TabsContent value="source">
                <div className="rounded-xl border border-border bg-card p-4">
                  {sourcePaneContent}
                </div>
              </TabsContent>
              <TabsContent value="form">
                <RecipeForm
                  prefill={prefill}
                  existingImageUrl={data.image_url ?? undefined}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <RecipeForm prefill={prefill} existingImageUrl={undefined} />
          )}
        </div>
      </div>
    </div>
  )
}
