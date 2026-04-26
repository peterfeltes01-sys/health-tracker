import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'dd. MMM yyyy', { locale: de })
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'dd.MM.', { locale: de })
}

export function formatWeekday(dateStr: string): string {
  return format(parseISO(dateStr), 'EEE', { locale: de })
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

export function formatSteps(steps: number): string {
  return steps.toLocaleString('de-DE')
}

export function formatCalories(cal: number): string {
  return `${Math.round(cal)} kcal`
}

export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`
}

export function formatHydration(ml: number): string {
  if (ml >= 1000) return `${(ml / 1000).toFixed(1)} L`
  return `${ml} ml`
}

export function formatPercent(value: number, goal: number): number {
  return Math.min(100, Math.round((value / goal) * 100))
}

export function calcAvgSpeed(distanceKm: number, durationMinutes: number): number {
  return distanceKm / (durationMinutes / 60)
}

export function formatSpeed(kmh: number): string {
  return `${kmh.toFixed(1)} km/h`
}

export function calcPace(durationMinutes: number, distanceKm: number): number {
  return durationMinutes / distanceKm
}

export function formatPace(paceMinPerKm: number): string {
  const mins = Math.floor(paceMinPerKm)
  const secs = Math.round((paceMinPerKm - mins) * 60)
  return `${mins}:${secs.toString().padStart(2, '0')} min/km`
}

export function formatElevation(m: number): string {
  return `${Math.round(m)} hm`
}

export function getWeekRange(offsetWeeks: number): { from: string; to: string; label: string } {
  const today = new Date()
  const dayOfWeek = (today.getDay() + 6) % 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - dayOfWeek + offsetWeeks * 7)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const cap = sunday > today ? today : sunday
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const weekNum = getISOWeek(monday)
  const label = offsetWeeks === 0 ? 'Diese Woche' : offsetWeeks === -1 ? 'Letzte Woche' : `KW ${weekNum}`
  return { from: fmt(monday), to: fmt(cap), label }
}

function getISOWeek(date: Date): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
}
