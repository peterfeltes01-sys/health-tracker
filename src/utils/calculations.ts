import { INTENSITY_FACTORS } from './constants'
import type { Activity } from '../types'

export function estimateCalories(
  durationMinutes: number,
  defaultCalPerMin: number,
  intensity: Activity['intensity']
): number {
  return Math.round(durationMinutes * defaultCalPerMin * INTENSITY_FACTORS[intensity])
}

export function getActivityById(activities: { id: string; label: string; icon: string; hasDistance: boolean; defaultCalPerMin: number }[], id: string) {
  return activities.find((a) => a.id === id)
}

export function findSimilarActivity(activities: { id: string; label: string }[], query: string): { id: string; label: string } | undefined {
  const q = query.toLowerCase()
  return activities.find((a) => a.label.toLowerCase().includes(q) || q.includes(a.label.toLowerCase()))
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getDatesInRange(from: string, to: string): string[] {
  const dates: string[] = []
  const current = new Date(from)
  const end = new Date(to)
  while (current <= end) {
    dates.push(toISODate(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
}
