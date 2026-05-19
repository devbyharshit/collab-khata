'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User, Search, Bell } from 'lucide-react'

export function TopHeader() {
  const pathname = usePathname()
  const { isAuthenticated, logout, user } = useAuth()

  // Don't show header on auth pages or if not authenticated
  if (!isAuthenticated || pathname?.startsWith('/auth')) {
    return null
  }

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard'
    if (pathname === '/brands') return 'Brands'
    if (pathname === '/collaborations') return 'Collaborations'
    if (pathname?.startsWith('/collaborations/')) return 'Collaboration Details'
    return ''
  }

  return (
    <header className="hidden md:flex w-full sticky top-0 bg-background/80 backdrop-blur-md z-40 border-b border-white/40 py-4">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-end">
        <div className="flex items-center gap-6 w-full justify-between">
        {/* Wide Search Bar */}
        <div className="relative w-full max-w-md hidden lg:block">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full h-12 pl-10 pr-14 border-none rounded-full bg-white shadow-sm text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
            placeholder="Search task, brand, or colla..."
          />
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">⌘F</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative flex items-center justify-center h-10 w-10 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 h-12 rounded-full hover:bg-white/50 px-2">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-gray-900 leading-none">
                    {user?.email?.split('@')[0] || 'User'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    {user?.email}
                  </span>
                </div>
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary shrink-0">
                  <User className="h-5 w-5" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-soft-lg border-none p-2">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none">My Account</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer rounded-xl py-3 mt-1">
                <LogOut className="h-4 w-4 mr-2" />
                <span className="font-semibold">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      </div>
    </header>
  )
}
