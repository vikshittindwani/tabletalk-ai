"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Clock, DollarSign, ShoppingBag, AlertCircle, Play, CheckCircle, Check, Mic } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { StoreProvider, useStore, Order } from '@/lib/store'
import { cn } from '@/lib/utils'

const voiceOrderLogs = [
  { id: '1', transcript: "One butter chicken, two naan, and a mango lassi please", time: '12:45 PM' },
  { id: '2', transcript: "Can I get the paneer tikka and a masala chai", time: '12:38 PM' },
  { id: '3', transcript: "I'd like the chicken biryani with raita", time: '12:32 PM' },
  { id: '4', transcript: "Two plates of dal makhani and one gulab jamun", time: '12:25 PM' },
]

const popularItems = [
  { name: 'Butter Chicken', orders: 12, percentage: 100 },
  { name: 'Chicken Biryani', orders: 10, percentage: 83 },
  { name: 'Paneer Tikka', orders: 8, percentage: 67 },
  { name: 'Mango Lassi', orders: 7, percentage: 58 },
  { name: 'Dal Makhani', orders: 5, percentage: 42 },
]

function CountUpNumber({ end }: { end: number }) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    let start = 0
    const duration = 1500
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
  
  return <>{count.toLocaleString()}</>
}

function StatCard({ title, value, suffix, trend, trendLabel, icon: Icon, isAlert }: {
  title: string
  value: number
  suffix?: string
  trend?: number
  trendLabel?: string
  icon: React.ComponentType<{ className?: string }>
  isAlert?: boolean
}) {
  const isPositive = trend && trend > 0
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-card rounded-xl border p-6",
        isAlert ? "border-destructive" : "border-border"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          isAlert ? "bg-destructive/10" : "bg-primary/10"
        )}>
          <Icon className={cn("w-6 h-6", isAlert ? "text-destructive" : "text-primary")} />
        </div>
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            isPositive ? "text-success" : "text-destructive"
          )}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      
      <p className="text-3xl font-bold mb-1">
        <CountUpNumber end={value} />{suffix}
      </p>
      <p className="text-muted-foreground text-sm">{title}</p>
      {trendLabel && (
        <p className="text-xs text-muted-foreground mt-1">{trendLabel}</p>
      )}
    </motion.div>
  )
}

function StatusBadge({ status }: { status: Order['status'] }) {
  const config = {
    pending: { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-500' },
    preparing: { label: 'Preparing', className: 'bg-secondary/10 text-secondary' },
    ready: { label: 'Ready', className: 'bg-success/10 text-success' },
    completed: { label: 'Completed', className: 'bg-muted text-muted-foreground' },
  }
  
  const { label, className } = config[status]
  
  return (
    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", className)}>
      {label}
    </span>
  )
}

function AdminPage() {
  const { orders: storeOrders, updateOrderStatus: updateStoreStatus } = useStore()
  const [apiOrders, setApiOrders] = useState<Order[]>([])
  const [loadedFromApi, setLoadedFromApi] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)

    const loadOrders = async () => {
      try {
        const response = await fetch('/api/orders', { cache: 'no-store' })
        if (!response.ok) {
          return
        }
        const data = await response.json()

        if (Array.isArray(data.orders)) {
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
        }
      } catch {}
    }

    loadOrders()
    const intervalId = window.setInterval(loadOrders, 5000)

    return () => window.clearInterval(intervalId)
  }, [])

  const orders = loadedFromApi ? apiOrders : storeOrders

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    updateStoreStatus(orderId, status)
    if (loadedFromApi) {
      setApiOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    }
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    } catch {}
  }

  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing')
  const todayRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const avgPrepTime = 18

  const getNextAction = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return { label: 'Start Prep', nextStatus: 'preparing' as const, className: 'bg-secondary text-secondary-foreground' }
      case 'preparing':
        return { label: 'Mark Ready', nextStatus: 'ready' as const, className: 'bg-success text-success-foreground' }
      case 'ready':
        return { label: 'Complete', nextStatus: 'completed' as const, className: 'bg-muted text-foreground' }
      default:
        return null
    }
  }

  const getTimeSinceOrder = (timestamp: Date) => {
    if (!isHydrated) {
      return null
    }

    const diff = Date.now() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    return minutes
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20 md:pt-24 pb-8 px-4">
        <div className="container mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage orders and track performance</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Today's Orders"
              value={orders.length}
              trend={12}
              trendLabel="vs yesterday"
              icon={ShoppingBag}
            />
            <StatCard
              title="Revenue Today"
              value={18420}
              suffix=""
              icon={DollarSign}
            />
            <StatCard
              title="Avg Prep Time"
              value={avgPrepTime}
              suffix=" min"
              icon={Clock}
            />
            <StatCard
              title="Pending Now"
              value={pendingOrders.length}
              icon={AlertCircle}
              isAlert={pendingOrders.length > 5}
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Live orders table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden"
            >
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold">Live Orders</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Order #</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Customer</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Items</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Time</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 6).map(order => {
                      const action = getNextAction(order.status)
                      const waitTime = getTimeSinceOrder(order.timestamp)
                      const isLongWait = waitTime !== null && waitTime > 15 && order.status !== 'completed'
                      
                      return (
                        <tr 
                          key={order.id} 
                          className={cn(
                            "border-b border-border hover:bg-muted/30 transition-colors",
                            isLongWait && "border-l-4 border-l-primary"
                          )}
                        >
                          <td className="p-4 font-semibold">#{order.orderNumber}</td>
                          <td className="p-4">{order.customerName}</td>
                          <td className="p-4">
                            <span className="text-sm text-muted-foreground">
                              {order.items.map(i => i.name).join(', ').slice(0, 30)}...
                            </span>
                          </td>
                          <td className="p-4 font-semibold">₹{order.total.toFixed(0)}</td>
                          <td className="p-4">
                            <span className={cn(
                              "text-sm",
                              isLongWait ? "text-primary font-medium" : "text-muted-foreground"
                            )}>
                              {waitTime === null ? '--' : `${waitTime}m ago`}
                            </span>
                          </td>
                          <td className="p-4">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="p-4">
                            {action && (
                              <button
                                onClick={() => updateOrderStatus(order.id, action.nextStatus)}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:opacity-90",
                                  action.className
                                )}
                              >
                                {action.label}
                              </button>
                            )}
                            {order.status === 'completed' && (
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Check className="w-4 h-4" /> Done
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Popular items */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-xl border border-border p-4"
              >
                <h3 className="font-semibold mb-4">Popular Items Today</h3>
                <div className="space-y-3">
                  {popularItems.map((item, index) => (
                    <div key={item.name}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="truncate">{item.name}</span>
                        <span className="text-muted-foreground ml-2">{item.orders}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${item.percentage}%` }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Voice orders log */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card rounded-xl border border-border p-4"
              >
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Mic className="w-4 h-4 text-primary" />
                  Recent Voice Orders
                </h3>
                <div className="space-y-3">
                  {voiceOrderLogs.map(log => (
                    <div key={log.id} className="p-3 bg-muted rounded-lg">
                      <p className="text-sm mb-1">&quot;{log.transcript}&quot;</p>
                      <p className="text-xs text-muted-foreground">{log.time}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function Admin() {
  return (
    <StoreProvider>
      <AdminPage />
    </StoreProvider>
  )
}
