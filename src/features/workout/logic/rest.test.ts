import { describe, it, expect } from 'vitest'
import { getDefaultRestSeconds } from './rest'

describe('getDefaultRestSeconds', () => {
  it('returns 150 for strength', () => {
    expect(getDefaultRestSeconds('strength')).toBe(150)
  })

  it('returns 90 for hypertrophy', () => {
    expect(getDefaultRestSeconds('hypertrophy')).toBe(90)
  })

  it('returns 40 for endurance', () => {
    expect(getDefaultRestSeconds('endurance')).toBe(40)
  })

  it('returns null for mobility', () => {
    expect(getDefaultRestSeconds('mobility')).toBeNull()
  })
})
