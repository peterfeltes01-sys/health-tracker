import { useState, useEffect, useRef } from 'react'
import type { FoodProduct } from '../types'
import { searchProducts } from '../lib/openFoodFacts'
import { useNutritionStore } from '../stores/nutritionStore'

export function useFoodSearch(query: string) {
  const [results, setResults] = useState<FoodProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [offError, setOffError] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const { customProducts, recentProducts } = useNutritionStore()

  useEffect(() => {
    const trimmed = query.trim()

    if (!trimmed) {
      // show recent + custom when no query
      const combined = [
        ...customProducts,
        ...recentProducts.filter((r) => !customProducts.some((c) => c.id === r.id)),
      ].slice(0, 20)
      setResults(combined)
      setLoading(false)
      return
    }

    const lower = trimmed.toLowerCase()
    const localMatches = [
      ...customProducts.filter((p) => p.name.toLowerCase().includes(lower)),
      ...recentProducts
        .filter((r) => r.name.toLowerCase().includes(lower) && !customProducts.some((c) => c.id === r.id))
    ]

    setResults(localMatches)
    setLoading(true)
    setOffError(false)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const timer = setTimeout(async () => {
      try {
        const offResults = await searchProducts(trimmed, controller.signal)
        const seen = new Set(localMatches.map((p) => p.id))
        const merged = [
          ...localMatches,
          ...offResults.filter((p) => !seen.has(p.id)),
        ]
        setResults(merged)
        setOffError(false)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setOffError(true)
        }
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, customProducts, recentProducts])

  return { results, loading, offError }
}
