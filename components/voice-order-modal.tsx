"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Check, Loader2, Mic, ShoppingBag, Square, X } from 'lucide-react'
import { menuItems, useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface VoiceOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onOrderComplete?: (transcript: string) => void
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'confirmed' | 'error'

interface ParsedOrder {
  items: Array<{ id: string; name: string; quantity: number; price: number }>
  total: number
  transcript: string
  confirmationText?: string
}

interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: { transcript: string }
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number
  results: SpeechRecognitionResultLike[]
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: Event & { error?: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
}

export function VoiceOrderModal({ isOpen, onClose, onOrderComplete }: VoiceOrderModalProps) {
  const { addItemsToCart } = useStore()
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const finalTranscriptRef = useRef('')
  const transcriptRef = useRef('')
  const recognitionErroredRef = useRef(false)
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [parsedOrder, setParsedOrder] = useState<ParsedOrder | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const confirmedCartItems = useMemo(() => {
    if (!parsedOrder) {
      return []
    }

    return parsedOrder.items
      .map(parsedItem => {
        const matched = menuItems.find(menuItem => menuItem.id === parsedItem.id)
        if (!matched) {
          return null
        }

        return {
          ...matched,
          quantity: parsedItem.quantity,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
  }, [parsedOrder])

  useEffect(() => {
    if (!isOpen) {
      recognitionRef.current?.stop()
      finalTranscriptRef.current = ''
      transcriptRef.current = ''
      recognitionErroredRef.current = false
      setVoiceState('idle')
      setTranscript('')
      setParsedOrder(null)
      setErrorMessage('')
    }
  }, [isOpen])

  const sendToGroq = async (text: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const response = await fetch(`${apiUrl}/api/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: text }),
    })

    if (!response.ok) {
      throw new Error('Unable to process voice order right now.')
    }

    const data: ParsedOrder = await response.json()
    if (!data.items || data.items.length === 0) {
      throw new Error('I heard you, but could not match any menu items.')
    }

    setParsedOrder(data)
    setVoiceState('confirmed')
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
  }

  const handleMicClick = () => {
    setParsedOrder(null)
    setErrorMessage('')
    setTranscript('')
    finalTranscriptRef.current = ''
    transcriptRef.current = ''
    recognitionErroredRef.current = false

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionCtor) {
      setVoiceState('error')
      setErrorMessage('This browser does not support voice recognition. Try Chrome or Edge.')
      return
    }

    const recognition = new SpeechRecognitionCtor()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-IN'
    recognitionRef.current = recognition

    recognition.onresult = event => {
      let interimTranscript = ''

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        const spokenText = result[0]?.transcript ?? ''

        if (result.isFinal) {
          finalTranscriptRef.current = `${finalTranscriptRef.current} ${spokenText}`.trim()
        } else {
          interimTranscript = `${interimTranscript} ${spokenText}`.trim()
        }
      }

      const nextTranscript = `${finalTranscriptRef.current} ${interimTranscript}`.trim()
      transcriptRef.current = nextTranscript
      setTranscript(nextTranscript)
    }

    recognition.onerror = event => {
      recognitionErroredRef.current = true
      setVoiceState('error')
      setErrorMessage(event.error === 'not-allowed'
        ? 'Microphone permission was blocked. Please allow mic access and try again.'
        : 'Voice capture failed. Please try again.')
    }

    recognition.onend = () => {
      if (recognitionErroredRef.current) {
        return
      }

      const spokenText = finalTranscriptRef.current.trim() || transcriptRef.current.trim()
      if (!spokenText) {
        setVoiceState('error')
        setErrorMessage('No speech detected. Try again and speak your order clearly.')
        return
      }

      setTranscript(spokenText)
      setVoiceState('processing')
      void sendToGroq(spokenText).catch(error => {
        setVoiceState('error')
        setErrorMessage(error instanceof Error ? error.message : 'Unable to confirm the order.')
      })
    }

    setVoiceState('listening')
    recognition.start()
  }

  const handleConfirmOrder = () => {
    if (confirmedCartItems.length === 0 || !parsedOrder) {
      return
    }

    addItemsToCart(confirmedCartItems)
    onOrderComplete?.(parsedOrder.transcript)
    onClose()
  }

  const getStatusText = () => {
    switch (voiceState) {
      case 'idle':
        return 'Tap the mic and say your order'
      case 'listening':
        return 'Listening now...'
      case 'processing':
        return 'Groq is confirming your order...'
      case 'confirmed':
        return 'Order understood. Review before adding to cart.'
      case 'error':
        return errorMessage || 'Something went wrong.'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-8"
            onClick={event => event.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                {voiceState === 'listening' && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary/30"
                      animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary/20"
                      animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                    />
                  </>
                )}

                <button
                  onClick={voiceState === 'listening' ? stopListening : handleMicClick}
                  disabled={voiceState === 'processing'}
                  className={cn(
                    'relative flex h-24 w-24 items-center justify-center rounded-full transition-all duration-300',
                    voiceState === 'idle' && 'bg-primary hover:bg-primary/90',
                    voiceState === 'listening' && 'bg-destructive hover:bg-destructive/90',
                    voiceState === 'processing' && 'bg-secondary',
                    voiceState === 'confirmed' && 'bg-success hover:bg-success/90',
                    voiceState === 'error' && 'bg-destructive/90 hover:bg-destructive'
                  )}
                >
                  {voiceState === 'processing' ? (
                    <Loader2 className="h-10 w-10 animate-spin text-white" />
                  ) : voiceState === 'listening' ? (
                    <Square className="h-8 w-8 fill-white text-white" />
                  ) : voiceState === 'confirmed' ? (
                    <Check className="h-10 w-10 text-white" />
                  ) : voiceState === 'error' ? (
                    <AlertCircle className="h-10 w-10 text-white" />
                  ) : (
                    <Mic className="h-10 w-10 text-primary-foreground" />
                  )}
                </button>
              </div>

              <p className={cn(
                'text-center text-lg font-medium',
                voiceState === 'confirmed' ? 'text-success' : 'text-foreground',
                voiceState === 'error' && 'text-destructive'
              )}>
                {getStatusText()}
              </p>

              {voiceState === 'listening' && (
                <div className="flex h-8 items-center justify-center gap-1">
                  {[...Array(5)].map((_, index) => (
                    <motion.div
                      key={index}
                      className="w-1 rounded-full bg-primary"
                      animate={{ height: [8, 28, 8] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: index * 0.08 }}
                    />
                  ))}
                </div>
              )}

              {transcript && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full rounded-xl bg-muted p-4"
                >
                  <p className="mb-1 text-sm text-muted-foreground">What we heard</p>
                  <p className="text-foreground">{transcript}</p>
                </motion.div>
              )}

              {parsedOrder && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full rounded-xl border border-success/30 bg-success/5 p-4"
                >
                  <div className="mb-3 flex items-center gap-2 text-success">
                    <ShoppingBag className="h-4 w-4" />
                    <p className="font-medium">Groq confirmation</p>
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {parsedOrder.confirmationText || 'I found these items from your voice order.'}
                  </p>
                  <div className="space-y-2">
                    {confirmedCartItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between rounded-lg bg-background/70 px-3 py-2">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty {item.quantity} x Rs.{item.price}
                          </p>
                        </div>
                        <p className="font-semibold text-primary">Rs.{item.price * item.quantity}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-sm text-muted-foreground">Total with tax</span>
                    <span className="text-lg font-semibold text-primary">Rs.{parsedOrder.total.toFixed(2)}</span>
                  </div>
                </motion.div>
              )}

              <div className="flex w-full flex-col gap-3">
                {voiceState === 'confirmed' ? (
                  <>
                    <button
                      onClick={handleConfirmOrder}
                      disabled={confirmedCartItems.length === 0}
                      className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Add to cart
                    </button>
                    <button
                      onClick={handleMicClick}
                      className="w-full rounded-xl border border-border py-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      Try again
                    </button>
                  </>
                ) : (
                  <button
                    onClick={voiceState === 'listening' ? stopListening : handleMicClick}
                    disabled={voiceState === 'processing'}
                    className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {voiceState === 'listening' ? 'Stop listening' : 'Start voice order'}
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
