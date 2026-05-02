"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Clock, ChefHat, PackageCheck, CircleDot, CreditCard, Search } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { VoiceButton } from '@/components/voice-button'
import { StoreProvider, useStore, Order } from '@/lib/store'
import { cn } from '@/lib/utils'

const statusSteps = [
  { status: 'pending', label: 'Order Received', icon: Check },
  { status: 'confirmed', label: 'Confirmed by Kitchen', icon: ChefHat },
  { status: 'preparing', label: 'Being Prepared', icon: Clock },
  { status: 'ready', label: 'Ready for Pickup', icon: PackageCheck },
  { status: 'completed', label: 'Completed', icon: CircleDot },
]

function getStatusIndex(status: Order['status']) {
  switch (status) {
    case 'pending': return 1
    case 'preparing': return 2
    case 'ready': return 3
    case 'completed': return 4
    default: return 0
  }
}

function CountdownTimer({ minutes }: { minutes: number }) {
  const [timeLeft, setTimeLeft] = useState(minutes * 60)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1))
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  
  return (
    <span className="text-4xl md:text-5xl font-bold text-primary font-mono">
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </span>
  )
}

function TrackPage() {
  const { currentOrder, orders: storeOrders } = useStore()
  const [orderNumber, setOrderNumber] = useState('')
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null)
  const [apiOrders, setApiOrders] = useState<Order[]>([])
  const [loadedFromApi, setLoadedFromApi] = useState(false)
  
  useEffect(() => {
    const requestedOrderNumber = new URLSearchParams(window.location.search).get('order')
    if (requestedOrderNumber) {
      setOrderNumber(requestedOrderNumber)
    }

    const savedOrder = window.sessionStorage.getItem('tabletalk_last_order')
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder) as Order & { timestamp: string }
        if (!requestedOrderNumber || String(parsed.orderNumber) === requestedOrderNumber) {
          setSearchedOrder({ ...parsed, timestamp: new Date(parsed.timestamp) })
        }
      } catch {}
    }

    fetch('/api/orders')
      .then(r => r.json())
      .then(data => {
        if (data.orders && Array.isArray(data.orders)) {
          const normalized: Order[] = data.orders.map((o: Record<string, unknown>) => ({
            id: o.id as string,
            orderNumber: o.orderNumber as number,
            customerName: o.customerName as string,
            items: o.items as Order['items'],
            total: o.total as number,
            status: o.status as Order['status'],
            timestamp: new Date(o.timestamp as string),
            estimatedTime: o.estimatedTime as number,
          }))
          setApiOrders(normalized)
          setLoadedFromApi(true)

          if (requestedOrderNumber) {
            const parsedOrderNumber = parseInt(requestedOrderNumber, 10)
            const found = normalized.find(o => o.orderNumber === parsedOrderNumber)
            if (found) {
              setSearchedOrder(found)
            }
          }
        }
      })
      .catch(() => {})
  }, [])

  const orders = loadedFromApi ? apiOrders : storeOrders
  
  const displayOrder = searchedOrder || currentOrder

  const handleSearch = () => {
    const parsedOrderNumber = parseInt(orderNumber, 10)
    if (Number.isNaN(parsedOrderNumber)) {
      setSearchedOrder(null)
      return
    }

    const found = orders.find(o => o.orderNumber === parsedOrderNumber)
    setSearchedOrder(found || null)
  }

  const statusIndex = displayOrder ? getStatusIndex(displayOrder.status) : 0
  const progress = (statusIndex / 4) * 100

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20 md:pt-24 pb-32 md:pb-16 px-4">
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Track Your Order</h1>
            <p className="text-muted-foreground">Real-time updates on your order status</p>
          </div>

          {/* Order number search */}
          <div className="mb-8">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="number"
                  placeholder="Enter order number (e.g., 1042)"
                  value={orderNumber}
                  onChange={e => setOrderNumber(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleSearch()
                    }
                  }}
                  className="w-full pl-12 pr-4 py-3 bg-card rounded-xl border border-border focus:border-primary focus:outline-none"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors"
              >
                Track
              </button>
            </div>
          </div>

          {displayOrder ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Order info card */}
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Order Number</p>
                    <p className="text-3xl font-bold text-primary">#{displayOrder.orderNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-sm">Customer</p>
                    <p className="font-semibold">{displayOrder.customerName}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Placed at {displayOrder.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Estimated time */}
              {displayOrder.status !== 'completed' && displayOrder.status !== 'ready' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card rounded-xl border border-border p-6 text-center"
                >
                  <p className="text-muted-foreground mb-2">Your order will be ready in</p>
                  <CountdownTimer minutes={displayOrder.estimatedTime} />
                  
                  {/* Progress bar */}
                  <div className="mt-6">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Status timeline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-xl border border-border p-6"
              >
                <h3 className="font-semibold mb-6">Order Status</h3>
                
                <div className="space-y-0">
                  {statusSteps.map((step, index) => {
                    const isCompleted = index < statusIndex
                    const isCurrent = index === statusIndex
                    const Icon = step.icon
                    
                    return (
                      <div key={step.status} className="flex gap-4">
                        {/* Icon and line */}
                        <div className="flex flex-col items-center">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                              isCompleted && "bg-success text-success-foreground",
                              isCurrent && "bg-primary text-primary-foreground",
                              !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                            )}
                          >
                            {isCurrent && displayOrder.status === 'preparing' ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                              >
                                <Icon className="w-5 h-5" />
                              </motion.div>
                            ) : (
                              <Icon className="w-5 h-5" />
                            )}
                          </motion.div>
                          {index < statusSteps.length - 1 && (
                            <div className={cn(
                              "w-0.5 h-12",
                              isCompleted ? "bg-success" : "bg-muted"
                            )} />
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="pb-8">
                          <p className={cn(
                            "font-medium",
                            (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {step.label}
                          </p>
                          {isCompleted && (
                            <p className="text-sm text-success">
                              {new Date(displayOrder.timestamp.getTime() + index * 2 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                          {isCurrent && (
                            <p className="text-sm text-primary flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                              In progress
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>

              {/* Order summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-xl border border-border p-6"
              >
                <h3 className="font-semibold mb-4">Order Summary</h3>
                
                <div className="space-y-3">
                  {displayOrder.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.emoji}</span>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-semibold">₹{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">₹{displayOrder.total.toFixed(0)}</span>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="w-4 h-4" />
                  <span>Payment: Cash on Delivery</span>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <PackageCheck className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No active orders</h3>
              <p className="text-muted-foreground mb-4">
                Enter your order number above or place a new order
              </p>
              <a
                href="/menu"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors"
              >
                Browse Menu
              </a>
            </motion.div>
          )}
        </div>
      </main>

      <VoiceButton />
    </div>
  )
}

export default function Track() {
  return (
    <StoreProvider>
      <TrackPage />
    </StoreProvider>
  )
}
