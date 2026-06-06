import { describe, it, expect } from 'vitest'
import { analyzeBalance } from './balance'
import type { MuscleVolume, BucketVolume } from './volume'

function makeBuckets(push = 0, pull = 0, legs = 0, core = 0): BucketVolume[] {
  const out: BucketVolume[] = []
  if (push > 0) out.push({ bucket: 'push', sets: push })
  if (pull > 0) out.push({ bucket: 'pull', sets: pull })
  if (legs > 0) out.push({ bucket: 'legs', sets: legs })
  if (core > 0) out.push({ bucket: 'core', sets: core })
  return out
}

describe('analyzeBalance', () => {
  it('warns on push:pull imbalance (too much push)', () => {
    const warnings = analyzeBalance(makeBuckets(20, 10), [])
    expect(warnings.some((w) => w.type === 'push_pull_imbalance')).toBe(true)
    expect(warnings.find((w) => w.type === 'push_pull_imbalance')?.severity).toBe('warn')
  })

  it('warns on push:pull imbalance (too much pull)', () => {
    const warnings = analyzeBalance(makeBuckets(5, 20), [])
    expect(warnings.some((w) => w.type === 'push_pull_imbalance')).toBe(true)
  })

  it('does not warn on balanced push:pull', () => {
    const warnings = analyzeBalance(makeBuckets(15, 15), [])
    expect(warnings.some((w) => w.type === 'push_pull_imbalance')).toBe(false)
  })

  it('does not warn on push:pull when pull is 0', () => {
    const warnings = analyzeBalance(makeBuckets(10, 0), [])
    expect(warnings.some((w) => w.type === 'push_pull_imbalance')).toBe(false)
  })

  it('warns on undertrained muscle (below min)', () => {
    const byMuscle: MuscleVolume[] = [{ muscle: 'chest', sets: 5 }]
    const warnings = analyzeBalance([], byMuscle)
    expect(warnings.some((w) => w.type === 'undertrained')).toBe(true)
    expect(warnings.find((w) => w.type === 'undertrained')?.severity).toBe('info')
  })

  it('warns on overtrained muscle (above max)', () => {
    const byMuscle: MuscleVolume[] = [{ muscle: 'chest', sets: 25 }]
    const warnings = analyzeBalance([], byMuscle)
    expect(warnings.some((w) => w.type === 'overtrained')).toBe(true)
    expect(warnings.find((w) => w.type === 'overtrained')?.severity).toBe('warn')
  })

  it('does not warn when muscle is in healthy range', () => {
    const byMuscle: MuscleVolume[] = [{ muscle: 'chest', sets: 15 }]
    const warnings = analyzeBalance([], byMuscle)
    expect(warnings.some((w) => w.type === 'undertrained' || w.type === 'overtrained')).toBe(false)
  })

  it('warns on neglected bucket (less than 50% of max)', () => {
    const warnings = analyzeBalance(makeBuckets(20, 20, 5, 20), [])
    expect(warnings.some((w) => w.type === 'neglected_bucket')).toBe(true)
  })

  it('returns empty array for empty input', () => {
    const warnings = analyzeBalance([], [])
    expect(warnings).toHaveLength(0)
  })
})
