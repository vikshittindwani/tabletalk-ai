"use client"

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Search, Plus, Minus, Star } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { VoiceButton } from '@/components/voice-button'
import { CartButton } from '@/components/cart-button'
import { StoreProvider, useStore, menuItems, MenuItem } from '@/lib/store'
import { cn } from '@/lib/utils'

const categories = [
  { id: 'all', label: 'All', emoji: '🍽️' },
  { id: 'Starters', label: 'Starters', emoji: '🍢' },
  { id: 'Mains', label: 'Mains', emoji: '🍕' },
  { id: 'Desserts', label: 'Desserts', emoji: '🍰' },
  { id: 'Drinks', label: 'Drinks', emoji: '🥤' },
]

const filters = [
  { id: 'all', label: 'All' },
  { id: 'veg', label: 'Veg' },
  { id: 'non-veg', label: 'Non-Veg' },
  { id: 'bestseller', label: 'Bestseller' },
  { id: 'under200', label: 'Under ₹200' },
]

function MenuItemCard({ item }: { item: MenuItem }) {
  const { cart, addToCart, updateQuantity } = useStore()
  const cartItem = cart.find(i => i.id === item.id)
  const quantity = cartItem?.quantity || 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      className="bg-card rounded-xl border border-border overflow-hidden transition-shadow hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="h-40 bg-muted flex items-center justify-center text-5xl relative overflow-hidden">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          item.emoji
        )}
        {/* Veg/Non-veg badge */}
        <span className={cn(
          "absolute top-3 left-3 px-2 py-0.5 rounded text-xs font-medium",
          item.isVeg ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"
        )}>
          {item.isVeg ? 'VEG' : 'NON-VEG'}
        </span>
        {item.isBestseller && (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-xs font-medium bg-primary text-primary-foreground">
            BESTSELLER
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground">{item.name}</h3>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {item.description}
        </p>

        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <Star className="w-4 h-4 fill-primary text-primary" />
          <span>{item.rating}</span>
          <span>({item.reviews} reviews)</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary">₹{item.price}</span>
          
          <AnimatePresence mode="wait">
            {quantity === 0 ? (
              <motion.button
                key="add"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                onClick={() => addToCart(item)}
                className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </motion.button>
            ) : (
              <motion.div
                key="stepper"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-2"
              >
                <button
                  onClick={() => updateQuantity(item.id, quantity - 1)}
                  className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-border transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-semibold w-6 text-center">{quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, quantity + 1)}
                  className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

function MenuPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      // Search filter
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Category filter
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false
      }

      // Other filters
      switch (activeFilter) {
        case 'veg':
          return item.isVeg
        case 'non-veg':
          return !item.isVeg
        case 'bestseller':
          return item.isBestseller
        case 'under200':
          return item.price < 200
        default:
          return true
      }
    })
  }, [searchQuery, activeCategory, activeFilter])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20 md:pt-24 pb-32 md:pb-16 px-4">
        <div className="container mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Our Menu</h1>
            <p className="text-muted-foreground">Explore our delicious offerings</p>
          </div>

          {/* Search and filters */}
          <div className="mb-6">
            {/* Search input */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-card rounded-xl border border-border focus:border-primary focus:outline-none"
              />
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-2">
              {filters.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                    activeFilter === filter.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border hover:bg-muted"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-8 -mx-4 px-4 scrollbar-hide">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all shrink-0",
                  activeCategory === category.id
                    ? "bg-primary/10 text-primary border-b-2 border-primary"
                    : "bg-card border border-border hover:bg-muted"
                )}
              >
                <span>{category.emoji}</span>
                <span className="font-medium">{category.label}</span>
              </button>
            ))}
          </div>

          {/* Menu grid */}
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredItems.map(item => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredItems.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No items found</p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setActiveCategory('all')
                  setActiveFilter('all')
                }}
                className="mt-4 text-primary hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </main>

      <VoiceButton />
      <CartButton />
    </div>
  )
}

export default function Menu() {
  return (
    <StoreProvider>
      <MenuPage />
    </StoreProvider>
  )
}
