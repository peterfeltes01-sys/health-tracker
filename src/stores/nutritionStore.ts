import { create } from 'zustand'
import type { MealEntry, MealTemplate, FoodProduct, MealType } from '../types'
import { getRepository } from '../lib/repositoryRegistry'

interface NutritionState {
  meals: MealEntry[]
  customProducts: FoodProduct[]
  templates: MealTemplate[]
  recentProducts: FoodProduct[]
  loading: boolean

  loadMealsByDate: (date: string) => Promise<void>
  loadMealsByRange: (from: string, to: string) => Promise<void>
  addMeal: (meal: Omit<MealEntry, 'id'>) => Promise<string>
  updateMeal: (meal: MealEntry) => Promise<void>
  deleteMeal: (id: string) => Promise<void>

  loadCustomProducts: () => Promise<void>
  addCustomProduct: (product: Omit<FoodProduct, 'id' | 'source'>) => Promise<string>
  updateCustomProduct: (product: FoodProduct) => Promise<void>
  deleteCustomProduct: (id: string) => Promise<void>

  loadTemplates: (mealType?: MealType) => Promise<void>
  saveTemplate: (template: Omit<MealTemplate, 'id'>) => Promise<string>
  incrementTemplateUse: (id: string) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>

  loadRecentProducts: () => Promise<void>
  cacheRecentProduct: (product: FoodProduct) => Promise<void>

  reset: () => void
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  meals: [],
  customProducts: [],
  templates: [],
  recentProducts: [],
  loading: false,

  loadMealsByDate: async (date) => {
    set({ loading: true })
    const meals = await getRepository().getMealsByDate(date)
    set({ meals, loading: false })
  },

  loadMealsByRange: async (from, to) => {
    set({ loading: true })
    const meals = await getRepository().getMealsByDateRange(from, to)
    set({ meals, loading: false })
  },

  addMeal: async (meal) => {
    const id = await getRepository().addMeal(meal)
    set({ meals: [...get().meals, { ...meal, id }] })
    return id
  },

  updateMeal: async (meal) => {
    await getRepository().updateMeal(meal)
    set({ meals: get().meals.map((m) => (m.id === meal.id ? meal : m)) })
  },

  deleteMeal: async (id) => {
    await getRepository().deleteMeal(id)
    set({ meals: get().meals.filter((m) => m.id !== id) })
  },

  loadCustomProducts: async () => {
    const customProducts = await getRepository().getCustomProducts()
    set({ customProducts })
  },

  addCustomProduct: async (product) => {
    const id = await getRepository().addCustomProduct(product)
    const full: FoodProduct = { ...product, id, source: 'custom' }
    set({ customProducts: [...get().customProducts, full] })
    return id
  },

  updateCustomProduct: async (product) => {
    await getRepository().updateCustomProduct(product)
    set({ customProducts: get().customProducts.map((p) => (p.id === product.id ? product : p)) })
  },

  deleteCustomProduct: async (id) => {
    await getRepository().deleteCustomProduct(id)
    set({ customProducts: get().customProducts.filter((p) => p.id !== id) })
  },

  loadTemplates: async (mealType) => {
    const templates = await getRepository().getMealTemplates(mealType)
    set({ templates })
  },

  saveTemplate: async (template) => {
    const id = await getRepository().saveMealTemplate(template)
    set({ templates: [...get().templates, { ...template, id }] })
    return id
  },

  incrementTemplateUse: async (id) => {
    await getRepository().incrementTemplateUse(id)
    set({
      templates: get().templates.map((t) =>
        t.id === id ? { ...t, useCount: (t.useCount ?? 0) + 1, lastUsed: new Date().toISOString() } : t
      ),
    })
  },

  deleteTemplate: async (id) => {
    await getRepository().deleteMealTemplate(id)
    set({ templates: get().templates.filter((t) => t.id !== id) })
  },

  loadRecentProducts: async () => {
    const recentProducts = await getRepository().getRecentProducts()
    set({ recentProducts })
  },

  cacheRecentProduct: async (product) => {
    await getRepository().upsertRecentProduct(product)
    const existing = get().recentProducts.filter((p) => p.id !== product.id)
    set({ recentProducts: [product, ...existing].slice(0, 50) })
  },

  reset: () => set({ meals: [], customProducts: [], templates: [], recentProducts: [], loading: false }),
}))
