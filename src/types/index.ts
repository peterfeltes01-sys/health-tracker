export interface StepEntry {
  id: string
  date: string
  steps: number
  timestamp: string
  source: 'manual' | 'quick_add'
}

export interface Activity {
  id: string
  activityType: string
  customName?: string
  date: string
  startTime?: string
  durationMinutes: number
  distanceKm?: number
  wattage?: number
  elevationGain?: number
  bikeType?: 'mountain' | 'road' | 'trekking'
  calories?: number
  caloriesEstimated: boolean
  intensity: 'low' | 'medium' | 'high'
  notes?: string
  timestamp: string
}

export interface HydrationEntry {
  id: string
  date: string
  amountMl: number
  drinkType: 'water' | 'tea' | 'coffee' | 'juice' | 'other'
  timestamp: string
}

export interface CustomActivity {
  id: string
  label: string
  icon: string
  hasDistance: boolean
  defaultCalPerMin: number
}

export interface UserSettings {
  dailyStepGoal: number
  dailyHydrationGoalMl: number
  quickAddAmounts: number[]
  customActivities: CustomActivity[]
  theme: 'light' | 'dark' | 'system'
  weeklyCalorieGoal: number
  weeklyActivityGoal: number
}

export interface DailySummary {
  date: string
  totalSteps: number
  totalActivities: number
  totalActivityMinutes: number
  totalCalories: number
  totalHydrationMl: number
}

export interface ActivityDefinition {
  id: string
  label: string
  icon: string
  hasDistance: boolean
  hasWattage?: boolean
  defaultCalPerMin: number
  category?: string
}
