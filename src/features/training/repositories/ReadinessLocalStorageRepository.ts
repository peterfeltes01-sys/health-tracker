import type { ReadinessCheckin } from '../../../types/training'
import type { ReadinessRepository } from './ReadinessRepository'
import { generateId } from '../../../utils/calculations'

const KEY = 'health_readiness_checkins'

function load(): ReadinessCheckin[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

function save(items: ReadinessCheckin[]): void {
  localStorage.setItem(KEY, JSON.stringify(items))
}

export class ReadinessLocalStorageRepository implements ReadinessRepository {
  async addCheckin(checkin: Omit<ReadinessCheckin, 'id'>): Promise<string> {
    const id = generateId()
    const all = load()
    all.push({ ...checkin, id })
    save(all)
    return id
  }

  async getCheckins(from: string, to: string): Promise<ReadinessCheckin[]> {
    return load()
      .filter((c) => c.date >= from && c.date <= to)
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  async getLatestCheckin(): Promise<ReadinessCheckin | null> {
    const all = load().sort((a, b) => b.createdAt - a.createdAt)
    return all[0] ?? null
  }
}
