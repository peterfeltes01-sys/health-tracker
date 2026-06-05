import type { ActivityDefinition } from '../types'

export const ACTIVITIES: ActivityDefinition[] = [
  { id: 'walk', label: 'Spaziergang', icon: '🚶', hasDistance: true, defaultCalPerMin: 4 },
  { id: 'hike', label: 'Wandern', icon: '🥾', hasDistance: true, defaultCalPerMin: 6 },
  { id: 'bike_outdoor', label: 'Outdoor-Radtour', icon: '🚴', hasDistance: true, hasWattage: true, defaultCalPerMin: 8 },
  { id: 'bike_indoor', label: 'Indoor-Radtour', icon: '🚲', hasDistance: true, hasWattage: true, defaultCalPerMin: 7 },
  { id: 'run', label: 'Laufen', icon: '🏃', hasDistance: true, defaultCalPerMin: 10 },
  { id: 'swim', label: 'Schwimmen', icon: '🏊', hasDistance: true, defaultCalPerMin: 9 },
  { id: 'strength', label: 'Krafttraining', icon: '💪', hasDistance: false, defaultCalPerMin: 5 },
  { id: 'yoga', label: 'Yoga', icon: '🧘', hasDistance: false, defaultCalPerMin: 3 },
  { id: 'stretching', label: 'Stretching', icon: '🤸', hasDistance: false, defaultCalPerMin: 2 },
  { id: 'cornhole', label: 'Cornhole', icon: '🎯', hasDistance: false, defaultCalPerMin: 3, category: 'sport_sonstige' },
  { id: 'dance', label: 'Tanzen', icon: '💃', hasDistance: false, defaultCalPerMin: 5 },
  { id: 'other', label: 'Sonstige Aktivität', icon: '⚡', hasDistance: false, defaultCalPerMin: 4 },
]

export const INTENSITY_FACTORS = {
  low: 0.8,
  medium: 1.0,
  high: 1.3,
}

export const DEFAULT_NUTRITION_GOALS = {
  dailyKcal: 2000,
  carbsPercent: 50,
  fatPercent: 30,
  proteinPercent: 20,
}

export const DEFAULT_DASHBOARD_WIDGETS = {
  shortcuts: true,
  nutrition: true,
  bodyValues: true,
  hydration: true,
  steps: true,
  activities: true,
  notes: true,
  habits: true,
}

export const DEFAULT_SETTINGS = {
  dailyStepGoal: 10000,
  dailyHydrationGoalMl: 2500,
  quickAddAmounts: [150, 250, 330, 500],
  customActivities: [],
  theme: 'system' as const,
  weeklyCalorieGoal: 2000,
  weeklyActivityGoal: 5,
  nutritionGoals: DEFAULT_NUTRITION_GOALS,
  heightCm: 175,
  waistCm: 0,
  hipCm: 0,
  abdominalCm: 0,
  dashboardWidgets: DEFAULT_DASHBOARD_WIDGETS,
}

export const ACTIVITY_COLORS: Record<string, string> = {
  walk:         '#22c55e',
  hike:         '#16a34a',
  bike_outdoor: '#f97316',
  bike_indoor:  '#fb923c',
  run:          '#ef4444',
  swim:         '#3b82f6',
  strength:     '#8b5cf6',
  yoga:         '#ec4899',
  stretching:   '#f472b6',
  cornhole:     '#eab308',
  dance:        '#f43f5e',
  other:        '#94a3b8',
}

export const HYDRATION_COLORS: Record<string, string> = {
  water:  '#3b82f6',
  tea:    '#84cc16',
  coffee: '#92400e',
  juice:  '#f59e0b',
  other:  '#94a3b8',
}

export const BIKE_TYPES = [
  { value: '', label: 'Nicht angegeben' },
  { value: 'mountain', label: '🚵 Mountainbike' },
  { value: 'road', label: '🚴 Rennrad' },
  { value: 'trekking', label: '🚲 Trekkingbike' },
  { value: 'ebike', label: '⚡ E-Bike' },
]

export const PACE_ACTIVITIES = ['run', 'walk', 'hike']

export const DRINK_TYPES = [
  { id: 'water', label: 'Wasser', icon: '💧' },
  { id: 'coffee', label: 'Kaffee', icon: '☕' },
  { id: 'tea', label: 'Tee', icon: '🍵' },
  { id: 'juice', label: 'Saft', icon: '🥤' },
  { id: 'beer', label: 'Bier', icon: '🍺' },
  { id: 'wine', label: 'Wein', icon: '🍷' },
  { id: 'other', label: 'Sonstiges', icon: '🫗' },
]
