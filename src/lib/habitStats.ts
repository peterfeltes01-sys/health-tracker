import type { Habit, HabitEntry } from '../types/habits'
import { toISODate } from '../utils/calculations'

export function isEntryFulfilled(entry: HabitEntry, habit: Habit): boolean {
  if (entry.typeSnapshot === 'binary') return entry.completed
  const target = entry.targetValueSnapshot ?? habit.targetValue
  if (target === null || entry.value === null) return entry.completed
  return habit.polarity === 'positive' ? entry.value >= target : entry.value <= target
}

export function isDueOnDate(habit: Habit, date: string): boolean {
  if (habit.frequency === 'daily') return true
  if (habit.frequency === 'weekdays') {
    const dow = new Date(date + 'T12:00:00').getDay()
    return (habit.targetWeekdays ?? [1, 2, 3, 4, 5]).includes(dow)
  }
  // timesPerWeek / timesPerMonth: user can log any day
  return true
}

function getMondayOfWeek(date: string): string {
  const d = new Date(date + 'T12:00:00')
  const dow = d.getDay() === 0 ? 7 : d.getDay()
  d.setDate(d.getDate() - dow + 1)
  return toISODate(d)
}

function getMonthKey(date: string): string {
  return date.slice(0, 7)
}

export function calcCurrentStreak(habit: Habit, entries: HabitEntry[], today: string): number {
  const entryMap = new Map(entries.map((e) => [e.date, e]))

  if (habit.frequency === 'daily' || habit.frequency === 'weekdays') {
    let streak = 0
    const d = new Date(today + 'T12:00:00')
    d.setDate(d.getDate() - 1) // start from yesterday; today is still "open"

    while (true) {
      const date = toISODate(d)
      if (date < habit.createdAt.slice(0, 10)) break
      if (!isDueOnDate(habit, date)) {
        d.setDate(d.getDate() - 1)
        continue
      }
      const entry = entryMap.get(date)
      if (entry && isEntryFulfilled(entry, habit)) {
        streak++
      } else {
        break
      }
      d.setDate(d.getDate() - 1)
    }
    return streak
  }

  if (habit.frequency === 'timesPerWeek' || habit.frequency === 'timesPerMonth') {
    const targetCount = habit.targetCount ?? 1
    const periodMap = new Map<string, HabitEntry[]>()
    for (const entry of entries) {
      const key =
        habit.frequency === 'timesPerWeek'
          ? getMondayOfWeek(entry.date)
          : getMonthKey(entry.date)
      const prev = periodMap.get(key) ?? []
      periodMap.set(key, [...prev, entry])
    }

    let streak = 0
    for (const key of Array.from(periodMap.keys()).sort().reverse()) {
      const fulfilled =
        (periodMap.get(key) ?? []).filter((e) => isEntryFulfilled(e, habit)).length >= targetCount
      if (fulfilled) streak++
      else break
    }
    return streak
  }

  return 0
}

export function calcLongestStreak(habit: Habit, entries: HabitEntry[]): number {
  if (entries.length === 0) return 0
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))

  if (habit.frequency === 'daily' || habit.frequency === 'weekdays') {
    const entryMap = new Map(entries.map((e) => [e.date, e]))
    let max = 0
    let streak = 0
    const from = sorted[0].date
    const to = sorted[sorted.length - 1].date
    const d = new Date(from + 'T12:00:00')
    const end = new Date(to + 'T12:00:00')

    while (d <= end) {
      const date = toISODate(d)
      if (isDueOnDate(habit, date)) {
        const entry = entryMap.get(date)
        if (entry && isEntryFulfilled(entry, habit)) {
          max = Math.max(max, ++streak)
        } else {
          streak = 0
        }
      }
      d.setDate(d.getDate() + 1)
    }
    return max
  }

  if (habit.frequency === 'timesPerWeek' || habit.frequency === 'timesPerMonth') {
    const targetCount = habit.targetCount ?? 1
    const periodMap = new Map<string, HabitEntry[]>()
    for (const entry of entries) {
      const key =
        habit.frequency === 'timesPerWeek'
          ? getMondayOfWeek(entry.date)
          : getMonthKey(entry.date)
      periodMap.set(key, [...(periodMap.get(key) ?? []), entry])
    }

    let max = 0
    let streak = 0
    for (const key of Array.from(periodMap.keys()).sort()) {
      const fulfilled =
        (periodMap.get(key) ?? []).filter((e) => isEntryFulfilled(e, habit)).length >= targetCount
      if (fulfilled) { max = Math.max(max, ++streak) } else { streak = 0 }
    }
    return max
  }

  return 0
}

export function calcCompletionRate(
  habit: Habit,
  entries: HabitEntry[],
  today: string,
  window: 7 | 30 | 90 | 'all'
): number {
  const fromDate = window === 'all'
    ? habit.createdAt.slice(0, 10)
    : (() => {
        const d = new Date(today + 'T12:00:00')
        d.setDate(d.getDate() - (window - 1))
        return toISODate(d)
      })()

  const filtered = entries.filter((e) => e.date >= fromDate && e.date <= today)

  if (habit.frequency === 'daily' || habit.frequency === 'weekdays') {
    const entryMap = new Map(filtered.map((e) => [e.date, e]))
    let due = 0, done = 0
    const d = new Date(fromDate + 'T12:00:00')
    const end = new Date(today + 'T12:00:00')
    while (d <= end) {
      const date = toISODate(d)
      if (isDueOnDate(habit, date)) {
        due++
        const entry = entryMap.get(date)
        if (entry && isEntryFulfilled(entry, habit)) done++
      }
      d.setDate(d.getDate() + 1)
    }
    return due === 0 ? 0 : Math.round((done / due) * 100)
  }

  if (habit.frequency === 'timesPerWeek' || habit.frequency === 'timesPerMonth') {
    const targetCount = habit.targetCount ?? 1
    const periodMap = new Map<string, HabitEntry[]>()
    for (const entry of filtered) {
      const key =
        habit.frequency === 'timesPerWeek'
          ? getMondayOfWeek(entry.date)
          : getMonthKey(entry.date)
      periodMap.set(key, [...(periodMap.get(key) ?? []), entry])
    }

    const periodsInRange = new Set<string>()
    const d = new Date(fromDate + 'T12:00:00')
    const end = new Date(today + 'T12:00:00')
    while (d <= end) {
      periodsInRange.add(
        habit.frequency === 'timesPerWeek'
          ? getMondayOfWeek(toISODate(d))
          : getMonthKey(toISODate(d))
      )
      d.setDate(d.getDate() + 1)
    }

    let fulfilled = 0
    for (const key of periodsInRange) {
      if (
        (periodMap.get(key) ?? []).filter((e) => isEntryFulfilled(e, habit)).length >= targetCount
      ) {
        fulfilled++
      }
    }
    return periodsInRange.size === 0 ? 0 : Math.round((fulfilled / periodsInRange.size) * 100)
  }

  return 0
}

export function getCompletionLevel(entry: HabitEntry | undefined, habit: Habit): number {
  if (!entry) return 0
  if (entry.typeSnapshot === 'binary') return entry.completed ? 1 : 0
  const target = entry.targetValueSnapshot ?? habit.targetValue
  if (target === null || target === 0 || entry.value === null) return entry.completed ? 1 : 0
  if (habit.polarity === 'positive') {
    return Math.min(1, entry.value / target)
  }
  if (entry.value === 0) return 1
  if (entry.value <= target) return 1
  return Math.max(0, 1 - (entry.value - target) / target)
}
