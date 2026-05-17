'use client'

import Link from 'next/link'
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
import { 
  LayoutDashboard, 
  Building2, 
  Handshake, 
  LogOut,
  Menu,
  X,
  User,
  ChevronDown
} from 'lucide-react'
import { useState } from 'react'

export function Navigation() {
  const pathname = usePathname()
  const { isAuthenticated, logout, user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Don't show navigation on auth pages or if not authenticated
  if (!isAuthenticated || pathname?.startsWith('/auth')) {
    return null
  }

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Brands',
      href: '/brands',
      icon: Building2,
    },
    {
      name: 'Collaborations',
      href: '/collaborations',
      icon: Handshake,
    },
  ]

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/')
  }

  const handleLogout = () => {
    logout()
    setMobileMenuOpen(false)
  }

  return (
    <>
      {/* Desktop Navigation - Enhanced with User Menu */}
      <nav className="hidden md:block glass-panel sticky top-4 z-50 mx-4 lg:mx-8 rounded-2xl mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="bg-primary text-white p-2 rounded-xl shadow-sm">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Collab Khata</span>
              </Link>
              <div className="flex gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                        isActive(item.href)
                          ? 'bg-primary text-white shadow-md shadow-primary/20'
                          : 'text-gray-600 hover:bg-primary/10 hover:text-primary'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
            
            {/* User Menu Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-10 rounded-full hover:bg-white/50">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-[150px] truncate">
                    {user?.email}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Account</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Mobile Top Navigation - Enhanced */}
      <nav className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="px-4">
          <div className="flex justify-between items-center h-14">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">Collab Khata</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 pb-3 bg-white/80 backdrop-blur-md">
            <div className="px-2 pt-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-colors min-h-[48px] ${
                      isActive(item.href)
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                )
              })}
              <div className="border-t border-gray-200 mt-2 pt-2">
                <div className="px-4 py-2">
                  <p className="text-xs text-gray-500 mb-1">Signed in as</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 active:bg-red-100 w-full transition-colors min-h-[48px]"
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Bottom Navigation for Mobile - Enhanced with larger touch targets */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 glass-panel rounded-2xl z-50 shadow-2xl safe-area-inset-bottom">
        <div className="grid grid-cols-3 gap-1 px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all min-h-[56px] ${
                  active
                    ? 'bg-primary/10 text-primary scale-105'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 active:scale-95'
                }`}
                aria-label={item.name}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className={`h-6 w-6 ${active ? 'text-primary' : 'text-gray-500'}`} />
                <span className={`text-xs font-semibold ${active ? 'text-primary' : 'text-gray-500'}`}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
