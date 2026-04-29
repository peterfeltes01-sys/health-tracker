import { repository } from '../repositories/LocalStorageRepository'
import type { StepEntry, Activity, HydrationEntry, FoodProduct, MealEntry, WeightEntry, BloodPressureEntry } from '../types'
import { generateId } from './calculations'
import { computeForAmount, sumNutrition } from '../lib/nutritionMath'
import { classifyBP } from '../lib/bloodPressure'

function dateStr(daysAgo: number): string {
  const d = new Date('2026-04-29')
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

function ts(daysAgo: number, hour: number): string {
  const d = new Date('2026-04-29')
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

const seedSteps: StepEntry[] = [
  { id: generateId(), date: dateStr(7), steps: 8420, timestamp: ts(7, 18), source: 'manual' },
  { id: generateId(), date: dateStr(6), steps: 11250, timestamp: ts(6, 19), source: 'manual' },
  { id: generateId(), date: dateStr(5), steps: 6800, timestamp: ts(5, 17), source: 'manual' },
  { id: generateId(), date: dateStr(4), steps: 14200, timestamp: ts(4, 20), source: 'manual' },
  { id: generateId(), date: dateStr(3), steps: 9100, timestamp: ts(3, 18), source: 'manual' },
  { id: generateId(), date: dateStr(2), steps: 12500, timestamp: ts(2, 19), source: 'manual' },
  { id: generateId(), date: dateStr(1), steps: 7300, timestamp: ts(1, 17), source: 'manual' },
  { id: generateId(), date: dateStr(0), steps: 3200, timestamp: ts(0, 10), source: 'manual' },
  { id: generateId(), date: dateStr(0), steps: 500, timestamp: ts(0, 12), source: 'quick_add' },
]

const seedActivities: Activity[] = [
  {
    id: generateId(), activityType: 'run', date: dateStr(7),
    startTime: '07:00', durationMinutes: 45, distanceKm: 7.2,
    calories: 450, caloriesEstimated: false, intensity: 'high',
    notes: 'Morgenrunde im Park', timestamp: ts(7, 7),
  },
  {
    id: generateId(), activityType: 'bike_outdoor', date: dateStr(6),
    startTime: '10:00', durationMinutes: 90, distanceKm: 28.5,
    calories: 720, caloriesEstimated: true, intensity: 'medium',
    notes: 'Wochenendtour Rhein entlang', timestamp: ts(6, 10),
  },
  {
    id: generateId(), activityType: 'strength', date: dateStr(5),
    startTime: '18:30', durationMinutes: 60, distanceKm: undefined,
    calories: 300, caloriesEstimated: true, intensity: 'medium',
    timestamp: ts(5, 18),
  },
  {
    id: generateId(), activityType: 'hike', date: dateStr(4),
    startTime: '09:00', durationMinutes: 180, distanceKm: 14.0,
    calories: 1080, caloriesEstimated: true, intensity: 'medium',
    notes: 'Tageswanderung Siebengebirge', timestamp: ts(4, 9),
  },
  {
    id: generateId(), activityType: 'swim', date: dateStr(3),
    startTime: '07:30', durationMinutes: 40, distanceKm: 1.5,
    calories: 360, caloriesEstimated: true, intensity: 'medium',
    timestamp: ts(3, 7),
  },
  {
    id: generateId(), activityType: 'cornhole', date: dateStr(2),
    startTime: '16:00', durationMinutes: 120,
    calories: 216, caloriesEstimated: true, intensity: 'low',
    notes: 'Vereinsturnier — Platz 2!', timestamp: ts(2, 16),
  },
  {
    id: generateId(), activityType: 'run', date: dateStr(2),
    startTime: '07:00', durationMinutes: 35, distanceKm: 5.5,
    calories: 455, caloriesEstimated: true, intensity: 'high',
    timestamp: ts(2, 7),
  },
  {
    id: generateId(), activityType: 'yoga', date: dateStr(1),
    startTime: '19:00', durationMinutes: 45,
    calories: 108, caloriesEstimated: true, intensity: 'low',
    notes: 'Regeneration nach dem Turnier', timestamp: ts(1, 19),
  },
  {
    id: generateId(), activityType: 'bike_indoor', date: dateStr(0),
    startTime: '08:00', durationMinutes: 50,
    calories: 350, caloriesEstimated: true, intensity: 'medium',
    timestamp: ts(0, 8),
  },
]

function hydEntry(daysAgo: number, hour: number, ml: number, type: HydrationEntry['drinkType'] = 'water'): HydrationEntry {
  return {
    id: generateId(),
    date: dateStr(daysAgo),
    amountMl: ml,
    drinkType: type,
    timestamp: ts(daysAgo, hour),
  }
}

const seedHydration: HydrationEntry[] = [
  hydEntry(7, 7, 500), hydEntry(7, 9, 250), hydEntry(7, 12, 330), hydEntry(7, 15, 500), hydEntry(7, 18, 250, 'tea'),
  hydEntry(6, 7, 500), hydEntry(6, 10, 500), hydEntry(6, 13, 500), hydEntry(6, 16, 330), hydEntry(6, 19, 250, 'tea'),
  hydEntry(5, 8, 250, 'coffee'), hydEntry(5, 10, 330), hydEntry(5, 12, 500), hydEntry(5, 15, 250), hydEntry(5, 20, 500, 'tea'),
  hydEntry(4, 7, 500), hydEntry(4, 9, 500), hydEntry(4, 12, 1000), hydEntry(4, 15, 500), hydEntry(4, 18, 250),
  hydEntry(3, 7, 500), hydEntry(3, 10, 330), hydEntry(3, 13, 250, 'coffee'), hydEntry(3, 16, 500), hydEntry(3, 19, 500, 'juice'),
  hydEntry(2, 7, 330, 'coffee'), hydEntry(2, 10, 500), hydEntry(2, 13, 500), hydEntry(2, 16, 250), hydEntry(2, 20, 330, 'tea'),
  hydEntry(1, 8, 500), hydEntry(1, 11, 250), hydEntry(1, 14, 500, 'juice'), hydEntry(1, 17, 330), hydEntry(1, 21, 250, 'tea'),
  hydEntry(0, 7, 500), hydEntry(0, 9, 250, 'coffee'), hydEntry(0, 11, 330),
]

// === Custom Products ===

const haferflocken: FoodProduct = {
  id: `custom:${generateId()}`,
  source: 'custom',
  name: 'Haferflocken',
  brand: 'Kaufland',
  per100g: { kcal: 372, carbs: 58.7, sugars: 1.1, fat: 7.0, satFat: 1.3, protein: 13.5, fiber: 9.7, salt: 0.01 },
  defaultServingGrams: 60,
}

const banane: FoodProduct = {
  id: `custom:${generateId()}`,
  source: 'custom',
  name: 'Banane',
  per100g: { kcal: 89, carbs: 23.1, sugars: 12.2, fat: 0.3, satFat: 0.1, protein: 1.1, fiber: 2.6, salt: 0.01 },
  defaultServingGrams: 120,
}

const vollkornbrot: FoodProduct = {
  id: `custom:${generateId()}`,
  source: 'custom',
  name: 'Vollkornbrot',
  brand: 'Bäcker Schmidt',
  per100g: { kcal: 237, carbs: 41.3, sugars: 2.1, fat: 3.4, satFat: 0.6, protein: 8.2, fiber: 7.0, salt: 0.9 },
  defaultServingGrams: 50,
}

const seedCustomProducts = [haferflocken, banane, vollkornbrot]

// === Meals ===

function makeMeal(
  daysAgo: number,
  mealType: MealEntry['mealType'],
  hour: number,
  components: Array<{ product: FoodProduct; grams: number }>
): MealEntry {
  const mealComponents = components.map(({ product, grams }) => {
    const computed = computeForAmount(product.per100g, grams)
    return {
      productId: product.id,
      productSource: product.source as 'off' | 'custom',
      nameSnapshot: product.name,
      brandSnapshot: product.brand,
      per100gSnapshot: product.per100g,
      amountGrams: grams,
      computed,
    }
  })
  return {
    id: generateId(),
    date: dateStr(daysAgo),
    mealType,
    time: `${String(hour).padStart(2, '0')}:00`,
    components: mealComponents,
    totals: sumNutrition(mealComponents.map((c) => c.computed)),
    timestamp: ts(daysAgo, hour),
  }
}

const seedMeals: MealEntry[] = []
for (let d = 0; d < 7; d++) {
  seedMeals.push(makeMeal(d, 'breakfast', 7, [
    { product: haferflocken, grams: 60 },
    { product: banane, grams: 120 },
  ]))
  seedMeals.push(makeMeal(d, 'lunch', 12, [
    { product: vollkornbrot, grams: 100 },
  ]))
  seedMeals.push(makeMeal(d, 'dinner', 19, [
    { product: vollkornbrot, grams: 80 },
    { product: banane, grams: 100 },
  ]))
}

// === Weight ===

const seedWeights: WeightEntry[] = []
const startWeight = 82.0
for (let i = 30; i >= 0; i--) {
  const trend = -0.04 * (30 - i)
  const noise = (Math.random() - 0.5) * 0.6
  seedWeights.push({
    id: dateStr(i),
    date: dateStr(i),
    weightKg: Math.round((startWeight + trend + noise) * 10) / 10,
    timestamp: ts(i, 7),
  })
}

// === Blood Pressure ===

const seedBP: BloodPressureEntry[] = []
const bpReadings: Array<{ sys: number; dia: number; pulse?: number }> = [
  { sys: 118, dia: 76, pulse: 62 }, { sys: 122, dia: 79, pulse: 68 },
  { sys: 135, dia: 85, pulse: 72 }, { sys: 128, dia: 82, pulse: 65 },
  { sys: 142, dia: 88, pulse: 74 }, { sys: 119, dia: 77, pulse: 61 },
  { sys: 126, dia: 80, pulse: 70 }, { sys: 138, dia: 86, pulse: 73 },
  { sys: 115, dia: 74, pulse: 58 }, { sys: 124, dia: 78, pulse: 66 },
  { sys: 131, dia: 84, pulse: 69 }, { sys: 120, dia: 78, pulse: 63 },
  { sys: 145, dia: 91, pulse: 77 }, { sys: 117, dia: 75, pulse: 60 },
]
for (let i = 0; i < 14 && i < bpReadings.length; i++) {
  const r = bpReadings[i]
  const category = classifyBP(r.sys, r.dia)
  seedBP.push({
    id: generateId(),
    date: dateStr(13 - i),
    time: i % 3 === 0 ? '07:30' : '08:00',
    systolic: r.sys,
    diastolic: r.dia,
    pulse: r.pulse,
    category,
    timestamp: ts(13 - i, 7),
  })
}

export async function seedIfEmpty(): Promise<void> {
  const existing = await repository.getStepsByDateRange('2026-01-01', '2026-12-31')
  if (existing.length > 0) return

  for (const entry of seedSteps) await repository.addSteps(entry)
  for (const activity of seedActivities) await repository.addActivity(activity)
  for (const entry of seedHydration) await repository.addHydration(entry)

  for (const product of seedCustomProducts) {
    // store directly since addCustomProduct generates a new id
    const all = await repository.getCustomProducts()
    localStorage.setItem('ht_customProducts', JSON.stringify([...all, product]))
  }

  for (const meal of seedMeals) {
    await repository.addMeal(meal)
  }

  for (const entry of seedWeights) {
    await repository.upsertWeightEntry(entry)
  }

  for (const entry of seedBP) {
    // store directly to preserve category
    const all = await repository.getBloodPressureEntries()
    localStorage.setItem('ht_bloodPressure', JSON.stringify([...all, entry]))
  }
}
