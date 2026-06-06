import type { Routine } from '../types/routine'

export interface RoutineRepository {
  listRoutines(): Promise<Routine[]>
  getRoutine(id: string): Promise<Routine | null>
  createRoutine(data: Omit<Routine, 'id'>): Promise<Routine>
  updateRoutine(id: string, patch: Partial<Omit<Routine, 'id'>>): Promise<void>
  deleteRoutine(id: string): Promise<void>
}
