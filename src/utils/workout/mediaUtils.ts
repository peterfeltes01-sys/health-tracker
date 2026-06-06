import type { ExerciseMediaSettings, ResolvedMedia } from '../../types/routine'

export function buildDefaultMediaId(url: string): string {
  return `default:${url}`
}

export function resolveExerciseMedia(
  defaultUrls: string[],
  override: ExerciseMediaSettings | null
): { items: ResolvedMedia[]; primary: ResolvedMedia | null } {
  const defaults: ResolvedMedia[] = defaultUrls.map((url) => ({
    id: buildDefaultMediaId(url),
    url,
    kind: 'default',
  }))

  const hidden = new Set(override?.hiddenDefaults ?? [])
  const visibleDefaults = defaults.filter((d) => !hidden.has(d.id))

  const customs: ResolvedMedia[] = (override?.customMedia ?? []).map((m) => ({
    id: m.id,
    url: m.url,
    kind: 'custom',
  }))

  const items: ResolvedMedia[] = [...visibleDefaults, ...customs]

  const primaryId = override?.primaryMediaId ?? null
  const primary =
    primaryId !== null
      ? (items.find((i) => i.id === primaryId) ?? items[0] ?? null)
      : (items[0] ?? null)

  return { items, primary }
}
