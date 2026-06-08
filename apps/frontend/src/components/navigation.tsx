'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { 
  LayoutDashboard, 
  Building2, 
  Handshake, 
  LogOut,
  Menu,
  X,
  Settings,
  HelpCircle
} from 'lucide-react'
import { useState } from 'react'

export function Navigation() {
  const pathname = usePathname()
  const { isAuthenticated, logout, user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!isAuthenticated || pathname?.startsWith('/auth')) {
    return null
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Brands', href: '/brands', icon: Building2 },
    { name: 'Collaborations', href: '/collaborations', icon: Handshake },
  ]

  const generalItems = [
    { name: 'Settings', href: '#', icon: Settings },
    { name: 'Help', href: '#', icon: HelpCircle },
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
      {/* Desktop Sidebar Navigation */}
      <nav className="hidden md:flex flex-col w-[260px] h-screen bg-white border-r border-gray-100 shadow-[2px_0_15px_rgba(0,0,0,0.02)] z-50 flex-shrink-0">
        
        {/* Logo Area */}
        <div className="h-24 flex items-center px-8">
          <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="bg-primary text-white p-2 rounded-xl">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight leading-none">Collab<br/>Khata</span>
          </Link>
        </div>

        {/* Main Menu */}
        <div className="px-6 py-4 flex-1 flex flex-col gap-8">
          <div>
            <p className="px-4 text-xs font-semibold text-gray-400 mb-4 tracking-wider">MENU</p>
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 relative ${
                      active
                        ? 'text-primary bg-primary/5'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                    )}
                    <Icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-gray-400'}`} />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          <div>
            <p className="px-4 text-xs font-semibold text-gray-400 mb-4 tracking-wider">GENERAL</p>
            <div className="flex flex-col gap-2">
              {generalItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all duration-300"
                  >
                    <Icon className="h-5 w-5 text-gray-400" />
                    {item.name}
                  </Link>
                )
              })}
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-300 w-full text-left"
              >
                <LogOut className="h-5 w-5 text-gray-400 group-hover:text-red-600" />
                Logout
              </button>
            </div>
          </div>
          
          {user?.email && (
            <div className="mt-auto pb-4 border-t border-gray-100 pt-4">
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-50">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {user.email}
                  </span>
                  <span className="text-xs text-gray-500">Creator</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Top Navigation (Kept similar but cleaner) */}
      <nav className="md:hidden bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-soft border-b border-gray-100">
        <div className="px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="bg-primary text-white p-1.5 rounded-lg">
                <LayoutDashboard className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-gray-900">Collab Khata</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-gray-100 pb-3 bg-white absolute w-full shadow-soft-lg rounded-b-2xl">
            <div className="px-4 pt-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary/5 text-primary'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 w-full"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-white rounded-3xl z-50 shadow-soft-lg border border-gray-100 safe-area-inset-bottom">
        <div className="grid grid-cols-3 gap-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-2xl transition-all min-h-[56px] ${
                  active ? 'bg-primary/5 text-primary' : 'text-gray-400 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-gray-400'}`} />
                <span className="text-[10px] font-bold">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
