import { describe, it, expect } from 'vitest'
import { computeReadiness, READINESS_WEIGHTS } from './readiness'
import type { WorkoutSession } from '../../types/workout'
import type { BloodPressureEntry } from '../../types'

function makeSession(completedAt: number): WorkoutSession {
  return {
    id: 'x',
    date: '2026-06-01',
    startedAt: completedAt - 3600_000,
    completedAt,
    durationSeconds: 3600,
    mode: 'bodyweight',
    performed: [],
    totalPoints: 10,
    bonusPoints: 0,
  }
}

const fixedNow = new Date('2026-06-10T12:00:00Z')

describe('computeReadiness', () => {
  describe('READINESS_WEIGHTS', () => {
    it('weights sum to 1', () => {
      const sum = Object.values(READINESS_WEIGHTS).reduce((a, b) => a + b, 0)
      expect(sum).toBeCloseTo(1)
    })
  })

  describe('band assignment', () => {
    it('returns FULL band when score >= 70', () => {
      const result = computeReadiness({ recentSessions: [], bpEntries: [], weightEntries: [], now: fixedNow })
      expect(result.band).toBe('FULL')
      expect(result.score).toBeGreaterThanOrEqual(70)
    })

    it('returns RECOVERY band with many sessions, very recent training and bad checkin', () => {
      const sessions = Array.from({ length: 7 }, (_, i) =>
        makeSession(fixedNow.getTime() - i * 3_600_000)
      )
      const result = computeReadiness({
        checkin: { sleep: 1, energy: 1, soreness: 5 },
        recentSessions: sessions,
        bpEntries: [],
        weightEntries: [],
        now: fixedNow,
      })
      expect(result.band).toBe('RECOVERY')
    })
  })

  describe('subjective factor', () => {
    it('good sleep and energy → high subjective', () => {
      const r = computeReadiness({
        checkin: { sleep: 5, energy: 5, soreness: 1 },
        recentSessions: [],
        bpEntries: [],
        weightEntries: [],
        now: fixedNow,
      })
      expect(r.factors.subjective).toBe(100)
    })

    it('bad sleep and soreness → low subjective', () => {
      const r = computeReadiness({
        checkin: { sleep: 1, energy: 1, soreness: 5 },
        recentSessions: [],
        bpEntries: [],
        weightEntries: [],
        now: fixedNow,
      })
      expect(r.factors.subjective).toBe(0)
    })

    it('missing checkin → subjective is undefined', () => {
      const r = computeReadiness({ recentSessions: [], bpEntries: [], weightEntries: [], now: fixedNow })
      expect(r.factors.subjective).toBeUndefined()
    })

    it('partial checkin (only sleep) → uses only sleep', () => {
      const r = computeReadiness({
        checkin: { sleep: 3 },
        recentSessions: [],
        bpEntries: [],
        weightEntries: [],
        now: fixedNow,
      })
      expect(r.factors.subjective).toBeCloseTo(50)
    })
  })

  describe('frequency factor', () => {
    it('0 sessions → frequency 100', () => {
      const r = computeReadiness({ recentSessions: [], bpEntries: [], weightEntries: [], now: fixedNow })
      expect(r.factors.frequency).toBe(100)
    })

    it('7 sessions → frequency 15', () => {
      const sessions = Array.from({ length: 7 }, (_, i) => makeSession(fixedNow.getTime() - i * 86_400_000))
      const r = computeReadiness({ recentSessions: sessions, bpEntries: [], weightEntries: [], now: fixedNow })
      expect(r.factors.frequency).toBe(15)
    })
  })

  describe('recovery factor', () => {
    it('no session → recovery 100', () => {
      const r = computeReadiness({ recentSessions: [], bpEntries: [], weightEntries: [], now: fixedNow })
      expect(r.factors.recovery).toBe(100)
    })

    it('session 2h ago → recovery 20', () => {
      const r = computeReadiness({
        recentSessions: [makeSession(fixedNow.getTime() - 2 * 3_600_000)],
        bpEntries: [],
        weightEntries: [],
        now: fixedNow,
      })
      expect(r.factors.recovery).toBe(20)
    })

    it('session 48h ago → recovery 100', () => {
      const r = computeReadiness({
        recentSessions: [makeSession(fixedNow.getTime() - 48 * 3_600_000)],
        bpEntries: [],
        weightEntries: [],
        now: fixedNow,
      })
      expect(r.factors.recovery).toBe(100)
    })
  })

  describe('bp trend factor', () => {
    it('fewer than 3 entries → bpTrend undefined', () => {
      const r = computeReadiness({
        recentSessions: [],
        bpEntries: [{ id: 'a', date: '2026-06-09', time: '08:00', systolic: 120, diastolic: 80, category: 'optimal', timestamp: '' }],
        weightEntries: [],
        now: fixedNow,
      })
      expect(r.factors.bpTrend).toBeUndefined()
    })

    it('rising trend > 8 mmHg → bpTrend 40', () => {
      const entries: BloodPressureEntry[] = [
        { id: '1', date: '2026-06-04', time: '08:00', systolic: 110, diastolic: 70, category: 'optimal', timestamp: '' },
        { id: '2', date: '2026-06-05', time: '08:00', systolic: 112, diastolic: 72, category: 'optimal', timestamp: '' },
        { id: '3', date: '2026-06-08', time: '08:00', systolic: 122, diastolic: 80, category: 'normal', timestamp: '' },
        { id: '4', date: '2026-06-09', time: '08:00', systolic: 125, diastolic: 82, category: 'normal', timestamp: '' },
      ]
      const r = computeReadiness({ recentSessions: [], bpEntries: entries, weightEntries: [], now: fixedNow })
      expect(r.factors.bpTrend).toBe(40)
    })

    it('stable bp → bpTrend 100', () => {
      const entries: BloodPressureEntry[] = [
        { id: '1', date: '2026-06-04', time: '08:00', systolic: 120, diastolic: 80, category: 'optimal', timestamp: '' },
        { id: '2', date: '2026-06-06', time: '08:00', systolic: 121, diastolic: 80, category: 'optimal', timestamp: '' },
        { id: '3', date: '2026-06-09', time: '08:00', systolic: 120, diastolic: 79, category: 'optimal', timestamp: '' },
      ]
      const r = computeReadiness({ recentSessions: [], bpEntries: entries, weightEntries: [], now: fixedNow })
      expect(r.factors.bpTrend).toBe(100)
    })
  })

  describe('weight trend factor', () => {
    it('too few entries → weightTrend undefined', () => {
      const r = computeReadiness({
        recentSessions: [],
        bpEntries: [],
        weightEntries: [{ id: '1', date: '2026-06-09', weightKg: 75, timestamp: '' }],
        now: fixedNow,
      })
      expect(r.factors.weightTrend).toBeUndefined()
    })

    it('sharp drop > 1.5 kg in recent week → weightTrend 60', () => {
      // "earlier" window: 14–7 days before now (2026-05-27 to 2026-06-02)
      // "recent" window: 7 days before now (2026-06-03 to 2026-06-10)
      const entries = [
        { id: '1', date: '2026-05-28', weightKg: 76.5, timestamp: '' },
        { id: '2', date: '2026-05-30', weightKg: 76.0, timestamp: '' },
        { id: '3', date: '2026-06-07', weightKg: 74.5, timestamp: '' },
        { id: '4', date: '2026-06-09', weightKg: 74.0, timestamp: '' },
      ]
      const r = computeReadiness({ recentSessions: [], bpEntries: [], weightEntries: entries, now: fixedNow })
      expect(r.factors.weightTrend).toBe(60)
    })

    it('stable weight → weightTrend 100', () => {
      const entries = [
        { id: '1', date: '2026-05-28', weightKg: 75.0, timestamp: '' },
        { id: '2', date: '2026-05-30', weightKg: 75.1, timestamp: '' },
        { id: '3', date: '2026-06-07', weightKg: 75.0, timestamp: '' },
        { id: '4', date: '2026-06-09', weightKg: 75.2, timestamp: '' },
      ]
      const r = computeReadiness({ recentSessions: [], bpEntries: [], weightEntries: entries, now: fixedNow })
      expect(r.factors.weightTrend).toBe(100)
    })
  })

  describe('score output', () => {
    it('score is between 0 and 100', () => {
      const r = computeReadiness({ recentSessions: [], bpEntries: [], weightEntries: [], now: fixedNow })
      expect(r.score).toBeGreaterThanOrEqual(0)
      expect(r.score).toBeLessThanOrEqual(100)
    })

    it('works without any optional data (no sessions, no checkin, no bp, no weight)', () => {
      const r = computeReadiness({ recentSessions: [], bpEntries: [], weightEntries: [], now: fixedNow })
      expect(r.score).toBeDefined()
      expect(r.band).toBeDefined()
    })
  })
})
