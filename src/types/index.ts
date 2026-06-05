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
  bikeType?: 'mountain' | 'road' | 'trekking' | 'ebike'
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
  drinkType: 'water' | 'tea' | 'coffee' | 'juice' | 'beer' | 'wine' | 'other'
  timestamp: string
}

export interface CustomActivity {
  id: string
  label: string
  icon: string
  hasDistance: boolean
  defaultCalPerMin: number
}

// === Ernährung ===

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface NutritionFacts {
  kcal: number
  carbs: number
  sugars?: number
  fat: number
  satFat: number
  protein: number
  fiber?: number
  salt?: number
}

export interface FoodProduct {
  id: string
  source: 'off' | 'custom'
  externalId?: string
  name: string
  brand?: string
  imageUrl?: string
  per100g: NutritionFacts
  defaultServingGrams?: number
}

export interface MealComponent {
  productId: string
  productSource: 'off' | 'custom'
  nameSnapshot: string
  brandSnapshot?: string
  per100gSnapshot: NutritionFacts
  amountGrams: number
  computed: NutritionFacts
}

export interface MealEntry {
  id: string
  date: string
  mealType: MealType
  time?: string
  components: MealComponent[]
  totals: NutritionFacts
  templateId?: string
  notes?: string
  timestamp: string
}

export interface MealTemplate {
  id: string
  name: string
  mealType: MealType
  components: Omit<MealComponent, 'computed'>[]
  useCount: number
  lastUsed?: string
  createdAt: string
}

// === Gewicht ===

export interface WeightEntry {
  id: string
  date: string
  weightKg: number
  bodyFatPercent?: number
  notes?: string
  timestamp: string
}

// === Körpermaße (Verlauf) ===

export interface BodyMeasurementEntry {
  id: string
  date: string
  waistCm?: number
  hipCm?: number
  abdominalCm?: number
  timestamp: string
}

// === Cholesterin ===

export interface CholesterolEntry {
  id: string
  date: string
  totalMgDl?: number
  ldlMgDl?: number
  hdlMgDl?: number
  triglyceridesMgDl?: number
  notes?: string
  timestamp: string
}

// === Blutzucker ===

export type BloodSugarMeasurementType = 'fasting' | 'postprandial' | 'random'

export interface BloodSugarEntry {
  id: string
  date: string
  valueMgDl: number
  measurementType: BloodSugarMeasurementType
  notes?: string
  timestamp: string
}

// === Blutdruck ===

export type BPCategory =
  | 'optimal'
  | 'normal'
  | 'high-normal'
  | 'grade-1'
  | 'grade-2'
  | 'grade-3'
  | 'isolated-systolic'

export interface BloodPressureEntry {
  id: string
  date: string
  time: string
  systolic: number
  diastolic: number
  pulse?: number
  category: BPCategory
  notes?: string
  timestamp: string
}

// === Notizen ===

export interface NoteItem {
  id: string
  text: string
  checked: boolean
}

export interface NoteBoard {
  id: string
  title: string
  items: NoteItem[]
  color?: string
  reminderDate?: string
  reminderTime?: string
  createdAt: string
  updatedAt: string
}

// === Settings ===

export interface NutritionGoals {
  dailyKcal: number
  carbsPercent: number
  fatPercent: number
  proteinPercent: number
}

export interface DashboardWidgets {
  shortcuts: boolean
  nutrition: boolean
  bodyValues: boolean
  hydration: boolean
  steps: boolean
  activities: boolean
  notes: boolean
  habits: boolean
}

export interface UserSettings {
  dailyStepGoal: number
  dailyHydrationGoalMl: number
  quickAddAmounts: number[]
  customActivities: CustomActivity[]
  theme: 'light' | 'dark' | 'system'
  weeklyCalorieGoal: number
  weeklyActivityGoal: number
  nutritionGoals: NutritionGoals
  heightCm?: number
  waistCm?: number
  hipCm?: number
  abdominalCm?: number
  dashboardWidgets: DashboardWidgets
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
