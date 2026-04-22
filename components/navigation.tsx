"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, UtensilsCrossed, MapPin, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from './logo'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/track', label: 'Track', icon: MapPin },
  { href: '/admin', label: 'Admin', icon: LayoutDashboard },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="font-semibold text-lg">TableTalk AI</span>
          </Link>
          
          <div className="flex items-center gap-8">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm text-success">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              AI Online
            </span>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
