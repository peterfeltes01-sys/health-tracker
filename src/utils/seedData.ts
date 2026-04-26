import { repository } from '../repositories/LocalStorageRepository'
import type { StepEntry, Activity, HydrationEntry } from '../types'
import { generateId } from './calculations'

function dateStr(daysAgo: number): string {
  const d = new Date('2026-04-26')
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

function ts(daysAgo: number, hour: number): string {
  const d = new Date('2026-04-26')
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

export async function seedIfEmpty(): Promise<void> {
  const existing = await repository.getStepsByDateRange('2026-01-01', '2026-12-31')
  if (existing.length > 0) return

  for (const entry of seedSteps) await repository.addSteps(entry)
  for (const activity of seedActivities) await repository.addActivity(activity)
  for (const entry of seedHydration) await repository.addHydration(entry)
}
