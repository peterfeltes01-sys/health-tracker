import type { ProgressionDecision } from '../../../types/training'
import type { ProgressionDecisionRepository } from './ProgressionDecisionRepository'
import { generateId } from '../../../utils/calculations'

const KEY = 'health_progression_decisions'

function load(): ProgressionDecision[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

function save(items: ProgressionDecision[]): void {
  localStorage.setItem(KEY, JSON.stringify(items))
}

export class ProgressionDecisionLocalStorageRepository implements ProgressionDecisionRepository {
  async addDecision(decision: Omit<ProgressionDecision, 'id'>): Promise<string> {
    const id = generateId()
    const all = load()
    all.push({ ...decision, id })
    save(all)
    return id
  }

  async getDecisions(exerciseId?: string): Promise<ProgressionDecision[]> {
    const all = load().sort((a, b) => a.timestamp - b.timestamp)
    return exerciseId ? all.filter((d) => d.exerciseId === exerciseId) : all
  }
}
