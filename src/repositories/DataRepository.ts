import type {
  StepEntry,
  Activity,
  HydrationEntry,
  UserSettings,
  MealEntry,
  MealType,
  MealTemplate,
  FoodProduct,
  WeightEntry,
  BloodPressureEntry,
  BodyMeasurementEntry,
  CholesterolEntry,
  BloodSugarEntry,
  NoteBoard,
} from '../types'

export interface DataRepository {
  getStepsByDate(date: string): Promise<StepEntry[]>
  getStepsByDateRange(from: string, to: string): Promise<StepEntry[]>
  addSteps(entry: StepEntry): Promise<void>
  deleteSteps(id: string): Promise<void>

  getActivitiesByDate(date: string): Promise<Activity[]>
  getActivitiesByDateRange(from: string, to: string): Promise<Activity[]>
  addActivity(activity: Activity): Promise<void>
  updateActivity(activity: Activity): Promise<void>
  deleteActivity(id: string): Promise<void>

  getHydrationByDate(date: string): Promise<HydrationEntry[]>
  getHydrationByDateRange(from: string, to: string): Promise<HydrationEntry[]>
  addHydration(entry: HydrationEntry): Promise<void>
  deleteHydration(id: string): Promise<void>

  getSettings(): Promise<UserSettings>
  updateSettings(settings: Partial<UserSettings>): Promise<void>

  // Nutrition
  getMealsByDate(date: string): Promise<MealEntry[]>
  getMealsByDateRange(from: string, to: string): Promise<MealEntry[]>
  addMeal(meal: Omit<MealEntry, 'id'>): Promise<string>
  updateMeal(meal: MealEntry): Promise<void>
  deleteMeal(id: string): Promise<void>

  // Custom Products
  getCustomProducts(): Promise<FoodProduct[]>
  addCustomProduct(product: Omit<FoodProduct, 'id' | 'source'>): Promise<string>
  updateCustomProduct(product: FoodProduct): Promise<void>
  deleteCustomProduct(id: string): Promise<void>

  // Meal Templates
  getMealTemplates(mealType?: MealType): Promise<MealTemplate[]>
  saveMealTemplate(template: Omit<MealTemplate, 'id'>): Promise<string>
  incrementTemplateUse(id: string): Promise<void>
  deleteMealTemplate(id: string): Promise<void>

  // Recent Products (OFF cache)
  getRecentProducts(): Promise<FoodProduct[]>
  upsertRecentProduct(product: FoodProduct): Promise<void>

  // Weight
  getWeightEntries(from?: string, to?: string): Promise<WeightEntry[]>
  upsertWeightEntry(entry: Omit<WeightEntry, 'id'>): Promise<void>
  deleteWeightEntry(id: string): Promise<void>

  // Blood Pressure
  getBloodPressureEntries(from?: string, to?: string): Promise<BloodPressureEntry[]>
  addBloodPressureEntry(entry: Omit<BloodPressureEntry, 'id' | 'category'>): Promise<string>
  updateBloodPressureEntry(entry: BloodPressureEntry): Promise<void>
  deleteBloodPressureEntry(id: string): Promise<void>

  // Body Measurements
  getBodyMeasurements(from?: string, to?: string): Promise<BodyMeasurementEntry[]>
  addBodyMeasurement(entry: Omit<BodyMeasurementEntry, 'id'>): Promise<string>
  deleteBodyMeasurement(id: string): Promise<void>

  // Cholesterol
  getCholesterolEntries(from?: string, to?: string): Promise<CholesterolEntry[]>
  addCholesterolEntry(entry: Omit<CholesterolEntry, 'id'>): Promise<string>
  deleteCholesterolEntry(id: string): Promise<void>

  // Blood Sugar
  getBloodSugarEntries(from?: string, to?: string): Promise<BloodSugarEntry[]>
  addBloodSugarEntry(entry: Omit<BloodSugarEntry, 'id'>): Promise<string>
  deleteBloodSugarEntry(id: string): Promise<void>

  // Note Boards
  getNoteBoards(): Promise<NoteBoard[]>
  addNoteBoard(board: Omit<NoteBoard, 'id'>): Promise<string>
  updateNoteBoard(board: NoteBoard): Promise<void>
  deleteNoteBoard(id: string): Promise<void>

  exportAll(): Promise<string>
  importAll(data: string): Promise<void>
  clearAll(): Promise<void>
}
