import { useMemo } from 'react'
import type { MealEntry, MealType } from '../types'

function hashComponents(meal: MealEntry): string {
  return meal.components
    .map((c) => c.productId)
    .sort()
    .join('|')
}

export function useMealSuggestions(
  recentMeals: MealEntry[],
  mealType: MealType
): MealEntry[] {
  return useMemo(() => {
    const byType = recentMeals
      .filter((m) => m.mealType === mealType && m.components.length > 0)
      .slice(-14)

    const groups = new Map<string, { meal: MealEntry; count: number; lastDate: string }>()
    for (const meal of byType) {
      const hash = hashComponents(meal)
      const existing = groups.get(hash)
      if (!existing || meal.date > existing.lastDate) {
        groups.set(hash, {
          meal,
          count: (existing?.count ?? 0) + 1,
          lastDate: meal.date,
        })
      } else {
        existing.count += 1
      }
    }

    return Array.from(groups.values())
      .sort((a, b) => b.count - a.count || b.lastDate.localeCompare(a.lastDate))
      .slice(0, 3)
      .map((g) => g.meal)
  }, [recentMeals, mealType])
}
