import type { NutritionFacts } from '../types'

function r0(v: number): number { return Math.round(v) }
function r1(v: number): number { return Math.round(v * 10) / 10 }
function r2(v: number): number { return Math.round(v * 100) / 100 }

export function computeForAmount(per100g: NutritionFacts, grams: number): NutritionFacts {
  const f = grams / 100
  return {
    kcal: r0(per100g.kcal * f),
    carbs: r1(per100g.carbs * f),
    sugars: per100g.sugars != null ? r1(per100g.sugars * f) : undefined,
    fat: r1(per100g.fat * f),
    satFat: r1(per100g.satFat * f),
    protein: r1(per100g.protein * f),
    fiber: per100g.fiber != null ? r1(per100g.fiber * f) : undefined,
    salt: per100g.salt != null ? r2(per100g.salt * f) : undefined,
  }
}

export function sumNutrition(items: NutritionFacts[]): NutritionFacts {
  const result: NutritionFacts = {
    kcal: 0,
    carbs: 0,
    fat: 0,
    satFat: 0,
    protein: 0,
  }
  for (const item of items) {
    result.kcal = r0(result.kcal + item.kcal)
    result.carbs = r1(result.carbs + item.carbs)
    result.fat = r1(result.fat + item.fat)
    result.satFat = r1(result.satFat + item.satFat)
    result.protein = r1(result.protein + item.protein)
    if (item.sugars != null) result.sugars = r1((result.sugars ?? 0) + item.sugars)
    if (item.fiber != null) result.fiber = r1((result.fiber ?? 0) + item.fiber)
    if (item.salt != null) result.salt = r2((result.salt ?? 0) + item.salt)
  }
  return result
}

export function movingAverage(values: number[], window: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < window - 1) return null
    const slice = values.slice(i - window + 1, i + 1)
    return r1(slice.reduce((a, b) => a + b, 0) / window)
  })
}

export const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Frühstück',
  lunch: 'Mittagessen',
  dinner: 'Abendessen',
  snack: 'Snack',
}

export const MEAL_TYPE_ICONS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
}
