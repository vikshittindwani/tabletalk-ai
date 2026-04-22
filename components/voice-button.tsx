"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mic } from 'lucide-react'
import { VoiceOrderModal } from './voice-order-modal'
import { usePathname } from 'next/navigation'

export function VoiceButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const pathname = usePathname()

  // Don't show on admin page
  if (pathname === '/admin') return null

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 md:bottom-8 left-4 md:left-8 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30"
      >
        {/* Pulse rings */}
        <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
        <Mic className="w-6 h-6 relative z-10" />
      </motion.button>

      <VoiceOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
