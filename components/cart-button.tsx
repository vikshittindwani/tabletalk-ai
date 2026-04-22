"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { useStore } from '@/lib/store'
import { CartSidebar } from './cart-sidebar'
import { usePathname } from 'next/navigation'

export function CartButton() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { getCartItemCount, getCartTotal } = useStore()
  const pathname = usePathname()
  
  const itemCount = getCartItemCount()
  const total = getCartTotal()

  // Don't show on admin or track page
  if (pathname === '/admin' || pathname === '/track') return null
  if (itemCount === 0) return null

  return (
    <>
      <motion.button
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40 flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30"
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5" />
          <AnimatePresence>
            {itemCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center"
              >
                {itemCount}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <span className="font-semibold">₹{total.toFixed(0)}</span>
      </motion.button>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  )
}
