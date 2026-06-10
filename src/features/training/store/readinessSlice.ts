import { create } from 'zustand'
import { format, subDays } from 'date-fns'
import type { ReadinessCheckin, ReadinessBand } from '../../../types/training'
import type { WorkoutSession } from '../../../types/workout'
import type { BloodPressureEntry, WeightEntry } from '../../../types'
import { computeReadiness } from '../../../utils/training/readiness'
import { getReadinessRepository } from '../../../lib/readinessRepositoryRegistry'
import { toISODate } from '../../../utils/calculations'

interface ReadinessState {
  currentScore: number | null
  currentBand: ReadinessBand | null
  history: ReadinessCheckin[]
  loading: boolean

  load(uid: string, recentSessions: WorkoutSession[], bpEntries: BloodPressureEntry[], weightEntries: WeightEntry[]): Promise<void>

  saveCheckin(
    checkin: { sleep?: number; energy?: number; soreness?: number } | null,
    recentSessions: WorkoutSession[],
    bpEntries: BloodPressureEntry[],
    weightEntries: WeightEntry[],
    userId: string
  ): Promise<ReadinessCheckin>

  reset(): void
}

export const useReadinessStore = create<ReadinessState>((set, get) => ({
  currentScore: null,
  currentBand: null,
  history: [],
  loading: false,

  load: async (_uid, recentSessions, bpEntries, weightEntries) => {
    set({ loading: true })
    try {
      const repo = getReadinessRepository()
      const today = toISODate(new Date())
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')
      const history = await repo.getCheckins(thirtyDaysAgo, today)

      // Compute readiness from existing data without a new checkin
      const result = computeReadiness({
        recentSessions,
        bpEntries,
        weightEntries,
      })

      set({
        history,
        currentScore: result.score,
        currentBand: result.band,
        loading: false,
      })
    } catch {
      set({ loading: false })
    }
  },

  saveCheckin: async (checkin, recentSessions, bpEntries, weightEntries, userId) => {
    const repo = getReadinessRepository()
    const today = toISODate(new Date())

    const result = computeReadiness({
      checkin: checkin ?? undefined,
      recentSessions,
      bpEntries,
      weightEntries,
    })

    const checkinRecord: Omit<ReadinessCheckin, 'id'> = {
      userId,
      date: today,
      ...(checkin?.sleep !== undefined ? { sleep: checkin.sleep } : {}),
      ...(checkin?.energy !== undefined ? { energy: checkin.energy } : {}),
      ...(checkin?.soreness !== undefined ? { soreness: checkin.soreness } : {}),
      score: result.score,
      band: result.band,
      factors: result.factors,
      createdAt: Date.now(),
    }

    const id = await repo.addCheckin(checkinRecord)
    const saved: ReadinessCheckin = { ...checkinRecord, id }

    set((s) => ({
      history: [...s.history.filter((c) => c.date !== today), saved],
      currentScore: result.score,
      currentBand: result.band,
    }))

    return saved
  },

  reset: () => set({ currentScore: null, currentBand: null, history: [], loading: false }),
}))
