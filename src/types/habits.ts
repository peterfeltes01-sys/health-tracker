export type HabitType = 'binary' | 'quantified'
export type HabitPolarity = 'positive' | 'negative'
export type HabitFrequency = 'daily' | 'weekdays' | 'timesPerWeek' | 'timesPerMonth'

export interface Habit {
  id: string
  name: string
  icon: string
  color: string
  category: string | null
  type: HabitType
  targetValue: number | null
  targetUnit: string | null
  polarity: HabitPolarity
  frequency: HabitFrequency
  targetWeekdays: number[] | null
  targetCount: number | null
  reminderTime: string | null
  order: number
  createdAt: string
  archivedAt: string | null
}

export interface HabitEntry {
  id: string
  habitId: string
  date: string
  completed: boolean
  value: number | null
  note: string | null
  loggedAt: string
  targetValueSnapshot: number | null
  typeSnapshot: HabitType
}
