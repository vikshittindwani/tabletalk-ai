"use client"

import { motion } from 'framer-motion'
import { Mic, Waves, Check, ArrowRight, Github } from 'lucide-react'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { VoiceButton } from '@/components/voice-button'
import { CartButton } from '@/components/cart-button'
import { StoreProvider } from '@/lib/store'
import { Logo } from '@/components/logo'
import { useEffect, useState } from 'react'

function CountUpNumber({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    let start = 0
    const duration = 2000
    const increment = end / (duration / 16)
    
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    
    return () => clearInterval(timer)
  }, [end])
  
  return <>{count}{suffix}</>
}

function PhoneMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="relative"
    >
      {/* Phone frame */}
      <div className="w-64 md:w-80 h-[500px] md:h-[600px] bg-card rounded-[3rem] border-4 border-border p-2 shadow-2xl">
        <div className="w-full h-full bg-background rounded-[2.5rem] overflow-hidden flex flex-col">
          {/* Status bar */}
          <div className="h-12 bg-card flex items-center justify-center">
            <div className="w-20 h-6 bg-border rounded-full" />
          </div>
          
          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
            {/* Waveform animation */}
            <div className="flex items-center justify-center gap-1.5 h-16">
              {[...Array(7)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 bg-primary rounded-full"
                  animate={{
                    height: [12, 40, 12],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
            
            {/* Mic button */}
            <motion.div
              className="w-20 h-20 rounded-full bg-primary flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Mic className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            
            <p className="text-muted-foreground text-sm">Listening...</p>
            
            {/* Transcript preview */}
            <div className="w-full p-3 bg-muted rounded-xl">
              <p className="text-xs text-muted-foreground mb-1">Order:</p>
              <motion.p
                className="text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                {"\"One butter chicken and naan...\""}
              </motion.p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating elements */}
      <motion.div
        className="absolute -top-4 -right-8 bg-success text-success-foreground px-3 py-1.5 rounded-full text-sm font-medium shadow-lg"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        ✓ Order Confirmed
      </motion.div>
      
      <motion.div
        className="absolute -bottom-4 -left-8 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full text-sm font-medium shadow-lg"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        🎙️ AI Listening
      </motion.div>
    </motion.div>
  )
}

function HomePage() {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-16 pb-32 md:pb-16 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
            {/* Left content */}
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border mb-6"
              >
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm text-muted-foreground">AI-Powered Voice Ordering</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance"
              >
                Your Restaurant&apos;s{' '}
                <span className="text-primary">AI Waiter</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0"
              >
                Customers order by voice. Zero wait time. Zero missed orders.
              </motion.p>
              
              {/* Feature pills */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-8"
              >
                <span className="px-4 py-2 bg-card rounded-full border border-border text-sm">
                  🎙️ Voice Ordering
                </span>
                <span className="px-4 py-2 bg-card rounded-full border border-border text-sm">
                  ⚡ Instant Confirmation
                </span>
                <span className="px-4 py-2 bg-card rounded-full border border-border text-sm">
                  📊 Live Dashboard
                </span>
              </motion.div>
              
              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              >
                <Link
                  href="/menu"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Try Voice Ordering
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/menu"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-xl hover:bg-card transition-colors"
                >
                  View Menu
                </Link>
              </motion.div>
            </div>
            
            {/* Right content - Phone mockup */}
            <div className="flex-shrink-0 hidden md:block">
              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center mb-16"
          >
            How It Works
          </motion.h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Mic, title: 'Tap the mic', color: 'bg-secondary', step: 1 },
              { icon: Waves, title: 'Speak your order', color: 'bg-primary', step: 2 },
              { icon: Check, title: 'AI confirms + saves', color: 'bg-success', step: 3 },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <div className="relative mb-4">
                  <div className={`w-20 h-20 ${item.color} rounded-full flex items-center justify-center`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center font-bold text-sm">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-semibold">{item.title}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Stats Bar */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-2xl border border-border p-8 md:p-12"
          >
            <div className="grid md:grid-cols-3 gap-8 text-center">
              {isVisible && (
                <>
                  <div>
                    <p className="text-4xl md:text-5xl font-bold text-primary mb-2">
                      {'< '}<CountUpNumber end={2} />s
                    </p>
                    <p className="text-muted-foreground">Response Time</p>
                  </div>
                  <div>
                    <p className="text-4xl md:text-5xl font-bold text-primary mb-2">
                      <CountUpNumber end={99} />%
                    </p>
                    <p className="text-muted-foreground">Order Accuracy</p>
                  </div>
                  <div>
                    <p className="text-4xl md:text-5xl font-bold text-primary mb-2">
                      24/7
                    </p>
                    <p className="text-muted-foreground">Always Available</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo className="w-6 h-6" />
            <span className="text-muted-foreground text-sm">Powered by Groq + Sarvam AI</span>
          </div>
          <p className="text-muted-foreground text-sm">Built by Vikshit Tindwani</p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="w-5 h-5" />
            <span className="text-sm">GitHub</span>
          </a>
        </div>
      </footer>
      
      <VoiceButton />
      <CartButton />
    </div>
  )
}

export default function Home() {
  return (
    <StoreProvider>
      <HomePage />
    </StoreProvider>
  )
}
