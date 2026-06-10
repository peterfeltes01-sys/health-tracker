import type { ReadinessCheckin } from '../../../types/training'

export interface ReadinessRepository {
  addCheckin(checkin: Omit<ReadinessCheckin, 'id'>): Promise<string>
  getCheckins(from: string, to: string): Promise<ReadinessCheckin[]>
  getLatestCheckin(): Promise<ReadinessCheckin | null>
}
