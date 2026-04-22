"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  isVeg: boolean
  isBestseller?: boolean
  rating: number
  reviews: number
  emoji: string
  image?: string
}

export interface CartItem extends MenuItem {
  quantity: number
}

export interface Order {
  id: string
  orderNumber: number
  customerName: string
  items: CartItem[]
  total: number
  status: 'pending' | 'preparing' | 'ready' | 'completed'
  timestamp: Date
  estimatedTime: number
}

interface StoreContextType {
  cart: CartItem[]
  orders: Order[]
  addToCart: (item: MenuItem) => void
  addItemsToCart: (items: CartItem[]) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
  getCartItemCount: () => number
  placeOrder: (customerName: string, backendId?: string, backendOrderNumber?: number) => Order
  updateOrderStatus: (orderId: string, status: Order['status']) => void
  currentOrder: Order | null
  setCurrentOrder: (order: Order | null) => void
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export const menuItems: MenuItem[] = [
  { id: '1', name: 'Paneer Tikka', description: 'Marinated cottage cheese grilled to perfection with Indian spices', price: 249, category: 'Starters', isVeg: true, isBestseller: true, rating: 4.7, reviews: 128, emoji: 'ðŸ§€', image: '/menu/paneer-tikka.png' },
  { id: '2', name: 'Veg Spring Rolls', description: 'Crispy rolls filled with fresh vegetables and Asian seasonings', price: 179, category: 'Starters', isVeg: true, rating: 4.3, reviews: 67, emoji: 'ðŸ¥¢',image :'/menu/veg-spring-rolls.png' },
  { id: '3', name: 'Chicken Wings', description: 'Juicy wings tossed in our signature spicy sauce', price: 299, category: 'Starters', isVeg: false, isBestseller: true, rating: 4.8, reviews: 215, emoji: 'ðŸ—' ,image :'/menu/chicken-wings.png'},
  { id: '4', name: 'Soup of the Day', description: 'Chef\'s special soup served with garlic bread', price: 149, category: 'Starters', isVeg: true, rating: 4.2, reviews: 45, emoji: 'ðŸ²',image :'/menu/Gemini_Generated_Image_rv6s4hrv6s4hrv6s.png' },
  { id: '5', name: 'Butter Chicken', description: 'Tender chicken in rich, creamy tomato-based curry', price: 399, category: 'Mains', isVeg: false, isBestseller: true, rating: 4.9, reviews: 342, emoji: 'ðŸ›' ,image :'/menu/Gemini_Generated_Image_ogtbmgogtbmgogtb.png'},
  { id: '6', name: 'Dal Makhani', description: 'Slow-cooked black lentils in a buttery gravy', price: 299, category: 'Mains', isVeg: true, rating: 4.6, reviews: 189, emoji: 'ðŸ«˜',image :'/menu/Gemini_Generated_Image_q278b5q278b5q278.png' },
  { id: '7', name: 'Margherita Pizza', description: 'Classic pizza with fresh mozzarella, tomatoes, and basil', price: 349, category: 'Mains', isVeg: true, rating: 4.5, reviews: 156, emoji: 'ðŸ•',image :'/menu/Gemini_Generated_Image_aqi32paqi32paqi3.png' },
  { id: '8', name: 'Paneer Butter Masala', description: 'Cottage cheese cubes in a rich, creamy tomato gravy', price: 329, category: 'Mains', isVeg: true, isBestseller: true, rating: 4.7, reviews: 267, emoji: 'ðŸ§ˆ' ,image :'/menu/chicken-wings.png'},
  { id: '9', name: 'Chicken Biryani', description: 'Fragrant basmati rice layered with spiced chicken', price: 449, category: 'Mains', isVeg: false, isBestseller: true, rating: 4.8, reviews: 398, emoji: 'ðŸš',image :'/menu/Gemini_Generated_Image_c35tzlc35tzlc35t.png' },
  { id: '10', name: 'Veg Fried Rice', description: 'Wok-tossed rice with fresh vegetables and soy sauce', price: 249, category: 'Mains', isVeg: true, rating: 4.3, reviews: 89, emoji: 'ðŸœ',image :'/menu/Gemini_Generated_Image_n1h2uwn1h2uwn1h2.png' },
  { id: '11', name: 'Gulab Jamun', description: 'Soft milk dumplings soaked in rose-flavored sugar syrup', price: 149, category: 'Desserts', isVeg: true, rating: 4.6, reviews: 134, emoji: 'ðŸ©',image :'/menu/Gemini_Generated_Image_dk77h5dk77h5dk77.png' },
  { id: '12', name: 'Chocolate Brownie', description: 'Warm, fudgy brownie served with vanilla ice cream', price: 199, category: 'Desserts', isVeg: true, isBestseller: true, rating: 4.8, reviews: 256, emoji: 'ðŸ«' ,image :'/menu/Gemini_Generated_Image_p4lfiip4lfiip4lf.png'},
  { id: '13', name: 'Kulfi', description: 'Traditional Indian ice cream with cardamom and pistachios', price: 129, category: 'Desserts', isVeg: true, rating: 4.4, reviews: 78, emoji: 'ðŸ¨',image :'/menu/Gemini_Generated_Image_uy673uuy673uuy67.png' },
  { id: '14', name: 'Mango Lassi', description: 'Refreshing yogurt-based mango smoothie', price: 129, category: 'Drinks', isVeg: true, isBestseller: true, rating: 4.7, reviews: 189, emoji: 'ðŸ¥­' ,image :'/menu/Gemini_Generated_Image_mrpacwmrpacwmrpa.png'},
  { id: '15', name: 'Cold Coffee', description: 'Chilled coffee blended with ice cream', price: 149, category: 'Drinks', isVeg: true, rating: 4.5, reviews: 145, emoji: 'â˜•' ,image :'/menu/Gemini_Generated_Image_mjkza1mjkza1mjkz.png'},
  { id: '16', name: 'Fresh Lime Soda', description: 'Tangy lime juice with soda water', price: 99, category: 'Drinks', isVeg: true, rating: 4.3, reviews: 67, emoji: 'ðŸ‹',image :'/menu/Gemini_Generated_Image_dn0zp0dn0zp0dn0z.png' },
  { id: '17', name: 'Masala Chai', description: 'Authentic Indian spiced tea', price: 59, category: 'Drinks', isVeg: true, rating: 4.6, reviews: 223, emoji: 'ðŸµ',image :'/menu/Gemini_Generated_Image_fglrmvfglrmvfglr.png' },
]

const sampleOrders: Order[] = [
  {
    id: 'ord-1',
    orderNumber: 1042,
    customerName: 'Rahul Sharma',
    items: [
      { ...menuItems[4], quantity: 1 },
      { ...menuItems[8], quantity: 2 },
      { ...menuItems[16], quantity: 2 },
    ],
    total: 1406,
    status: 'preparing',
    timestamp: new Date(Date.now() - 10 * 60000),
    estimatedTime: 15,
  },
  {
    id: 'ord-2',
    orderNumber: 1041,
    customerName: 'Priya Patel',
    items: [
      { ...menuItems[0], quantity: 1 },
      { ...menuItems[7], quantity: 1 },
      { ...menuItems[13], quantity: 1 },
    ],
    total: 707,
    status: 'ready',
    timestamp: new Date(Date.now() - 25 * 60000),
    estimatedTime: 20,
  },
  {
    id: 'ord-3',
    orderNumber: 1040,
    customerName: 'Amit Kumar',
    items: [
      { ...menuItems[6], quantity: 2 },
      { ...menuItems[14], quantity: 2 },
    ],
    total: 996,
    status: 'pending',
    timestamp: new Date(Date.now() - 5 * 60000),
    estimatedTime: 25,
  },
  {
    id: 'ord-4',
    orderNumber: 1039,
    customerName: 'Sneha Gupta',
    items: [
      { ...menuItems[2], quantity: 2 },
      { ...menuItems[4], quantity: 1 },
      { ...menuItems[11], quantity: 2 },
    ],
    total: 1395,
    status: 'pending',
    timestamp: new Date(Date.now() - 3 * 60000),
    estimatedTime: 30,
  },
  {
    id: 'ord-5',
    orderNumber: 1038,
    customerName: 'Vikram Singh',
    items: [
      { ...menuItems[5], quantity: 1 },
      { ...menuItems[9], quantity: 1 },
      { ...menuItems[16], quantity: 3 },
    ],
    total: 725,
    status: 'preparing',
    timestamp: new Date(Date.now() - 18 * 60000),
    estimatedTime: 20,
  },
  {
    id: 'ord-6',
    orderNumber: 1037,
    customerName: 'Neha Joshi',
    items: [
      { ...menuItems[1], quantity: 2 },
      { ...menuItems[12], quantity: 2 },
    ],
    total: 616,
    status: 'completed',
    timestamp: new Date(Date.now() - 45 * 60000),
    estimatedTime: 15,
  },
]

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<Order[]>(sampleOrders)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [orderCounter, setOrderCounter] = useState(1043)

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const addItemsToCart = (items: CartItem[]) => {
    setCart(prev => {
      const nextCart = [...prev]

      for (const item of items) {
        const existingIndex = nextCart.findIndex(cartItem => cartItem.id === item.id)
        if (existingIndex >= 0) {
          nextCart[existingIndex] = {
            ...nextCart[existingIndex],
            quantity: nextCart[existingIndex].quantity + item.quantity,
          }
        } else {
          nextCart.push({ ...item })
        }
      }

      return nextCart
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
    } else {
      setCart(prev =>
        prev.map(i => i.id === itemId ? { ...i, quantity } : i)
      )
    }
  }

  const clearCart = () => setCart([])

  const getCartTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const tax = subtotal * 0.05
    return subtotal + tax
  }

  const getCartItemCount = () => cart.reduce((sum, item) => sum + item.quantity, 0)

  const placeOrder = (customerName: string, backendId?: string, backendOrderNumber?: number): Order => {
    const newOrder: Order = {
      id: backendId ?? `ord-${Date.now()}`,
      orderNumber: backendOrderNumber ?? orderCounter,
      customerName,
      items: [...cart],
      total: getCartTotal(),
      status: 'pending',
      timestamp: new Date(),
      estimatedTime: 20,
    }
    setOrders(prev => [newOrder, ...prev])
    setOrderCounter(prev => prev + 1)
    setCurrentOrder(newOrder)
    clearCart()
    return newOrder
  }

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, status } : order
      )
    )
    if (currentOrder?.id === orderId) {
      setCurrentOrder(prev => prev ? { ...prev, status } : null)
    }
  }

  return (
    <StoreContext.Provider value={{
      cart,
      orders,
      addToCart,
      addItemsToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartItemCount,
      placeOrder,
      updateOrderStatus,
      currentOrder,
      setCurrentOrder,
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
