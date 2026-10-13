import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, Settings, Menu } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const { user, logout, isAuthenticated } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()

  const isRecognition = location.pathname === '/recognition' || location.pathname === '/'
  const isDatasetUpload = location.pathname.startsWith('/dataset-upload')

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/recognition" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <svg className="h-5 w-5 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>
            <span className="text-xl font-bold">Face Recognition Lab</span>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-6">
          <Link
            to="/recognition"
            className={`text-sm font-semibold transition-colors ${
              isRecognition
                ? 'text-emerald-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Live Recognition
          </Link>
          <Link
            to="/dataset-upload"
            className={`text-sm font-medium transition-colors ${
              isDatasetUpload
                ? 'text-emerald-600 font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Dataset Upload
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {isAuthenticated && (
            <div className="relative">
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <Avatar>
                  <AvatarImage src={user?.email} alt={user?.email || 'User'} />
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md bg-popover p-1 shadow-lg border z-50">
                  <div className="px-2 py-1">
                    <p className="text-xs font-medium text-muted-foreground">{user?.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                  <hr className="my-1 border-muted" />
                  <button
                    onClick={() => window.location.href = '/settings'}
                    className="flex items-center gap-2 w-full px-2 py-1.5 text-sm hover:bg-accent rounded"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <button
                    onClick={() => logout()}
                    className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-destructive hover:bg-accent rounded"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t px-4 py-4 space-y-2">
          <Link
            to="/recognition"
            onClick={() => setMobileMenuOpen(false)}
            className={`block text-sm font-semibold ${
              isRecognition ? 'text-emerald-600' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Live Recognition
          </Link>
          <Link
            to="/dataset-upload"
            onClick={() => setMobileMenuOpen(false)}
            className={`block text-sm font-medium ${
              isDatasetUpload ? 'text-emerald-600 font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Dataset Upload
          </Link>
        </div>
      )}
    </header>
  )
}