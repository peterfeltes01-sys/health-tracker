import { describe, it, expect } from 'vitest'
import { resolveExerciseMedia, buildDefaultMediaId } from './mediaUtils'
import type { ExerciseMediaSettings } from '../../types/routine'

const URL_A = 'https://example.com/a.jpg'
const URL_B = 'https://example.com/b.jpg'
const ID_A = buildDefaultMediaId(URL_A)
const ID_B = buildDefaultMediaId(URL_B)

function makeSettings(partial: Partial<ExerciseMediaSettings> = {}): ExerciseMediaSettings {
  return {
    exerciseId: 'ex1',
    hiddenDefaults: [],
    customMedia: [],
    primaryMediaId: null,
    updatedAt: Date.now(),
    ...partial,
  }
}

describe('resolveExerciseMedia', () => {
  it('returns all defaults when no override', () => {
    const { items, primary } = resolveExerciseMedia([URL_A, URL_B], null)
    expect(items).toHaveLength(2)
    expect(items[0]).toEqual({ id: ID_A, url: URL_A, kind: 'default' })
    expect(primary?.url).toBe(URL_A)
  })

  it('hides defaults in hiddenDefaults', () => {
    const override = makeSettings({ hiddenDefaults: [ID_A] })
    const { items } = resolveExerciseMedia([URL_A, URL_B], override)
    expect(items).toHaveLength(1)
    expect(items[0].url).toBe(URL_B)
  })

  it('appends custom media after visible defaults', () => {
    const customItem = { id: 'c1', url: 'https://example.com/custom.jpg', storagePath: 's/p', uploadedAt: 0 }
    const override = makeSettings({ customMedia: [customItem] })
    const { items } = resolveExerciseMedia([URL_A], override)
    expect(items).toHaveLength(2)
    expect(items[0].kind).toBe('default')
    expect(items[1].kind).toBe('custom')
    expect(items[1].id).toBe('c1')
  })

  it('uses primaryMediaId to select primary', () => {
    const customItem = { id: 'c1', url: 'https://example.com/custom.jpg', storagePath: 's', uploadedAt: 0 }
    const override = makeSettings({ customMedia: [customItem], primaryMediaId: 'c1' })
    const { primary } = resolveExerciseMedia([URL_A], override)
    expect(primary?.id).toBe('c1')
  })

  it('falls back to first item if primaryMediaId not found', () => {
    const override = makeSettings({ primaryMediaId: 'does-not-exist' })
    const { primary } = resolveExerciseMedia([URL_A, URL_B], override)
    expect(primary?.url).toBe(URL_A)
  })

  it('returns null primary when all defaults hidden and no custom media', () => {
    const override = makeSettings({ hiddenDefaults: [ID_A, ID_B] })
    const { items, primary } = resolveExerciseMedia([URL_A, URL_B], override)
    expect(items).toHaveLength(0)
    expect(primary).toBeNull()
  })

  it('returns empty when no urls and no override', () => {
    const { items, primary } = resolveExerciseMedia([], null)
    expect(items).toHaveLength(0)
    expect(primary).toBeNull()
  })
})
