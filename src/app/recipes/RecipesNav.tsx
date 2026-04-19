'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChefHat, CalendarDays, Plus, LogOut, Link2, Camera, FileText, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/auth/actions'
import { ImportDialog } from '@/components/recipes/ImportDialog'

export function RecipesNav() {
  const pathname = usePathname()
  const router = useRouter()
  const isNew = pathname === '/recipes/new'
  const isImportReview = pathname === '/recipes/import/review'

  const [menuOpen, setMenuOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importTab, setImportTab] = useState<'url' | 'photo' | 'text'>('url')

  function openImport(tab: 'url' | 'photo' | 'text') {
    setImportTab(tab)
    setImportOpen(true)
    setMenuOpen(false)
  }

  const hideAddButton = isNew || isImportReview

  return (
    <>
      <header className="relative z-30 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          {/* Left: nav links */}
          <nav className="flex items-center gap-4">
            <Link
              href="/recipes"
              className={cn(
                'flex items-center gap-2 font-semibold transition-colors hover:text-primary',
                pathname.startsWith('/recipes') ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <ChefHat className="size-5" />
              <span className="hidden sm:inline">My Recipes</span>
            </Link>

            <Link
              href="/planner"
              className={cn(
                'flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary',
                pathname.startsWith('/planner') ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <CalendarDays className="size-4" />
              <span className="hidden sm:inline">Planner</span>
            </Link>
          </nav>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            {!hideAddButton && (
              <div className="relative">
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Add recipe</span>
                </Button>

                {menuOpen && (
                  <>
                    {/* Backdrop to close menu */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-md">
                      <button
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent"
                        onClick={() => { setMenuOpen(false); router.push('/recipes/new') }}
                      >
                        <PenLine className="size-4 text-muted-foreground" />
                        Enter manually
                      </button>
                      <div className="my-1 border-t border-border" />
                      <button
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent"
                        onClick={() => openImport('url')}
                      >
                        <Link2 className="size-4 text-muted-foreground" />
                        Import from URL
                      </button>
                      <button
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent"
                        onClick={() => openImport('photo')}
                      >
                        <Camera className="size-4 text-muted-foreground" />
                        Import from photo
                      </button>
                      <button
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent"
                        onClick={() => openImport('text')}
                      >
                        <FileText className="size-4 text-muted-foreground" />
                        Paste recipe text
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        initialTab={importTab}
      />
    </>
  )
}
