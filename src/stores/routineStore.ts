import { create } from 'zustand'
import type { Routine, RoutineExercise } from '../types/routine'
import { getRoutineRepository } from '../lib/routineRepositoryRegistry'
import { reorderExercises } from '../utils/workout/routineUtils'

interface RoutineStoreState {
  routines: Routine[]
  loading: boolean
  error: string | null

  loadRoutines(): Promise<void>
  saveRoutine(data: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>): Promise<Routine>
  updateRoutine(id: string, patch: Partial<Omit<Routine, 'id'>>): Promise<void>
  removeRoutine(id: string): Promise<void>
  reorderRoutineExercises(routineId: string, fromIndex: number, toIndex: number): void
  persistReorder(routineId: string, exercises: RoutineExercise[]): Promise<void>
  reset(): void
}

export const useRoutineStore = create<RoutineStoreState>((set, get) => ({
  routines: [],
  loading: false,
  error: null,

  loadRoutines: async () => {
    set({ loading: true, error: null })
    try {
      const routines = await getRoutineRepository().listRoutines()
      set({ routines, loading: false })
    } catch (e) {
      set({ loading: false, error: String(e) })
    }
  },

  saveRoutine: async (data) => {
    const now = Date.now()
    const routine = await getRoutineRepository().createRoutine({
      ...data,
      createdAt: now,
      updatedAt: now,
    })
    set((s) => ({ routines: [...s.routines, routine] }))
    return routine
  },

  updateRoutine: async (id, patch) => {
    const prev = get().routines
    set((s) => ({
      routines: s.routines.map((r) =>
        r.id === id ? { ...r, ...patch, updatedAt: Date.now() } : r
      ),
    }))
    try {
      await getRoutineRepository().updateRoutine(id, patch)
    } catch (e) {
      set({ routines: prev, error: String(e) })
    }
  },

  removeRoutine: async (id) => {
    const prev = get().routines
    set((s) => ({ routines: s.routines.filter((r) => r.id !== id) }))
    try {
      await getRoutineRepository().deleteRoutine(id)
    } catch (e) {
      set({ routines: prev, error: String(e) })
    }
  },

  reorderRoutineExercises: (routineId, fromIndex, toIndex) => {
    set((s) => ({
      routines: s.routines.map((r) => {
        if (r.id !== routineId) return r
        return { ...r, exercises: reorderExercises(r.exercises, fromIndex, toIndex) }
      }),
    }))
  },

  persistReorder: async (routineId, exercises) => {
    await getRoutineRepository().updateRoutine(routineId, { exercises })
  },

  reset: () => set({ routines: [], loading: false, error: null }),
}))
