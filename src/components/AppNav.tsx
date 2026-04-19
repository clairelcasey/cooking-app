'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChefHat, CalendarDays, Plus, LogOut, Link2, Camera, FileText, PenLine, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/auth/actions'
import { ImportDialog } from '@/components/recipes/ImportDialog'

interface AppNavProps {
  userName?: string
  userAvatarUrl?: string
}

function getInitials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
}

export function AppNav({ userName, userAvatarUrl }: AppNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isNew = pathname === '/recipes/new'
  const isImportReview = pathname === '/recipes/import/review'

  const [menuOpen, setMenuOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importTab, setImportTab] = useState<'url' | 'photo' | 'text'>('url')

  function openImport(tab: 'url' | 'photo' | 'text') {
    setImportTab(tab)
    setImportOpen(true)
    setMenuOpen(false)
  }

  const hideAddButton = isNew || isImportReview
  const initials = getInitials(userName)

  return (
    <>
      <header className="relative z-30 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          {/* Left: nav links */}
          <nav className="flex items-center gap-6">
            <Link
              href="/recipes"
              className={cn(
                'flex items-center gap-2 pb-1 text-sm font-medium border-b-2 transition-colors hover:text-foreground',
                pathname.startsWith('/recipes')
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground'
              )}
            >
              <ChefHat className="size-4" />
              <span className="hidden sm:inline">My Recipes</span>
            </Link>

            <Link
              href="/planner"
              className={cn(
                'flex items-center gap-2 pb-1 text-sm font-medium border-b-2 transition-colors hover:text-foreground',
                pathname.startsWith('/planner')
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground'
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
                  className="gap-1.5 cursor-pointer"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Add recipe</span>
                </Button>

                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-md">
                      <button
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent cursor-pointer"
                        onClick={() => { setMenuOpen(false); router.push('/recipes/new') }}
                      >
                        <PenLine className="size-4 text-muted-foreground" />
                        Enter manually
                      </button>
                      <div className="my-1 border-t border-border" />
                      <button
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent cursor-pointer"
                        onClick={() => openImport('url')}
                      >
                        <Link2 className="size-4 text-muted-foreground" />
                        Import from URL
                      </button>
                      <button
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent cursor-pointer"
                        onClick={() => openImport('photo')}
                      >
                        <Camera className="size-4 text-muted-foreground" />
                        Import from photo
                      </button>
                      <button
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent cursor-pointer"
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

            {/* Avatar menu */}
            <div className="relative">
              <button
                onClick={() => setAvatarOpen((v) => !v)}
                className="flex items-center gap-1 rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Account menu"
              >
                <div className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {userAvatarUrl ? (
                    <Image
                      src={userAvatarUrl}
                      alt={userName ?? 'User avatar'}
                      width={32}
                      height={32}
                      className="size-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <ChevronDown className="size-3 text-muted-foreground" />
              </button>

              {avatarOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setAvatarOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-md">
                    {userName && (
                      <>
                        <p className="truncate px-3 py-1.5 text-xs text-muted-foreground">{userName}</p>
                        <div className="border-t border-border" />
                      </>
                    )}
                    <form action={signOut}>
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent cursor-pointer"
                        onClick={() => setAvatarOpen(false)}
                      >
                        <LogOut className="size-4 text-muted-foreground" />
                        Sign out
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
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
